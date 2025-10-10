import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FirecrawlDocument {
  url?: string;
  markdown?: string;
  html?: string;
  metadata?: {
    title?: string;
    description?: string;
    language?: string;
    sourceURL?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Zillow scraping with Firecrawl');

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Scrape Zillow Kensington Philadelphia properties for sale
    const zillowUrl = 'https://www.zillow.com/philadelphia-pa/kensington/';
    
    console.log(`Crawling Zillow Kensington: ${zillowUrl}`);

    const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: zillowUrl,
        limit: 100, // Increase limit for more Kensington properties
        scrapeOptions: {
          formats: ['markdown', 'html'],
          onlyMainContent: true,
          includeTags: ['.property-card', '.list-card', '.result-list', '.search-result'],
          excludeTags: ['nav', 'footer', 'header', '.ad', '.advertisement']
        },
        maxDepth: 3 // Crawl deeper for more listings
      })
    });

    if (!crawlResponse.ok) {
      const errorText = await crawlResponse.text();
      throw new Error(`Firecrawl API error (${crawlResponse.status}): ${errorText}`);
    }

    const crawlData = await crawlResponse.json();
    console.log('Firecrawl crawl initiated:', crawlData);

    // Check crawl status
    const jobId = crawlData.id;
    if (!jobId) {
      throw new Error('No job ID returned from Firecrawl');
    }

    // Poll for completion (max 2 minutes)
    let crawlComplete = false;
    let attempts = 0;
    let documents: FirecrawlDocument[] = [];

    while (!crawlComplete && attempts < 24) { // 24 * 5 seconds = 2 minutes
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check crawl status: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      console.log(`Crawl status (attempt ${attempts + 1}):`, statusData.status);

      if (statusData.status === 'completed') {
        crawlComplete = true;
        documents = statusData.data || [];
      } else if (statusData.status === 'failed') {
        throw new Error('Crawl failed');
      }

      attempts++;
    }

    if (!crawlComplete) {
      throw new Error('Crawl timed out after 2 minutes');
    }

    console.log(`Received ${documents.length} documents from Firecrawl`);

    // Parse property data from scraped content using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const properties = [];

    for (const doc of documents.slice(0, 30)) { // Process first 30 documents for Kensington
      if (!doc.markdown) continue;

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: "You are a property data extraction expert. Extract property information from the provided content."
              },
              {
                role: "user",
                content: `Extract property data from this Kensington, Philadelphia content. Return ONLY a JSON array of properties, each with: address, price (number), bedrooms (number), bathrooms (number), square_feet (number), property_type, description, year_built (number or null), listing_url, zip_code. If no properties found, return empty array [].\n\n${doc.markdown.slice(0, 3000)}`
              }
            ],
            tools: [{
              type: "function",
              function: {
                name: "extract_properties",
                parameters: {
                  type: "object",
                  properties: {
                    properties: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          address: { type: "string" },
                          price: { type: "number" },
                          bedrooms: { type: "number" },
                          bathrooms: { type: "number" },
                          square_feet: { type: "number" },
                          property_type: { type: "string" },
                          description: { type: "string" },
                          year_built: { type: ["number", "null"] },
                          zip_code: { type: "string" },
                        },
                        required: ["address", "price"]
                      }
                    }
                  },
                  required: ["properties"]
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "extract_properties" } }
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            const extracted = JSON.parse(toolCall.function.arguments);
            properties.push(...(extracted.properties || []));
          }
        }
      } catch (error) {
        console.error('Error extracting properties from document:', error);
      }
    }

    console.log(`Extracted ${properties.length} properties from scraped content`);

    // Save properties to database
    let insertedCount = 0;
    for (const prop of properties) {
      if (!prop.address || !prop.price) continue;

      try {
        const { error } = await supabaseClient
          .from('properties')
          .insert({
            external_id: `zillow-scraped-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            address: prop.address,
            city: 'Philadelphia',
            state: 'PA',
            zip_code: prop.zip_code || '',
            price: Math.floor(prop.price),
            bedrooms: prop.bedrooms || 0,
            bathrooms: prop.bathrooms || 0,
            square_feet: Math.floor(prop.square_feet || 0),
            property_type: prop.property_type || 'Single Family',
            listing_url: prop.listing_url || '',
            description: prop.description || '',
            year_built: prop.year_built || null,
            source: 'zillow-scraped',
            last_verified_at: new Date().toISOString(),
            is_active: true
          });

        if (!error) {
          insertedCount++;
        }
      } catch (error) {
        console.error('Error inserting property:', error);
      }
    }

    console.log(`Successfully inserted ${insertedCount} properties from Zillow scrape`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Scraped and processed Zillow data`,
      documentsScraped: documents.length,
      propertiesExtracted: properties.length,
      propertiesInserted: insertedCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scrape-zillow function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});