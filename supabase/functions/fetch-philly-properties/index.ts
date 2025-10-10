import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PhillyOPAProperty {
  location: string;
  market_value: number;
  market_value_date: string;
  sale_price: number;
  sale_date: string;
  number_of_bedrooms?: number;
  number_of_bathrooms?: number;
  total_livable_area?: number;
  year_built?: number;
  total_area?: number;
  parcel_number: string;
  zip_code?: string;
  category_code_description?: string;
  building_code_description?: string;
  owner_1?: string;
  lat?: number;
  lng?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Philadelphia OPA property fetch');

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch from Philadelphia's official Open Data API (Carto)
    // This pulls recent sales and active properties from public records
    const phillyApiUrl = 'https://phl.carto.com/api/v2/sql?q=' + 
      encodeURIComponent(
        `SELECT 
          location, 
          market_value, 
          market_value_date, 
          sale_price, 
          sale_date,
          number_of_bedrooms,
          number_of_bathrooms,
          total_livable_area,
          year_built,
          total_area,
          parcel_number,
          zip_code,
          category_code_description,
          building_code_description,
          owner_1,
          ST_Y(the_geom) AS lat,
          ST_X(the_geom) AS lng
        FROM opa_properties_public 
        WHERE sale_price > 0 
          AND sale_date > (CURRENT_DATE - INTERVAL '2 years')
          AND market_value > 50000
          AND total_livable_area > 0
          AND zip_code IS NOT NULL
        ORDER BY sale_date DESC 
        LIMIT 500`
      ) + '&format=json';

    console.log('Fetching from Philadelphia OPA API...');
    
    const response = await fetch(phillyApiUrl);
    
    if (!response.ok) {
      throw new Error(`Philadelphia API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const properties = data.rows as PhillyOPAProperty[];
    
    console.log(`Received ${properties.length} properties from Philadelphia OPA`);

    // Transform the data to match our schema
    const transformedProperties = properties.map((prop) => {
      // Use market value or sale price, whichever is more recent
      const useMarketValue = prop.market_value_date && 
        (!prop.sale_date || new Date(prop.market_value_date) > new Date(prop.sale_date));
      
      const price = useMarketValue ? prop.market_value : (prop.sale_price || prop.market_value);
      
      return {
        external_id: `philly-opa-${prop.parcel_number}`,
        address: prop.location || 'Address not available',
        city: 'Philadelphia',
        state: 'PA',
        zip_code: prop.zip_code || '',
        price: Math.floor(price || 0),
        bedrooms: prop.number_of_bedrooms || 0,
        bathrooms: prop.number_of_bathrooms || 0,
        square_feet: Math.floor(prop.total_livable_area || 0),
        property_type: prop.category_code_description || prop.building_code_description || 'Residential',
        image_url: '', // Public records don't have images
        listing_url: `https://property.phila.gov/?p=${prop.parcel_number}`,
        description: `${prop.building_code_description || 'Property'} in Philadelphia. Owner: ${prop.owner_1 || 'Not disclosed'}. Last sale: ${prop.sale_date || 'N/A'}`,
        year_built: prop.year_built || null,
        lot_size: Math.floor(prop.total_area || 0),
        source: 'philly-opa',
        last_verified_at: new Date().toISOString(),
        is_active: true
      };
    });

    // Get existing properties from database
    const { data: existingProperties } = await supabaseClient
      .from('properties')
      .select('external_id, id')
      .eq('source', 'philly-opa');

    const existingIds = new Set(existingProperties?.map(p => p.external_id) || []);
    console.log(`Found ${existingIds.size} existing Philly OPA properties in database`);

    // Separate new and existing properties
    const newProperties = transformedProperties.filter(p => !existingIds.has(p.external_id));
    const existingToUpdate = transformedProperties.filter(p => existingIds.has(p.external_id));

    console.log(`New properties to insert: ${newProperties.length}`);
    console.log(`Existing properties to update: ${existingToUpdate.length}`);

    // Insert new properties in batches to avoid timeouts
    const batchSize = 100;
    let totalInserted = 0;
    
    for (let i = 0; i < newProperties.length; i += batchSize) {
      const batch = newProperties.slice(i, i + batchSize);
      const { error: insertError } = await supabaseClient
        .from('properties')
        .insert(batch);
      
      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
      } else {
        totalInserted += batch.length;
        console.log(`Inserted batch ${i / batchSize + 1}: ${batch.length} properties`);
      }
    }

    console.log(`Successfully inserted ${totalInserted} new properties`);

    // Update existing properties
    let totalUpdated = 0;
    for (const prop of existingToUpdate) {
      const { error: updateError } = await supabaseClient
        .from('properties')
        .update({ 
          last_verified_at: new Date().toISOString(),
          price: prop.price,
          market_value: prop.price
        })
        .eq('external_id', prop.external_id);
      
      if (!updateError) {
        totalUpdated++;
      }
    }

    console.log(`Updated ${totalUpdated} existing properties`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Processed ${properties.length} Philadelphia OPA properties`,
      inserted: totalInserted,
      updated: totalUpdated,
      total: properties.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-philly-properties function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
