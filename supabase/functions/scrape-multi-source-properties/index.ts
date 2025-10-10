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
    if (!RENTCAST_API_KEY) {
      throw new Error('RENTCAST_API_KEY is not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Kensington zip codes
    const kensingtonZips = ['19125', '19134', '19122', '19137'];
    
    let totalScraped = 0;
    let totalInserted = 0;

    // Fetch properties from Rentcast API for each zip code
    for (const zipCode of kensingtonZips) {
      try {
        console.log(`Fetching properties for zip code ${zipCode} from Rentcast...`);
        
        // Call Rentcast API to get property listings
        const rentcastUrl = new URL('https://api.rentcast.io/v1/listings/sale');
        rentcastUrl.searchParams.append('zipCode', zipCode);
        rentcastUrl.searchParams.append('status', 'Active');
        rentcastUrl.searchParams.append('limit', '100');

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
          try {
            totalScraped++;

            // Validate required fields
            if (!listing.addressLine1 || !listing.price || listing.price < 1000) {
              continue;
            }

            // Map Rentcast data to our schema
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
              image_url: listing.images?.[0] || null,
              listing_url: listing.url || null,
              description: listing.description || null,
              year_built: listing.yearBuilt || null,
              lot_size: listing.lotSize || null,
              last_verified_at: new Date().toISOString(),
              is_active: true,
              listing_type: 'scraped',
            };

            // Insert into database
            const { error } = await supabaseClient
              .from('properties')
              .upsert(property, {
                onConflict: 'external_id',
              });

            if (!error) {
              totalInserted++;
              console.log(`Inserted property: ${property.address}`);
            } else {
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
