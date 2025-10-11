import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Auto-generate blog post started');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Topics to cycle through
    const topics = [
      "Why Kensington is Philadelphia's Best Kept Secret for Real Estate Investment",
      "5 Investment Strategies for First-Time Buyers in Kensington",
      "Understanding Property Values in Kensington: A 2025 Market Analysis",
      "How to Calculate ROI on Kensington Investment Properties",
      "The Complete Guide to Renovating Properties in Kensington",
      "Kensington Neighborhood Guide: Best Areas for Investment",
      "Tax Benefits of Real Estate Investment in Philadelphia",
      "From Beginner to Pro: Your First Year as a Kensington Real Estate Investor"
    ];

    const categories = [
      "Market Analysis",
      "Investment Tips",
      "Neighborhood Guide",
      "Property Analysis",
      "Real Estate News"
    ];

    // Select random topic and category
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];

    console.log(`Generating blog post: ${topic}`);

    // Generate content using Lovable AI with AI-search optimization
    const prompt = `Write a comprehensive, AI-search optimized blog post about: "${topic}"

Category: ${category}
Context: This is for a Philadelphia real estate investment platform focused on the Kensington neighborhood.

Requirements:
1. Write 1000-1500 words
2. Include relevant keywords naturally (Philadelphia real estate, Kensington, investment, property, ROI)
3. Use proper HTML formatting with <h2>, <h3>, <p>, <ul>, <li>, <strong> tags
4. Be informative and helpful for first-time real estate investors
5. Include actionable insights and data-driven analysis
6. Make it engaging and easy to read
7. Focus on local Philadelphia/Kensington market insights
8. Include specific examples and numbers where appropriate
9. Add a compelling conclusion with a call-to-action
10. CRITICAL: Create 5-8 frequently asked questions with detailed answers (optimize for featured snippets)
11. CRITICAL: If applicable, include step-by-step instructions for HowTo schema
12. Structure content to answer common queries directly
13. Use clear, concise paragraphs that can serve as direct answers

Also provide:
- A compelling 2-sentence excerpt (under 160 characters) that summarizes the article
- 3-5 relevant tags as a comma-separated list
- FAQs with questions and answers
- Steps if applicable (for how-to content)

Return the response in this exact JSON format:
{
  "excerpt": "Your 2-sentence excerpt here",
  "content": "Full HTML content here",
  "tags": "tag1, tag2, tag3",
  "faqs": [
    {
      "question": "Clear, specific question?",
      "answer": "Direct, comprehensive answer in 2-3 sentences"
    }
  ],
  "steps": [
    {
      "name": "Step name",
      "text": "Step description"
    }
  ]
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
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
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API returned ${aiResponse.status}: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    // Parse the JSON response
    let blogData;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        blogData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      blogData = {
        excerpt: topic.substring(0, 160),
        content: `<p>${aiContent}</p>`,
        tags: "Philadelphia, Kensington, Real Estate, Investment"
      };
    }

    // Generate slug
    const slug = topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Calculate read time
    const wordCount = blogData.content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    // Parse tags
    const tags = blogData.tags.split(',').map((tag: string) => tag.trim());

    // Insert blog post with FAQs and steps
    const { error } = await supabase.from('blog_posts').insert({
      title: topic,
      slug: slug,
      excerpt: blogData.excerpt,
      content: blogData.content,
      category: category,
      tags: tags,
      faqs: blogData.faqs || null,
      steps: blogData.steps || null,
      is_published: true,
      read_time_minutes: readTime,
      meta_title: `${topic} | Kensington Deals`,
      meta_description: blogData.excerpt,
      meta_keywords: `${category}, Philadelphia real estate, Kensington investment, ${tags.join(', ')}`,
    });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Successfully generated and published blog post: ${topic}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        title: topic,
        slug: slug 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in auto-generate-blog:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
