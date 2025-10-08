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
    
    // Try to fetch from external APIs first
    if (RAPIDAPI_KEY) {
      // Try Realty Base US API first
      try {
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
        console.log('Attempting Realty Base API fetch:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'realty-base-us.p.rapidapi.com'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Realty Base API Response successful');

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

          console.log(`Transformed ${properties.length} properties from Realty Base API`);

          return new Response(JSON.stringify({ properties, source: 'realty-base' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          console.warn('Realty Base API failed:', response.status);
        }
      } catch (apiError) {
        console.warn('Realty Base API error:', apiError);
      }

      // Try Zillow API as fallback
      try {
        console.log('Attempting Zillow API fetch');
        
        const zillowParams = new URLSearchParams({
          location: 'Kensington, Philadelphia, PA',
          status_type: 'ForSale',
          home_type: 'Houses'
        });

        if (filters?.minPrice) {
          zillowParams.append('price_min', filters.minPrice.toString());
        }
        if (filters?.maxPrice) {
          zillowParams.append('price_max', filters.maxPrice.toString());
        }

        const zillowUrl = `https://zillow-com1.p.rapidapi.com/propertyExtendedSearch?${zillowParams.toString()}`;

        const zillowResponse = await fetch(zillowUrl, {
          method: 'GET',
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'zillow-com1.p.rapidapi.com'
          }
        });

        if (zillowResponse.ok) {
          const zillowData = await zillowResponse.json();
          console.log('Zillow API Response successful');
          console.log('Zillow data structure:', JSON.stringify(zillowData).substring(0, 500));

          // Zillow API may return data in different formats
          const propertyList = zillowData.props || zillowData.results || zillowData.data || [];
          
          const properties = propertyList
            .slice(0, 50)
            .map((prop: any) => ({
              id: prop.zpid?.toString() || prop.id?.toString() || Math.random().toString(),
              address: prop.address || prop.streetAddress || 'Address not available',
              city: prop.addressCity || prop.city || 'Philadelphia',
              state: prop.addressState || prop.state || 'PA',
              zip_code: prop.zipcode || prop.zip || prop.postalCode || '',
              price: prop.price || prop.listPrice || 0,
              bedrooms: prop.bedrooms || prop.beds || 0,
              bathrooms: prop.bathrooms || prop.baths || 0,
              square_feet: prop.livingArea || prop.sqft || prop.squareFeet || 0,
              property_type: prop.propertyType || prop.homeType || 'Houses',
              image_url: prop.imgSrc || prop.image || prop.photo || '',
              listing_url: prop.detailUrl ? `https://www.zillow.com${prop.detailUrl}` : (prop.url || ''),
              description: prop.description || '',
              year_built: prop.yearBuilt || prop.year || null,
              lot_size: prop.lotAreaValue || prop.lotSize || null,
            }));

          console.log(`Transformed ${properties.length} properties from Zillow API`);

          return new Response(JSON.stringify({ properties, source: 'zillow' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          console.warn('Zillow API failed:', zillowResponse.status);
        }
      } catch (zillowError) {
        console.warn('Zillow API error:', zillowError);
      }

      console.log('All APIs failed, falling back to database');
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
