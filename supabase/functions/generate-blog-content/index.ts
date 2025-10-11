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
    const { title, category } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Lovable AI (Google Gemini) to generate blog content
    const prompt = `Write a comprehensive, SEO-optimized blog post about: "${title}"

Category: ${category || 'Real Estate Investment'}
Context: This is for a Philadelphia real estate investment platform focused on the Kensington neighborhood.

Requirements:
1. Write 800-1200 words
2. Include relevant keywords naturally (Philadelphia real estate, Kensington, investment, property)
3. Use proper HTML formatting with <h2>, <h3>, <p>, <ul>, <li> tags
4. Be informative and helpful for first-time real estate investors
5. Include actionable insights and data-driven analysis
6. Make it engaging and easy to read
7. Focus on local Philadelphia/Kensington market insights

Also provide a compelling 2-sentence excerpt (150 characters max) that summarizes the article.

Return the response in this exact JSON format:
{
  "excerpt": "Your 2-sentence excerpt here",
  "content": "Full HTML content here"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_AI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Try to parse the JSON response from AI
    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch (e) {
      // If AI didn't return proper JSON, create it manually
      console.error('Failed to parse AI response as JSON:', e);
      result = {
        excerpt: title.substring(0, 150),
        content: `<p>${aiResponse}</p>`,
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating blog content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
