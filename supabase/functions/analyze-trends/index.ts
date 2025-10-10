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
    console.log('Starting daily trend analysis');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch recent news articles
    const { data: articles, error: articlesError } = await supabase
      .from('news_articles')
      .select('title, description, sentiment, sentiment_score, published_at')
      .order('published_at', { ascending: false })
      .limit(20);

    if (articlesError) {
      throw articlesError;
    }

    if (!articles || articles.length === 0) {
      console.log('No articles found for analysis');
      return new Response(
        JSON.stringify({ success: false, error: 'No articles found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Analyzing ${articles.length} news articles`);

    // Prepare context for AI
    const articlesContext = articles.map(a => 
      `Title: ${a.title}\nSentiment: ${a.sentiment || 'N/A'} (${a.sentiment_score || 'N/A'})\nDescription: ${a.description || 'N/A'}`
    ).join('\n\n');

    const prompt = `Analyze these Kensington real estate news articles. Provide exactly 3 concise, complete insights (20-25 words each):
• Overall market sentiment and direction
• Best investment opportunity right now  
• Primary concern or risk to watch

Each point must be a complete, readable sentence. Maximum 25 words per point.

News Articles:
${articlesContext}`;


    // Call Lovable AI for analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a real estate market analyst specializing in Philadelphia neighborhoods.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;

    // Calculate sentiment summary
    const sentiments = articles.filter(a => a.sentiment).map(a => a.sentiment);
    const positiveCount = sentiments.filter(s => s === 'positive').length;
    const negativeCount = sentiments.filter(s => s === 'negative').length;
    const neutralCount = sentiments.filter(s => s === 'neutral').length;
    
    const sentimentSummary = `${positiveCount} positive, ${neutralCount} neutral, ${negativeCount} negative`;

    // Store analysis in database (delete old, insert new)
    await supabase.from('trend_analysis').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const { error: insertError } = await supabase
      .from('trend_analysis')
      .insert({
        analysis_text: analysisText,
        sentiment_summary: sentimentSummary,
        key_insights: {
          total_articles: articles.length,
          sentiment_breakdown: {
            positive: positiveCount,
            neutral: neutralCount,
            negative: negativeCount
          }
        }
      });

    if (insertError) {
      throw insertError;
    }

    console.log('Trend analysis completed and stored');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Trend analysis completed',
        sentiment_summary: sentimentSummary
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in trend analysis:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
