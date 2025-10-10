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
    console.log('Starting multi-source property scraping with Firecrawl');

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
    
    // Property listing sources to scrape
    const sources = [
      {
        name: 'redfin',
        urls: kensingtonZips.map(zip => `https://www.redfin.com/zipcode/${zip}`),
      },
      {
        name: 'zillow',
        urls: kensingtonZips.map(zip => `https://www.zillow.com/homes/${zip}_rb/`),
      },
      {
        name: 'realtor',
        urls: kensingtonZips.map(zip => `https://www.realtor.com/realestateandhomes-search/${zip}`),
      },
    ];

    let totalScraped = 0;
    let totalInserted = 0;
    const allProperties: any[] = [];

    // Scrape each source
    for (const source of sources) {
      console.log(`Scraping ${source.name}...`);
      
      for (const url of source.urls) {
        try {
          console.log(`Scraping URL: ${url}`);
          
          const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: url,
              formats: ['markdown', 'html'],
              onlyMainContent: true,
              waitFor: 2000, // Wait for dynamic content to load
            }),
          });

          if (!response.ok) {
            console.error(`Firecrawl error for ${url}:`, response.status);
            continue;
          }

          const data = await response.json();
          const properties = parsePropertyData(data, source.name);
          
          console.log(`Found ${properties.length} properties from ${source.name}`);
          allProperties.push(...properties);
          totalScraped += properties.length;

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Error scraping ${url}:`, error);
        }
      }
    }

    // Insert properties into database
    for (const property of allProperties) {
      try {
        const { error } = await supabaseClient
          .from('properties')
          .upsert({
            external_id: property.externalId,
            source: property.source,
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
      message: `Scraped ${totalScraped} properties from multiple sources`,
      totalScraped,
      totalInserted,
      sources: sources.map(s => s.name),
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

function parsePropertyData(firecrawlData: any, sourceName: string): any[] {
  const properties: any[] = [];
  
  try {
    const html = firecrawlData.data?.html || '';
    const markdown = firecrawlData.data?.markdown || '';
    
    // Extract JSON-LD structured data (common across all real estate sites)
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
    
    if (jsonLdMatches) {
      jsonLdMatches.forEach((match: string) => {
        try {
          const jsonContent = match.replace(/<script[^>]*>|<\/script>/g, '');
          const jsonData = JSON.parse(jsonContent);
          
          // Handle different JSON-LD formats
          const listings = Array.isArray(jsonData) ? jsonData : [jsonData];
          
          listings.forEach((item: any) => {
            if (item['@type'] === 'Product' || 
                item['@type'] === 'RealEstateListing' || 
                item['@type'] === 'Residence') {
              
              const address = typeof item.address === 'string' 
                ? item.address 
                : item.address?.streetAddress || item.name;
              
              if (address) {
                properties.push({
                  externalId: `${sourceName}-${item.url || address}`.replace(/[^a-zA-Z0-9-]/g, '-'),
                  source: sourceName,
                  address: address,
                  city: item.address?.addressLocality || 'Philadelphia',
                  state: item.address?.addressRegion || 'PA',
                  zipCode: item.address?.postalCode,
                  price: parseFloat(item.offers?.price || item.price || 0),
                  beds: item.numberOfBedrooms || item.bedrooms,
                  baths: item.numberOfBathroomsTotal || item.bathrooms,
                  sqft: item.floorSize?.value || item.squareFeet,
                  propertyType: item.additionalType || 'SINGLE FAMILY',
                  imageUrl: Array.isArray(item.image) ? item.image[0] : item.image,
                  url: item.url,
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

    // Fallback: Try to parse from markdown for additional properties
    if (properties.length === 0 && markdown) {
      // Look for price patterns like $XXX,XXX
      const priceMatches = markdown.match(/\$[\d,]+/g);
      const addressMatches = markdown.match(/\d+\s+[A-Z\s]+(?:ST|AVE|RD|BLVD|LN|DR)/gi);
      
      if (priceMatches && addressMatches && priceMatches.length === addressMatches.length) {
        for (let i = 0; i < Math.min(priceMatches.length, addressMatches.length); i++) {
          const price = parseInt(priceMatches[i].replace(/[$,]/g, ''));
          if (price > 10000) { // Reasonable property price filter
            properties.push({
              externalId: `${sourceName}-${addressMatches[i]}`.replace(/[^a-zA-Z0-9-]/g, '-'),
              source: sourceName,
              address: addressMatches[i],
              price: price,
            });
          }
        }
      }
    }

    console.log(`Parsed ${properties.length} properties from ${sourceName}`);
  } catch (error) {
    console.error(`Error parsing ${sourceName} data:`, error);
  }

  return properties;
}
