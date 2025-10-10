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
    console.log('Starting property image update with Firecrawl');

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all rentcast properties without images (null or empty)
    const { data: properties, error: fetchError } = await supabaseClient
      .from('properties')
      .select('id, address, city, state, zip_code, image_url, listing_url')
      .eq('source', 'rentcast')
      .or('image_url.is.null,image_url.eq.');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${properties?.length || 0} properties to update`);

    let updated = 0;
    for (const property of properties || []) {
      const fullAddress = `${property.address}, ${property.city || 'Philadelphia'}, ${property.state || 'PA'} ${property.zip_code}`;
      let imageUrl = null;

      // First try: If listing URL exists, scrape it
      if (property.listing_url && property.listing_url.trim() !== '') {
        try {
          console.log(`Scraping listing URL: ${property.listing_url} for ${fullAddress}`);
          const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: property.listing_url,
              formats: ['markdown', 'html'],
              onlyMainContent: true,
            }),
          });

          if (firecrawlResponse.ok) {
            const firecrawlData = await firecrawlResponse.json();
            console.log(`Firecrawl response for ${fullAddress}:`, JSON.stringify(firecrawlData).substring(0, 200));
            
            if (firecrawlData.data?.metadata?.ogImage) {
              imageUrl = firecrawlData.data.metadata.ogImage;
              console.log(`Found OG image: ${imageUrl}`);
            } else if (firecrawlData.data?.html) {
              const imgMatch = firecrawlData.data.html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
              if (imgMatch && imgMatch[1]) {
                imageUrl = imgMatch[1];
                console.log(`Found img tag: ${imageUrl}`);
              }
            }
          } else {
            console.error(`Firecrawl request failed with status ${firecrawlResponse.status}`);
          }
        } catch (urlError) {
          console.error(`Error scraping listing URL for ${fullAddress}:`, urlError);
        }
      }

      if (imageUrl) {
        const { error: updateError } = await supabaseClient
          .from('properties')
          .update({ image_url: imageUrl })
          .eq('id', property.id);

        if (!updateError) {
          updated++;
          console.log(`Updated image for: ${property.address}`);
        } else {
          console.error(`Error updating ${property.address}:`, updateError);
        }
      }

      // Rate limiting to avoid overwhelming Firecrawl API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Successfully updated ${updated} property images`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Updated ${updated} property images with Firecrawl`,
      total: properties?.length || 0,
      updated
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in update-property-images function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
