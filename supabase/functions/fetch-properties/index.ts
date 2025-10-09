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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    
    // First, get existing properties from database to check what we already have
    const { data: existingProperties } = await supabaseClient
      .from('properties')
      .select('external_id, id, last_verified_at')
      .eq('is_active', true);

    const existingIds = new Set(existingProperties?.map(p => p.external_id) || []);
    console.log(`Found ${existingIds.size} existing active properties in database`);
    
    // Try to fetch from external APIs in parallel
    if (RAPIDAPI_KEY) {
      console.log('Fetching from all APIs simultaneously');
      
      const allProperties: any[] = [];

      // Fetch from all APIs in parallel
      const apiPromises = [
        // Realty-in-US API
        fetch('https://realty-in-us.p.rapidapi.com/properties/v3/list', {
          method: 'POST',
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'realty-in-us.p.rapidapi.com',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            limit: 50,
            offset: 0,
            city: "Philadelphia",
            state_code: "PA",
            postal_code: "19125,19134",
            status: ["for_sale"],
            sort: { direction: "desc", field: "list_date" },
            ...(filters?.minPrice && { price_min: filters.minPrice }),
            ...(filters?.maxPrice && { price_max: filters.maxPrice })
          })
        }).then(res => res.ok ? res.json() : null).catch(() => null),

        // LoopNet API for zip 19125
        fetch('https://loopnet-api.p.rapidapi.com/loopnet/sale/searchByZipCode', {
          method: 'POST',
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'loopnet-api.p.rapidapi.com',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ zipCodeId: '19125', page: 1 })
        }).then(res => res.ok ? res.json() : null).catch(() => null),

        // LoopNet API for zip 19134
        fetch('https://loopnet-api.p.rapidapi.com/loopnet/sale/searchByZipCode', {
          method: 'POST',
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'loopnet-api.p.rapidapi.com',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ zipCodeId: '19134', page: 1 })
        }).then(res => res.ok ? res.json() : null).catch(() => null),

        // Zillow API
        fetch(`https://zillow-com1.p.rapidapi.com/propertyExtendedSearch?location=Kensington, Philadelphia, PA&status_type=ForSale&home_type=Houses${filters?.minPrice ? `&price_min=${filters.minPrice}` : ''}${filters?.maxPrice ? `&price_max=${filters.maxPrice}` : ''}`, {
          method: 'GET',
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'zillow-com1.p.rapidapi.com'
          }
        }).then(res => res.ok ? res.json() : null).catch(() => null),

        // Redfin API
        fetch('https://redfin-com-data.p.rapidapi.com/property/search-sale?location=Kensington, Philadelphia, PA', {
          method: 'GET',
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'redfin-com-data.p.rapidapi.com'
          }
        }).then(res => res.ok ? res.json() : null).catch(() => null)
      ];

      const [realtyData, loopNet19125Data, loopNet19134Data, zillowData, redfinData] = await Promise.all(apiPromises);

      const fetchedIds = new Set<string>();

      // Process Realty-in-US results
      if (realtyData?.data?.home_search?.results) {
        const realtyProperties = realtyData.data.home_search.results.map((prop: any) => {
          const addressObj = prop.location?.address || {};
          const addressLine = addressObj.line || 
            `${addressObj.street_number || ''} ${addressObj.street_name || ''} ${addressObj.street_suffix || ''}`.trim() ||
            'Address not available';
          
          const externalId = `realty-${prop.property_id || prop.listing_id || Math.random()}`;
          fetchedIds.add(externalId);
          
          return {
            external_id: externalId,
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
            source: 'realty-in-us',
            last_verified_at: new Date().toISOString(),
            is_active: true
          };
        });
        allProperties.push(...realtyProperties);
        console.log(`Added ${realtyProperties.length} properties from Realty-in-US`);
      }

      // Process LoopNet results
      const loopNetResults = [
        ...(loopNet19125Data?.data?.results || loopNet19125Data?.results || []),
        ...(loopNet19134Data?.data?.results || loopNet19134Data?.results || [])
      ];
      
      if (loopNetResults.length > 0) {
        const loopNetProperties = loopNetResults.map((prop: any) => {
          const externalId = `loopnet-${prop.listingId || prop.id || Math.random()}`;
          fetchedIds.add(externalId);
          
          return {
            external_id: externalId,
            address: prop.address?.street || prop.streetAddress || 'Address not available',
            city: prop.address?.city || 'Philadelphia',
            state: prop.address?.state || 'PA',
            zip_code: prop.address?.zipCode || '',
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
            source: 'loopnet',
            last_verified_at: new Date().toISOString(),
            is_active: true
          };
        });
        allProperties.push(...loopNetProperties);
        console.log(`Added ${loopNetProperties.length} properties from LoopNet`);
      }

      // Process Zillow results
      if (zillowData) {
        const propertyList = zillowData.props || zillowData.results || zillowData.data || [];
        const zillowProperties = propertyList.slice(0, 50).map((prop: any) => {
          const externalId = `zillow-${prop.zpid || prop.id || Math.random()}`;
          fetchedIds.add(externalId);
          
          return {
            external_id: externalId,
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
            source: 'zillow',
            last_verified_at: new Date().toISOString(),
            is_active: true
          };
        });
        allProperties.push(...zillowProperties);
        console.log(`Added ${zillowProperties.length} properties from Zillow`);
      }

      // Process Redfin results
      if (redfinData) {
        const propertyList = redfinData.homes || redfinData.data || redfinData.results || [];
        const redfinProperties = propertyList.slice(0, 50).map((prop: any) => {
          const externalId = `redfin-${prop.propertyId || prop.mlsId || Math.random()}`;
          fetchedIds.add(externalId);
          
          return {
            external_id: externalId,
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
            source: 'redfin',
            last_verified_at: new Date().toISOString(),
            is_active: true
          };
        });
        allProperties.push(...redfinProperties);
        console.log(`Added ${redfinProperties.length} properties from Redfin`);
      }

      console.log(`Total properties from all APIs: ${allProperties.length}`);

      // Deduplicate properties based on normalized address
      const uniqueProperties = new Map();
      
      allProperties.forEach(property => {
        const normalizedAddress = property.address
          .toLowerCase()
          .replace(/[.,\s-]/g, '');
        
        if (!uniqueProperties.has(normalizedAddress)) {
          uniqueProperties.set(normalizedAddress, property);
        }
      });

      const deduplicatedProperties = Array.from(uniqueProperties.values());
      console.log(`Properties after deduplication: ${deduplicatedProperties.length}`);

      // Separate new and existing properties
      const newProperties = deduplicatedProperties.filter(p => !existingIds.has(p.external_id));
      const existingToUpdate = deduplicatedProperties.filter(p => existingIds.has(p.external_id));

      console.log(`New properties to insert: ${newProperties.length}`);
      console.log(`Existing properties to update: ${existingToUpdate.length}`);

      // Insert new properties
      if (newProperties.length > 0) {
        const { error: insertError } = await supabaseClient
          .from('properties')
          .insert(newProperties);
        
        if (insertError) {
          console.error('Error inserting new properties:', insertError);
        } else {
          console.log(`Successfully inserted ${newProperties.length} new properties`);
        }
      }

      // Update last_verified_at for existing properties that are still active
      if (existingToUpdate.length > 0) {
        for (const prop of existingToUpdate) {
          await supabaseClient
            .from('properties')
            .update({ 
              last_verified_at: new Date().toISOString(),
              price: prop.price // Update price in case it changed
            })
            .eq('external_id', prop.external_id);
        }
        console.log(`Updated ${existingToUpdate.length} existing properties`);
      }

      // Mark properties as inactive if they weren't found in the latest fetch
      const staleIds = Array.from(existingIds).filter(id => !fetchedIds.has(id));
      if (staleIds.length > 0) {
        const { error: updateError } = await supabaseClient
          .from('properties')
          .update({ is_active: false })
          .in('external_id', staleIds);
        
        if (updateError) {
          console.error('Error marking stale properties:', updateError);
        } else {
          console.log(`Marked ${staleIds.length} properties as inactive`);
        }
      }
    } else {
      console.log('No RAPIDAPI_KEY configured');
    }

    // Fetch from database with filters
    console.log('Fetching properties from database');
    let query = supabaseClient
      .from('properties')
      .select(`
        *,
        property_analysis(*)
      `)
      .eq('is_active', true);

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

    const { data: dbProperties, error } = await query
      .order('last_verified_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Returning ${dbProperties?.length || 0} active properties from database`);

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
