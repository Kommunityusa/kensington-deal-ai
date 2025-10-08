import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filters } = await req.json();
    console.log('Fetching properties with filters:', filters);

    // Initialize Supabase client for fallback
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    
    // Try to fetch from external API first
    if (RAPIDAPI_KEY) {
      try {
        // Build query parameters for Realty Base US API
        const params = new URLSearchParams({
          location: 'Kensington, Philadelphia, PA',
          limit: '50',
        });

        if (filters?.minPrice) {
          params.append('price_min', filters.minPrice.toString());
        }
        if (filters?.maxPrice) {
          params.append('price_max', filters.maxPrice.toString());
        }

        const apiUrl = `https://realty-base-us.p.rapidapi.com/SearchForSale?${params.toString()}`;
        console.log('Attempting API fetch:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'realty-base-us.p.rapidapi.com'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('API Response successful');

          const properties = (data.data || []).map((prop: any) => {
            const addressObj = prop.location?.address || prop.address || {};
            const addressLine = addressObj.line || 
              `${addressObj.street_number || ''} ${addressObj.street_name || ''} ${addressObj.street_suffix || ''}`.trim() ||
              'Address not available';
            
            return {
              id: prop.property_id || prop.listing_id || Math.random().toString(),
              address: addressLine,
              city: addressObj.city || 'Philadelphia',
              state: addressObj.state_code || addressObj.state || 'PA',
              zip_code: addressObj.postal_code || '',
              price: prop.list_price || prop.price || 0,
              bedrooms: prop.description?.beds || prop.beds || 0,
              bathrooms: prop.description?.baths_full || prop.description?.baths || prop.baths || 0,
              square_feet: prop.description?.sqft || prop.description?.lot_sqft || 0,
              property_type: prop.description?.type || prop.prop_type || 'townhomes',
              image_url: prop.primary_photo?.href || prop.photos?.[0]?.href || '',
              listing_url: prop.href || '',
              description: prop.description?.text || '',
              year_built: prop.description?.year_built || null,
              lot_size: prop.description?.lot_sqft || null,
            };
          });

          console.log(`Transformed ${properties.length} properties from API`);

          return new Response(JSON.stringify({ properties }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          const errorText = await response.text();
          console.warn('API request failed:', response.status, errorText);
          console.log('Falling back to database');
        }
      } catch (apiError) {
        console.warn('API error, falling back to database:', apiError);
      }
    } else {
      console.log('No RAPIDAPI_KEY configured, using database');
    }

    // Fallback: Fetch from database
    console.log('Fetching properties from database');
    let query = supabaseClient
      .from('properties')
      .select(`
        *,
        property_analysis(*)
      `);

    // Apply filters
    if (filters?.minPrice) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters?.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }
    if (filters?.propertyType && filters.propertyType !== 'all') {
      query = query.eq('property_type', filters.propertyType);
    }

    const { data: dbProperties, error } = await query.limit(50);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Fetched ${dbProperties?.length || 0} properties from database`);

    return new Response(JSON.stringify({ 
      properties: dbProperties || [],
      source: 'database'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-properties function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      properties: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
