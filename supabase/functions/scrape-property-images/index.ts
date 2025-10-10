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
    console.log('Starting property image scraping');

    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY is not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get properties without images
    const { data: properties, error: fetchError } = await supabaseClient
      .from('properties')
      .select('id, address, city, state, zip_code')
      .eq('source', 'philly-opa')
      .or('image_url.is.null,image_url.eq.')
      .limit(50); // Process 50 at a time

    if (fetchError) {
      throw new Error(`Failed to fetch properties: ${fetchError.message}`);
    }

    console.log(`Found ${properties?.length || 0} properties without images`);

    let updatedCount = 0;

    for (const property of properties || []) {
      try {
        const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;
        console.log(`Fetching image for: ${fullAddress}`);

        // Use Google Street View Static API
        const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_API_KEY}`;

        // Check if Street View image exists
        const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_API_KEY}`;
        const metadataResponse = await fetch(metadataUrl);
        const metadata = await metadataResponse.json();

        if (metadata.status === 'OK') {
          // Update property with Street View image
          const { error: updateError } = await supabaseClient
            .from('properties')
            .update({ image_url: streetViewUrl })
            .eq('id', property.id);

          if (!updateError) {
            updatedCount++;
            console.log(`Updated image for property ${property.id}`);
          } else {
            console.error(`Failed to update property ${property.id}:`, updateError);
          }
        } else {
          console.log(`No Street View available for: ${fullAddress}`);
        }

        // Rate limiting - avoid hitting API limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing property ${property.id}:`, error);
      }
    }

    console.log(`Successfully updated ${updatedCount} properties with images`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Updated ${updatedCount} properties with Street View images`,
      propertiesProcessed: properties?.length || 0,
      propertiesUpdated: updatedCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scrape-property-images function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
