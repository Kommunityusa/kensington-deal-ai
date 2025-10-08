import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY is not configured');
    }

    const { filters } = await req.json();
    console.log('Fetching properties with filters:', filters);

    // Build query parameters for Realty Base US API
    // Using SearchForSale endpoint with location parameter
    const params = new URLSearchParams({
      location: 'Kensington, PA',
      limit: '50',
    });

    // Add price filters if provided
    if (filters?.minPrice) {
      params.append('price_min', filters.minPrice.toString());
    }
    if (filters?.maxPrice) {
      params.append('price_max', filters.maxPrice.toString());
    }

    // Add sort parameter
    if (filters?.sortBy) {
      if (filters.sortBy === 'price-low') {
        params.append('sort', 'price_low');
      } else if (filters.sortBy === 'price-high') {
        params.append('sort', 'price_high');
      }
    }

    const apiUrl = `https://realty-base-us.p.rapidapi.com/SearchForSale?${params.toString()}`;
    console.log('API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'realty-base-us.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data).substring(0, 200));

    // Transform API response to match our property structure
    const properties = (data.data || data.listings || []).map((prop: any) => ({
      id: prop.property_id || prop.zpid || Math.random().toString(),
      address: prop.address?.line || prop.location?.address || 'Address not available',
      city: prop.address?.city || 'Kensington',
      state: prop.address?.state_code || 'PA',
      zip_code: prop.address?.postal_code || '',
      price: prop.list_price || prop.price || 0,
      bedrooms: prop.description?.beds || prop.beds || 0,
      bathrooms: prop.description?.baths || prop.baths || 0,
      square_feet: prop.description?.sqft || prop.building_size?.size || 0,
      property_type: prop.description?.type || prop.prop_type || 'Single Family',
      image_url: prop.primary_photo?.href || prop.photos?.[0]?.href || prop.thumbnail || '',
      listing_url: prop.href || '',
      description: prop.description?.text || '',
      year_built: prop.description?.year_built || null,
      lot_size: prop.description?.lot_sqft || null,
    }));

    console.log(`Transformed ${properties.length} properties`);

    return new Response(JSON.stringify({ properties }), {
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
