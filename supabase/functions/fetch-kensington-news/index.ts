import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching Kensington real estate news with Firecrawl');

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Search for Kensington real estate news
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        query: 'Kensington Philadelphia real estate news property market investment',
        limit: 15,
      }),
    });

    if (!searchResponse.ok) {
      console.error('Firecrawl search failed:', await searchResponse.text());
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch news' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const searchData = await searchResponse.json();
    console.log(`Found ${searchData.data?.length || 0} news articles`);

    let stored = 0;
    let updated = 0;

    // Process and store articles in database
    for (const result of searchData.data || []) {
      if (!result.url || !result.title) continue;

      const article = {
        title: result.title,
        url: result.url,
        description: result.description || result.content?.substring(0, 200) || '',
        source: new URL(result.url).hostname,
        published_at: new Date().toISOString(),
      };

      // Upsert article (insert or update if URL exists)
      const { error } = await supabase
        .from('news_articles')
        .upsert(article, { onConflict: 'url' });

      if (error) {
        console.error('Error storing article:', error);
      } else {
        stored++;
      }
    }

    console.log(`Stored ${stored} news articles in database`);

    return new Response(
      JSON.stringify({
        success: true,
        stored,
        updated,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error fetching news:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
