import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting news sentiment analysis');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch only 2 articles at a time to respect rate limits
    const { data: articles, error: fetchError } = await supabaseClient
      .from('news_articles')
      .select('id, title, description')
      .is('sentiment', null)
      .limit(2);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${articles?.length || 0} articles to analyze`);

    let analyzed = 0;
    for (const article of articles || []) {
      try {
        console.log(`Analyzing sentiment for: ${article.title}`);
        
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'You are a sentiment analysis expert for real estate news. Analyze news articles and return sentiment as positive, negative, or neutral with a confidence score between 0-1.'
              },
              {
                role: 'user',
                content: `Analyze the sentiment of this news article:\n\nTitle: ${article.title}\n\nDescription: ${article.description || 'N/A'}\n\nProvide your analysis.`
              }
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "analyze_sentiment",
                  description: "Return sentiment analysis for a news article",
                  parameters: {
                    type: "object",
                    properties: {
                      sentiment: {
                        type: "string",
                        enum: ["positive", "negative", "neutral"],
                        description: "Overall sentiment of the article"
                      },
                      score: {
                        type: "number",
                        description: "Confidence score between 0 and 1"
                      },
                      reasoning: {
                        type: "string",
                        description: "Brief explanation of the sentiment analysis"
                      }
                    },
                    required: ["sentiment", "score", "reasoning"],
                    additionalProperties: false
                  }
                }
              }
            ],
            tool_choice: { type: "function", function: { name: "analyze_sentiment" } }
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          
          if (toolCall) {
            const analysis = JSON.parse(toolCall.function.arguments);
            console.log(`Sentiment analysis for "${article.title}":`, analysis);
            
            // Update article with sentiment
            const { error: updateError } = await supabaseClient
              .from('news_articles')
              .update({
                sentiment: analysis.sentiment,
                sentiment_score: analysis.score,
                sentiment_details: {
                  reasoning: analysis.reasoning,
                  analyzed_at: new Date().toISOString()
                }
              })
              .eq('id', article.id);

            if (!updateError) {
              analyzed++;
              console.log(`Updated sentiment for: ${article.title}`);
            } else {
              console.error(`Error updating ${article.title}:`, updateError);
            }
          }
        } else {
          const errorText = await aiResponse.text();
          console.error(`AI request failed with status ${aiResponse.status}:`, errorText);
        }
      } catch (analysisError) {
        console.error(`Error analyzing ${article.title}:`, analysisError);
      }

      // Rate limiting - 90 second delay between requests
      await new Promise(resolve => setTimeout(resolve, 90000));
    }

    console.log(`Successfully analyzed ${analyzed} articles`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Analyzed ${analyzed} articles`,
      total: articles?.length || 0,
      analyzed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-news-sentiment function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
