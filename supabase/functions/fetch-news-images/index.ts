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
    console.log('Fetching images for news articles with Firecrawl');

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch articles without images
    const { data: articles, error: fetchError } = await supabase
      .from('news_articles')
      .select('*')
      .is('image_url', null)
      .limit(20);

    if (fetchError) {
      console.error('Error fetching articles:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${articles?.length || 0} articles without images`);

    let updated = 0;

    for (const article of articles || []) {
      try {
        // Scrape the article URL to get the image
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          },
          body: JSON.stringify({
            url: article.url,
            formats: ['html'],
          }),
        });

        if (!scrapeResponse.ok) {
          console.error(`Failed to scrape ${article.url}`);
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const html = scrapeData.data?.html || '';

        // Try to extract image from HTML
        let imageUrl = null;

        // Look for og:image meta tag
        const ogImageMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i);
        if (ogImageMatch) {
          imageUrl = ogImageMatch[1];
        } else {
          // Look for first img tag
          const imgMatch = html.match(/<img[^>]+src="([^"]+)"/i);
          if (imgMatch) {
            imageUrl = imgMatch[1];
          }
        }

        if (imageUrl) {
          // Update article with image
          const { error: updateError } = await supabase
            .from('news_articles')
            .update({ image_url: imageUrl })
            .eq('id', article.id);

          if (updateError) {
            console.error(`Error updating article ${article.id}:`, updateError);
          } else {
            updated++;
            console.log(`Updated image for: ${article.title}`);
          }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing article ${article.id}:`, error);
      }
    }

    console.log(`Updated ${updated} article images`);

    return new Response(
      JSON.stringify({
        success: true,
        total: articles?.length || 0,
        updated,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error fetching news images:', error);
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
