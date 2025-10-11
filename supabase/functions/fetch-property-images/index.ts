import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching images for properties using Firecrawl');

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch properties without images or with empty image_url
    const { data: properties, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .eq('is_active', true)
      .or('image_url.is.null,image_url.eq.')
      .limit(10);

    if (fetchError) {
      console.error('Error fetching properties:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${properties?.length || 0} properties without images`);

    let updated = 0;

    for (const property of properties || []) {
      try {
        let imageUrl = null;

        // Try to scrape listing URL with Firecrawl
        if (property.listing_url) {
          console.log(`Scraping ${property.listing_url} for property ${property.address}`);
          
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            },
            body: JSON.stringify({
              url: property.listing_url,
              formats: ['html'],
            }),
          });

          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json();
            const html = scrapeData.data?.html || '';

            // Look for og:image meta tag first (usually best quality)
            const ogImageMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i);
            if (ogImageMatch) {
              imageUrl = ogImageMatch[1];
              console.log(`Found og:image: ${imageUrl}`);
            } else {
              // Look for twitter:image as fallback
              const twitterImageMatch = html.match(/<meta\s+(?:property|name)="twitter:image"\s+content="([^"]+)"/i);
              if (twitterImageMatch) {
                imageUrl = twitterImageMatch[1];
                console.log(`Found twitter:image: ${imageUrl}`);
              } else {
                // Look for first img tag with property-related attributes
                const imgMatch = html.match(/<img[^>]*(?:class="[^"]*(?:property|listing|photo|hero|main)[^"]*"|id="[^"]*(?:property|listing|photo|hero|main)[^"]*")[^>]*src="([^"]+)"/i);
                if (imgMatch) {
                  imageUrl = imgMatch[1];
                  console.log(`Found image from img tag: ${imageUrl}`);
                } else {
                  // Last resort: get first img with reasonable size
                  const anyImgMatch = html.match(/<img[^>]*src="([^"]+)"[^>]*(?:width|height)="[5-9]\d{2,}"/i);
                  if (anyImgMatch) {
                    imageUrl = anyImgMatch[1];
                    console.log(`Found fallback image: ${imageUrl}`);
                  }
                }
              }
            }
          } else {
            console.error(`Failed to scrape ${property.listing_url}, status: ${scrapeResponse.status}`);
          }
        }

        if (imageUrl) {
          // Update property with image
          const { error: updateError } = await supabase
            .from('properties')
            .update({ image_url: imageUrl })
            .eq('id', property.id);

          if (updateError) {
            console.error(`Error updating property ${property.id}:`, updateError);
          } else {
            updated++;
            console.log(`✓ Updated image for: ${property.address}`);
          }
        } else {
          console.log(`✗ No image found for: ${property.address}`);
        }

        // Rate limiting - be nice to Firecrawl API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing property ${property.id}:`, error);
      }
    }

    console.log(`Completed: Updated ${updated} out of ${properties?.length || 0} properties`);

    return new Response(
      JSON.stringify({
        success: true,
        total: properties?.length || 0,
        updated,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error fetching property images:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
