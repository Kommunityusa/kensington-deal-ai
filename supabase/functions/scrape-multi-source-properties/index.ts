import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    console.log('Starting automated property scraping with Firecrawl');

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
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
    const allProperties: any[] = [];

    // Use Firecrawl's search API to find real estate listings for Kensington
    for (const zipCode of kensingtonZips) {
      try {
        console.log(`Searching for properties in ${zipCode} using Firecrawl search...`);
        
        // Use the search endpoint to find real estate listings
        const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `real estate homes for sale ${zipCode} Philadelphia Kensington`,
            limit: 10,
            scrapeOptions: {
              formats: ['markdown', 'html'],
              onlyMainContent: true,
              waitFor: 2000,
            }
          }),
        });

        if (!searchResponse.ok) {
          console.error(`Firecrawl search error for ${zipCode}:`, searchResponse.status);
          continue;
        }

        const searchData = await searchResponse.json();
        console.log(`Found ${searchData.data?.length || 0} search results for ${zipCode}`);

        // Process each search result
        if (searchData.data && Array.isArray(searchData.data)) {
          for (const result of searchData.data) {
            // Extract properties from the scraped content
            const properties = extractPropertiesFromContent(result, zipCode);
            allProperties.push(...properties);
            totalScraped += properties.length;
          }
        }

        // Rate limiting between searches
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`Error searching for ${zipCode}:`, error);
      }
    }

    // Also try crawling specific real estate sites for Kensington
    const targetSites = [
      `https://www.zillow.com/homes/19125_rb/`,
      `https://www.redfin.com/zipcode/19125`,
    ];

    for (const site of targetSites) {
      try {
        console.log(`Crawling ${site}...`);
        
        // Use map endpoint to get all URLs from the site
        const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: site,
            search: 'property listing',
            limit: 20,
          }),
        });

        if (mapResponse.ok) {
          const mapData = await mapResponse.json();
          console.log(`Found ${mapData.data?.links?.length || 0} property URLs`);

          // Scrape a sample of the found property pages
          const propertyUrls = (mapData.data?.links || []).slice(0, 5);
          
          for (const url of propertyUrls) {
            try {
              const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  url: url,
                  formats: ['markdown', 'html'],
                  onlyMainContent: true,
                  waitFor: 2000,
                }),
              });

              if (scrapeResponse.ok) {
                const scrapeData = await scrapeResponse.json();
                const properties = extractPropertiesFromContent(scrapeData.data, null);
                allProperties.push(...properties);
                totalScraped += properties.length;
              }

              // Rate limiting between scrapes
              await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (err) {
              console.error(`Error scraping ${url}:`, err);
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`Error crawling ${site}:`, error);
      }
    }

    // Insert properties into database
    for (const property of allProperties) {
      try {
        // Validate required fields
        if (!property.address || !property.price || property.price < 1000) {
          continue;
        }

        const { error } = await supabaseClient
          .from('properties')
          .upsert({
            external_id: property.externalId,
            source: property.source || 'firecrawl',
            address: property.address,
            city: property.city || 'Philadelphia',
            state: property.state || 'PA',
            zip_code: property.zipCode,
            price: property.price,
            bedrooms: property.beds,
            bathrooms: property.baths,
            square_feet: property.sqft,
            property_type: property.propertyType || 'SINGLE FAMILY',
            image_url: property.imageUrl || '',
            listing_url: property.url,
            description: property.description || '',
            last_verified_at: new Date().toISOString(),
            is_active: true,
          }, {
            onConflict: 'external_id',
          });

        if (!error) {
          totalInserted++;
        } else {
          console.error('Error inserting property:', error);
        }
      } catch (err) {
        console.error('Error processing property:', err);
      }
    }

    console.log(`Successfully scraped ${totalScraped} and inserted ${totalInserted} properties`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Scraped ${totalScraped} properties using Firecrawl`,
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

function extractPropertiesFromContent(content: any, zipCode: string | null): any[] {
  const properties: any[] = [];
  
  try {
    const html = content.html || '';
    const markdown = content.markdown || '';
    const metadata = content.metadata || {};
    
    // Try to extract structured data from metadata first
    if (metadata.ogImage || metadata.title) {
      const priceMatch = metadata.title?.match(/\$[\d,]+/) || markdown.match(/\$[\d,]+/);
      const addressMatch = metadata.title?.match(/\d+\s+[A-Z\s]+(?:ST|AVE|RD|BLVD|LN|DR)/i) || 
                           markdown.match(/\d+\s+[A-Z\s]+(?:ST|AVE|RD|BLVD|LN|DR)/i);
      
      if (priceMatch && addressMatch) {
        const price = parseInt(priceMatch[0].replace(/[$,]/g, ''));
        if (price > 10000) {
          properties.push({
            externalId: `firecrawl-${addressMatch[0]}`.replace(/[^a-zA-Z0-9-]/g, '-'),
            source: 'firecrawl',
            address: addressMatch[0],
            zipCode: zipCode,
            price: price,
            url: content.url || metadata.ogUrl,
            imageUrl: metadata.ogImage,
            description: metadata.description || metadata.ogDescription,
          });
        }
      }
    }

    // Extract JSON-LD structured data
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
    
    if (jsonLdMatches) {
      jsonLdMatches.forEach((match: string) => {
        try {
          const jsonContent = match.replace(/<script[^>]*>|<\/script>/g, '');
          const jsonData = JSON.parse(jsonContent);
          
          const listings = Array.isArray(jsonData) ? jsonData : [jsonData];
          
          listings.forEach((item: any) => {
            if (item['@type'] === 'Product' || 
                item['@type'] === 'RealEstateListing' || 
                item['@type'] === 'Residence') {
              
              const address = typeof item.address === 'string' 
                ? item.address 
                : item.address?.streetAddress || item.name;
              
              if (address && item.offers?.price) {
                properties.push({
                  externalId: `firecrawl-${address}`.replace(/[^a-zA-Z0-9-]/g, '-'),
                  source: 'firecrawl',
                  address: address,
                  city: item.address?.addressLocality || 'Philadelphia',
                  state: item.address?.addressRegion || 'PA',
                  zipCode: item.address?.postalCode || zipCode,
                  price: parseFloat(item.offers?.price || item.price || 0),
                  beds: item.numberOfBedrooms || item.bedrooms,
                  baths: item.numberOfBathroomsTotal || item.bathrooms,
                  sqft: item.floorSize?.value || item.squareFeet,
                  propertyType: item.additionalType || 'SINGLE FAMILY',
                  imageUrl: Array.isArray(item.image) ? item.image[0] : item.image,
                  url: item.url || content.url,
                  description: item.description,
                });
              }
            }
          });
        } catch (e) {
          console.error('Error parsing JSON-LD:', e);
        }
      });
    }

    // Fallback: Parse from markdown
    if (properties.length === 0 && markdown) {
      const priceMatches = markdown.match(/\$[\d,]+/g) || [];
      const addressMatches = markdown.match(/\d+\s+[A-Z\s]+(?:ST|AVE|RD|BLVD|LN|DR)/gi) || [];
      
      const minLength = Math.min(priceMatches.length, addressMatches.length);
      for (let i = 0; i < minLength; i++) {
        const price = parseInt(priceMatches[i].replace(/[$,]/g, ''));
        if (price > 10000) {
          properties.push({
            externalId: `firecrawl-${addressMatches[i]}`.replace(/[^a-zA-Z0-9-]/g, '-'),
            source: 'firecrawl',
            address: addressMatches[i],
            zipCode: zipCode,
            price: price,
            url: content.url,
          });
        }
      }
    }

    console.log(`Extracted ${properties.length} properties from content`);
  } catch (error) {
    console.error(`Error extracting properties:`, error);
  }

  return properties;
}