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

    // Fetch 2 properties at a time to use both concurrent browsers
    const { data: properties, error: fetchError } = await supabaseClient
      .from('properties')
      .select('id, address, city, state, zip_code, image_url, listing_url')
      .eq('source', 'rentcast')
      .or('image_url.is.null,image_url.eq.')
      .limit(2);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${properties?.length || 0} properties to update`);

    // Process properties in parallel using both concurrent browsers
    const processProperty = async (property: any) => {
      const fullAddress = `${property.address}, ${property.city || 'Philadelphia'}, ${property.state || 'PA'} ${property.zip_code}`;
      let imageUrl = null;

      try {
        // Search for the property address to find listing pages
        const searchQuery = `${fullAddress}`;
        console.log(`Searching for: ${searchQuery}`);
        
        const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 1,
          }),
        });

        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          console.error(`Search failed: ${errorText}`);
          return 0;
        }

        const searchData = await searchResponse.json();
        
        if (!searchData.data || searchData.data.length === 0) {
          console.log(`No search results for: ${property.address}`);
          return 0;
        }

        const firstResultUrl = searchData.data[0].url;
        console.log(`Found listing: ${firstResultUrl}, scraping for image...`);

        // Scrape the listing page to extract the property image
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: firstResultUrl,
            formats: ['markdown'],
            onlyMainContent: false,
          }),
        });

        if (!scrapeResponse.ok) {
          const errorText = await scrapeResponse.text();
          console.error(`Scrape failed: ${errorText}`);
          return 0;
        }

        const scrapeData = await scrapeResponse.json();
        
        // Extract image URL from scrape metadata
        if (scrapeData.data?.metadata?.ogImage) {
          imageUrl = scrapeData.data.metadata.ogImage;
          console.log(`Extracted image: ${imageUrl}`);
        } else {
          console.log(`No image found in metadata for: ${property.address}`);
          return 0;
        }

      } catch (searchError) {
        console.error(`Error processing ${fullAddress}:`, searchError);
        return 0;
      }

      if (imageUrl) {
        try {
          // Download the image
          console.log(`Downloading image from: ${imageUrl}`);
          const imageResponse = await fetch(imageUrl);
          
          if (imageResponse.ok) {
            const imageBlob = await imageResponse.blob();
            const arrayBuffer = await imageBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Generate a unique filename
            const fileExt = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
            const fileName = `${property.id}.${fileExt}`;
            
            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
              .from('property-images')
              .upload(fileName, uint8Array, {
                contentType: imageBlob.type || 'image/jpeg',
                upsert: true
              });
            
            if (!uploadError && uploadData) {
              // Get public URL
              const { data: { publicUrl } } = supabaseClient.storage
                .from('property-images')
                .getPublicUrl(fileName);
              
              // Update property with Supabase Storage URL
              const { error: updateError } = await supabaseClient
                .from('properties')
                .update({ image_url: publicUrl })
                .eq('id', property.id);
              
              if (!updateError) {
                console.log(`Successfully updated image for: ${property.address}`);
                return 1;
              } else {
                console.error(`Error updating ${property.address}:`, updateError);
              }
            } else {
              console.error(`Failed to upload image for ${property.address}:`, uploadError);
            }
          } else {
            console.error(`Failed to download image from ${imageUrl}: ${imageResponse.status}`);
          }
        } catch (downloadError) {
          console.error(`Error downloading/storing image for ${property.address}:`, downloadError);
        }
      }

      return 0;
    };

    // Process both properties in parallel
    const results = await Promise.all(
      (properties || []).map(property => processProperty(property))
    );
    
    const updated: number = results.reduce((sum: number, result: number) => sum + result, 0);

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
