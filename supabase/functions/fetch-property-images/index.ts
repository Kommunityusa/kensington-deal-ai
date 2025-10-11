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
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

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

        // Try Google Street View if we have API key
        if (GOOGLE_MAPS_API_KEY && property.address && property.city && property.state && property.zip_code) {
          const streetAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;
          imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${encodeURIComponent(streetAddress)}&key=${GOOGLE_MAPS_API_KEY}`;
          
          // Verify the Street View image exists
          const checkResponse = await fetch(imageUrl);
          if (!checkResponse.ok) {
            imageUrl = null;
          }
        }

        // If Street View didn't work, try to scrape listing URL with Firecrawl
        if (!imageUrl && property.listing_url) {
          try {
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

              // Look for og:image meta tag
              const ogImageMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i);
              if (ogImageMatch) {
                imageUrl = ogImageMatch[1];
              } else {
                // Look for first img tag with property-related class
                const imgMatch = html.match(/<img[^>]*(?:class="[^"]*(?:property|listing|photo)[^"]*")[^>]*src="([^"]+)"/i);
                if (imgMatch) {
                  imageUrl = imgMatch[1];
                }
              }
            }
          } catch (scrapeError) {
            console.error(`Error scraping ${property.listing_url}:`, scrapeError);
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
            console.log(`Updated image for: ${property.address}`);
          }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing property ${property.id}:`, error);
      }
    }

    console.log(`Updated ${updated} property images`);

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
