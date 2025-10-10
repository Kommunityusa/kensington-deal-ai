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
    console.log('Starting Redfin property scraping with Firecrawl');

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { zipCode } = await req.json();
    const targetZipCode = zipCode || '19125'; // Default to Kensington area

    // Firecrawl API endpoint for scraping
    const firecrawlUrl = 'https://api.firecrawl.dev/v1/scrape';
    
    // Redfin search URL for the zip code
    const redfinSearchUrl = `https://www.redfin.com/zipcode/${targetZipCode}`;
    
    console.log(`Scraping Redfin for zip code: ${targetZipCode}`);

    const response = await fetch(firecrawlUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: redfinSearchUrl,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firecrawl API error:', errorText);
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Firecrawl response received');

    // Parse the scraped data
    const scrapedProperties = parseRedfinData(data);
    console.log(`Parsed ${scrapedProperties.length} properties from Redfin`);

    // Insert properties into database
    let insertedCount = 0;
    for (const property of scrapedProperties) {
      try {
        const { error } = await supabaseClient
          .from('properties')
          .upsert({
            external_id: `redfin-${property.mlsNumber || property.address}`,
            source: 'redfin',
            address: property.address,
            city: property.city || 'Philadelphia',
            state: property.state || 'PA',
            zip_code: property.zipCode || targetZipCode,
            price: property.price,
            bedrooms: property.beds,
            bathrooms: property.baths,
            square_feet: property.sqft,
            property_type: property.propertyType || 'SINGLE FAMILY',
            image_url: property.imageUrl,
            listing_url: property.url,
            description: property.description,
          }, {
            onConflict: 'external_id',
          });

        if (!error) {
          insertedCount++;
        } else {
          console.error('Error inserting property:', error);
        }
      } catch (err) {
        console.error('Error processing property:', err);
      }
    }

    console.log(`Successfully inserted/updated ${insertedCount} properties`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Scraped and saved ${insertedCount} properties from Redfin`,
      propertiesScraped: scrapedProperties.length,
      propertiesInserted: insertedCount,
      zipCode: targetZipCode,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scrape-redfin-properties function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseRedfinData(firecrawlData: any): any[] {
  const properties: any[] = [];
  
  try {
    // Extract property listings from the scraped data
    // This is a simplified parser - you may need to adjust based on actual Redfin HTML structure
    const markdown = firecrawlData.data?.markdown || '';
    const html = firecrawlData.data?.html || '';
    
    // Look for property data in the markdown/html
    // Redfin typically embeds property data in JSON-LD format or data attributes
    
    // Try to find JSON-LD data
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
    if (jsonLdMatch) {
      jsonLdMatch.forEach((match: string) => {
        try {
          const jsonData = JSON.parse(match.replace(/<script[^>]*>|<\/script>/g, ''));
          if (jsonData['@type'] === 'Product' || jsonData['@type'] === 'RealEstateListing') {
            properties.push({
              address: jsonData.name || jsonData.address?.streetAddress,
              city: jsonData.address?.addressLocality,
              state: jsonData.address?.addressRegion,
              zipCode: jsonData.address?.postalCode,
              price: parseFloat(jsonData.offers?.price || 0),
              imageUrl: jsonData.image?.[0] || jsonData.image,
              url: jsonData.url,
              description: jsonData.description,
            });
          }
        } catch (e) {
          console.error('Error parsing JSON-LD:', e);
        }
      });
    }

    console.log(`Parsed ${properties.length} properties from structured data`);
  } catch (error) {
    console.error('Error parsing Redfin data:', error);
  }

  return properties;
}
