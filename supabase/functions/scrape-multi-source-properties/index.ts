import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting automated property scraping with Rentcast API');

    const RENTCAST_API_KEY = Deno.env.get('RENTCAST_API_KEY');
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!RENTCAST_API_KEY) {
      throw new Error('RENTCAST_API_KEY is not configured');
    }
    
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Kensington zip codes
    const kensingtonZips = ['19125', '19134', '19122', '19137'];
    
    let totalScraped = 0;
    let totalInserted = 0;
    const MAX_PROPERTIES = 50;

    // Fetch properties from Rentcast API for each zip code
    for (const zipCode of kensingtonZips) {
      if (totalScraped >= MAX_PROPERTIES) break;
      try {
        console.log(`Fetching properties for zip code ${zipCode} from Rentcast...`);
        
        // Call Rentcast API to get property listings
        const rentcastUrl = new URL('https://api.rentcast.io/v1/listings/sale');
        rentcastUrl.searchParams.append('zipCode', zipCode);
        rentcastUrl.searchParams.append('status', 'Active');
        const remainingLimit = Math.min(50, MAX_PROPERTIES - totalScraped);
        rentcastUrl.searchParams.append('limit', remainingLimit.toString());

        const response = await fetch(rentcastUrl.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-Api-Key': RENTCAST_API_KEY,
          },
        });

        if (!response.ok) {
          console.error(`Rentcast API error for ${zipCode}:`, response.status, await response.text());
          continue;
        }

        const listings = await response.json();
        console.log(`Found ${listings.length || 0} listings for ${zipCode}`);

        // Process each listing
        for (const listing of listings || []) {
          if (totalScraped >= MAX_PROPERTIES) break;
          
          try {
            totalScraped++;
            
            // Validate required fields
            if (!listing.addressLine1 || !listing.price || listing.price < 1000) {
              continue;
            }

            // Map Rentcast data to our schema - insert without image first
            const property = {
              external_id: listing.id || `rentcast-${zipCode}-${totalScraped}`,
              source: 'rentcast',
              address: listing.addressLine1,
              city: listing.city || 'Philadelphia',
              state: listing.state || 'PA',
              zip_code: listing.zipCode || zipCode,
              price: listing.price,
              bedrooms: listing.bedrooms || null,
              bathrooms: listing.bathrooms || null,
              square_feet: listing.squareFootage || null,
              property_type: listing.propertyType || 'Single Family',
              image_url: null, // Will be updated in background
              listing_url: listing.url || null,
              description: listing.description || null,
              year_built: listing.yearBuilt || null,
              lot_size: listing.lotSize || null,
              last_verified_at: new Date().toISOString(),
              is_active: true,
              listing_type: 'scraped',
            };

            // Insert into database
            const { data: insertedProperty, error } = await supabaseClient
              .from('properties')
              .upsert(property, {
                onConflict: 'external_id',
              })
              .select()
              .single();

            if (!error && insertedProperty) {
              totalInserted++;
              console.log(`Inserted property: ${property.address}`);
              
              // Fetch image in background using address search
              (async () => {
                try {
                  const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;
                  let imageUrl = null;
                  
                  // First try: If listing URL exists, scrape it
                  if (listing.url) {
                    console.log(`Background: Scraping listing URL for ${fullAddress}`);
                    try {
                      const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          url: listing.url,
                          formats: ['markdown', 'html'],
                          onlyMainContent: true,
                        }),
                      });

                      if (firecrawlResponse.ok) {
                        const firecrawlData = await firecrawlResponse.json();
                        
                        if (firecrawlData.data?.metadata?.ogImage) {
                          imageUrl = firecrawlData.data.metadata.ogImage;
                        } else if (firecrawlData.data?.html) {
                          const imgMatch = firecrawlData.data.html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
                          if (imgMatch && imgMatch[1]) {
                            imageUrl = imgMatch[1];
                          }
                        }
                      }
                    } catch (urlError) {
                      console.error(`Error scraping listing URL:`, urlError);
                    }
                  }
                  
                  // Second try: Search for property images using the address
                  if (!imageUrl) {
                    console.log(`Background: Searching for images of ${fullAddress}`);
                    const searchQuery = encodeURIComponent(`${fullAddress} property for sale`);
                    const searchUrl = `https://www.zillow.com/homes/${searchQuery}`;
                    
                    try {
                      const searchResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          url: searchUrl,
                          formats: ['html'],
                          onlyMainContent: false,
                        }),
                      });

                      if (searchResponse.ok) {
                        const searchData = await searchResponse.json();
                        if (searchData.data?.html) {
                          // Look for property images in search results
                          const imgMatches = searchData.data.html.match(/<img[^>]+src=["']([^"']+)["'][^>]*alt=["'][^"']*property[^"']*["'][^>]*>/gi);
                          if (imgMatches && imgMatches[0]) {
                            const srcMatch = imgMatches[0].match(/src=["']([^"']+)["']/i);
                            if (srcMatch && srcMatch[1]) {
                              imageUrl = srcMatch[1];
                            }
                          }
                        }
                      }
                    } catch (searchError) {
                      console.error(`Error searching for property images:`, searchError);
                    }
                  }
                  
                  if (imageUrl) {
                    await supabaseClient
                      .from('properties')
                      .update({ image_url: imageUrl })
                      .eq('id', insertedProperty.id);
                    console.log(`Background: Updated image for ${fullAddress}: ${imageUrl}`);
                  } else {
                    console.log(`Background: No image found for ${fullAddress}`);
                  }
                } catch (bgError) {
                  console.error(`Background: Error fetching image:`, bgError);
                }
              })(); // Fire and forget
            } else if (error) {
              console.error('Error inserting property:', error);
            }

          } catch (propertyError) {
            console.error('Error processing individual property:', propertyError);
          }
        }

        // Rate limiting between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error fetching properties for ${zipCode}:`, error);
      }
    }

    console.log(`Successfully scraped ${totalScraped} and inserted ${totalInserted} properties from Rentcast`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Scraped ${totalScraped} properties using Rentcast API`,
      totalScraped,
      totalInserted,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scrape-multi-source-properties function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
