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
      // Try Realty-in-US API first
      try {
        console.log('Attempting Realty-in-US API fetch');
        
        const requestBody: any = {
          limit: 50,
          offset: 0,
          city: "Philadelphia",
          state_code: "PA",
          postal_code: "19125,19134",
          status: ["for_sale"],
          sort: {
            direction: "desc",
            field: "list_date"
          }
        };

        if (filters?.minPrice) {
          requestBody.price_min = filters.minPrice;
        }
        if (filters?.maxPrice) {
          requestBody.price_max = filters.maxPrice;
        }

        const response = await fetch('https://realty-in-us.p.rapidapi.com/properties/v3/list', {
          method: 'POST',
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'realty-in-us.p.rapidapi.com',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Realty-in-US API Response successful');
          console.log('Realty-in-US response structure:', JSON.stringify(data).substring(0, 500));

          const properties = (data.data?.home_search?.results || []).map((prop: any) => {
            const addressObj = prop.location?.address || {};
            const addressLine = addressObj.line || 
              `${addressObj.street_number || ''} ${addressObj.street_name || ''} ${addressObj.street_suffix || ''}`.trim() ||
              'Address not available';
            
            return {
              id: prop.property_id || prop.listing_id || Math.random().toString(),
              address: addressLine,
              city: addressObj.city || 'Philadelphia',
              state: addressObj.state_code || addressObj.state || 'PA',
              zip_code: addressObj.postal_code || '',
              price: prop.list_price || 0,
              bedrooms: prop.description?.beds || 0,
              bathrooms: prop.description?.baths_full || prop.description?.baths || 0,
              square_feet: prop.description?.sqft || 0,
              property_type: prop.description?.type || 'Houses',
              image_url: prop.primary_photo?.href || prop.photos?.[0]?.href || '',
              listing_url: prop.href || '',
              description: prop.description?.text || '',
              year_built: prop.description?.year_built || null,
              lot_size: prop.description?.lot_sqft || null,
            };
          });

          console.log(`Transformed ${properties.length} properties from Realty-in-US API`);

          // Only return if we got properties, otherwise fall back to Zillow
          if (properties.length > 0) {
            return new Response(JSON.stringify({ properties, source: 'realty-in-us' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else {
            console.log('Realty-in-US returned 0 properties, trying Zillow...');
          }
        } else {
          console.warn('Realty-in-US API failed:', response.status, await response.text());
        }
      } catch (apiError) {
        console.warn('Realty-in-US API error:', apiError);
      }

      // Try LoopNet API for commercial properties
      try {
        console.log('Attempting LoopNet API fetch');
        
        // Try both Kensington zip codes
        const zipCodes = ['19125', '19134'];
        let allLoopNetProperties: any[] = [];
        
        for (const zipCode of zipCodes) {
          const loopNetResponse = await fetch('https://loopnet-api.p.rapidapi.com/loopnet/sale/searchByZipCode', {
            method: 'POST',
            headers: {
              'x-rapidapi-key': RAPIDAPI_KEY,
              'x-rapidapi-host': 'loopnet-api.p.rapidapi.com',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              zipCodeId: zipCode,
              page: 1
            })
          });

          if (loopNetResponse.ok) {
            const loopNetData = await loopNetResponse.json();
            console.log(`LoopNet API Response successful for ${zipCode}:`, JSON.stringify(loopNetData).substring(0, 300));
            
            const properties = (loopNetData.data?.results || loopNetData.results || []).map((prop: any) => ({
              id: prop.listingId || prop.id || Math.random().toString(),
              address: prop.address?.street || prop.streetAddress || 'Address not available',
              city: prop.address?.city || 'Philadelphia',
              state: prop.address?.state || 'PA',
              zip_code: prop.address?.zipCode || zipCode,
              price: prop.listPrice || prop.price || 0,
              bedrooms: 0,
              bathrooms: 0,
              square_feet: prop.buildingSize || prop.squareFeet || 0,
              property_type: prop.propertyType || 'Commercial',
              image_url: prop.primaryPhoto?.url || prop.imageUrl || '',
              listing_url: prop.listingUrl || '',
              description: prop.description || '',
              year_built: prop.yearBuilt || null,
              lot_size: prop.lotSize || null,
            }));
            
            allLoopNetProperties = allLoopNetProperties.concat(properties);
          }
        }

        console.log(`Transformed ${allLoopNetProperties.length} properties from LoopNet API`);

        if (allLoopNetProperties.length > 0) {
          return new Response(JSON.stringify({ properties: allLoopNetProperties.slice(0, 50), source: 'loopnet' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          console.log('LoopNet returned 0 properties, trying Zillow...');
        }
      } catch (loopNetError) {
        console.warn('LoopNet API error:', loopNetError);
      }

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

          if (properties.length > 0) {
            return new Response(JSON.stringify({ properties, source: 'zillow' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else {
            console.log('Zillow returned 0 properties, falling back to database');
          }
        } else {
          console.warn('Zillow API failed:', zillowResponse.status);
        }
      } catch (zillowError) {
        console.warn('Zillow API error:', zillowError);
      }

      // Try Redfin API
      try {
        console.log('Attempting Redfin API fetch');
        
        const redfinUrl = 'https://redfin-com-data.p.rapidapi.com/property/search-sale?location=Kensington, Philadelphia, PA';

        const redfinResponse = await fetch(redfinUrl, {
          method: 'GET',
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'redfin-com-data.p.rapidapi.com'
          }
        });

        if (redfinResponse.ok) {
          const redfinData = await redfinResponse.json();
          console.log('Redfin API Response successful');
          console.log('Redfin data structure:', JSON.stringify(redfinData).substring(0, 500));

          const propertyList = redfinData.homes || redfinData.data || redfinData.results || [];
          
          const properties = propertyList
            .slice(0, 50)
            .map((prop: any) => ({
              id: prop.propertyId?.toString() || prop.mlsId?.toString() || Math.random().toString(),
              address: prop.streetLine?.value || prop.address || 'Address not available',
              city: prop.city || 'Philadelphia',
              state: prop.state || 'PA',
              zip_code: prop.zip || prop.zipCode || '',
              price: prop.price?.value || prop.listPrice || 0,
              bedrooms: prop.beds || 0,
              bathrooms: prop.baths || 0,
              square_feet: prop.sqFt?.value || prop.sqft || 0,
              property_type: prop.propertyType || 'Houses',
              image_url: prop.photos?.[0]?.url || prop.photoUrl || '',
              listing_url: prop.url || '',
              description: prop.listingRemarks || '',
              year_built: prop.yearBuilt || null,
              lot_size: prop.lotSize?.value || null,
            }));

          console.log(`Transformed ${properties.length} properties from Redfin API`);

          if (properties.length > 0) {
            return new Response(JSON.stringify({ properties, source: 'redfin' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else {
            console.log('Redfin returned 0 properties, falling back to database');
          }
        } else {
          console.warn('Redfin API failed:', redfinResponse.status);
        }
      } catch (redfinError) {
        console.warn('Redfin API error:', redfinError);
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
