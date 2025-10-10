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
    const { filters, page = 1, limit = 12 } = await req.json();
    console.log('Fetching properties with filters:', filters, 'page:', page, 'limit:', limit);

    const offset = (page - 1) * limit;

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch from database with filters and pagination
    console.log('Fetching properties from database');
    
    // First get total count
    let countQuery = supabaseClient
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Apply filters to count query
    if (filters?.minPrice) {
      countQuery = countQuery.gte('price', filters.minPrice);
    }
    if (filters?.maxPrice) {
      countQuery = countQuery.lte('price', filters.maxPrice);
    }
    if (filters?.propertyType && filters.propertyType !== 'all') {
      countQuery = countQuery.eq('property_type', filters.propertyType);
    }

    const { count } = await countQuery;

    // Then fetch paginated data
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
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Returning ${dbProperties?.length || 0} properties from database (total: ${count}, page: ${page})`);

    return new Response(JSON.stringify({ 
      properties: dbProperties || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      source: 'philadelphia-opa'
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