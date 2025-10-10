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
    console.log('Starting property image update with Google Street View');

    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY is not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all rentcast properties with missing or placeholder images
    const { data: properties, error: fetchError } = await supabaseClient
      .from('properties')
      .select('id, address, city, state, zip_code, image_url')
      .eq('source', 'rentcast')
      .or('image_url.is.null,image_url.like.%unsplash%,image_url.like.%placeholder%');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${properties?.length || 0} properties to update`);

    let updated = 0;
    for (const property of properties || []) {
      const fullAddress = `${property.address}, ${property.city || 'Philadelphia'}, ${property.state || 'PA'} ${property.zip_code}`;
      const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_API_KEY}`;

      const { error: updateError } = await supabaseClient
        .from('properties')
        .update({ image_url: streetViewUrl })
        .eq('id', property.id);

      if (!updateError) {
        updated++;
        console.log(`Updated image for: ${property.address}`);
      } else {
        console.error(`Error updating ${property.address}:`, updateError);
      }
    }

    console.log(`Successfully updated ${updated} property images`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Updated ${updated} property images with Google Street View`,
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
