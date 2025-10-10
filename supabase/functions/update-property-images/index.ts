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

    // Fetch only 5 properties at a time to respect Firecrawl free tier rate limits (50/min)
    const { data: properties, error: fetchError } = await supabaseClient
      .from('properties')
      .select('id, address, city, state, zip_code, image_url, listing_url')
      .eq('source', 'rentcast')
      .or('image_url.is.null,image_url.eq.')
      .limit(5); // Process 5 at a time to stay well within rate limits

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${properties?.length || 0} properties to update`);

    let updated = 0;
    for (const property of properties || []) {
      const fullAddress = `${property.address}, ${property.city || 'Philadelphia'}, ${property.state || 'PA'} ${property.zip_code}`;
      let imageUrl = null;

      try {
        // Use Firecrawl to search for property images
        const searchQuery = `${fullAddress} property`;
        console.log(`Searching for images for: ${searchQuery}`);
        
        const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 3,
          }),
        });

        if (firecrawlResponse.ok) {
          const firecrawlData = await firecrawlResponse.json();
          console.log(`Search response for ${fullAddress}:`, JSON.stringify(firecrawlData).substring(0, 300));
          
          // Try to get image from search results
          if (firecrawlData.data && firecrawlData.data.length > 0) {
            for (const result of firecrawlData.data) {
              if (result.metadata?.ogImage) {
                imageUrl = result.metadata.ogImage;
                console.log(`Found OG image from search: ${imageUrl}`);
                break;
              }
            }
          }
        } else {
          const errorText = await firecrawlResponse.text();
          console.error(`Firecrawl search failed with status ${firecrawlResponse.status}: ${errorText}`);
        }
      } catch (searchError) {
        console.error(`Error searching for ${fullAddress}:`, searchError);
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
      } else {
        console.log(`No image found for: ${property.address}`);
      }

      // Rate limiting - 12 second delay to ensure we stay under 5 requests/minute
      await new Promise(resolve => setTimeout(resolve, 12000));
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
