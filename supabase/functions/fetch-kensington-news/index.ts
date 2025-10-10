import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    const newsArticles: any[] = [];

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

    // Process search results
    for (const result of searchData.data || []) {
      if (!result.url || !result.title) continue;

      newsArticles.push({
        title: result.title,
        url: result.url,
        description: result.description || result.content?.substring(0, 200) || '',
        source: new URL(result.url).hostname,
        publishedAt: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        articles: newsArticles,
        total: newsArticles.length,
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
