import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const requestBody = await req.json();
    const { type = 'chat', ...otherParams } = requestBody;

    // Get OpenAI API key from environment (set in Supabase dashboard)
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey?.trim()) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let openaiUrl: string;
    let payload: any;

    if (type === 'image') {
      // Handle image generation requests
      const { model = 'dall-e-3', prompt, ...imageParams } = otherParams;
      
      if (!prompt) {
        return new Response(
          JSON.stringify({ error: "Prompt is required for image generation" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      openaiUrl = 'https://api.openai.com/v1/images/generations';
      payload = {
        model,
        prompt,
        ...imageParams,
      };
    } else {
      // Handle chat completion requests
      const { messages, model = 'gpt-4o-mini', ...chatParams } = otherParams;

      if (!messages || !Array.isArray(messages)) {
        return new Response(
          JSON.stringify({ error: "Messages array is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      openaiUrl = 'https://api.openai.com/v1/chat/completions';
      payload = {
        model,
        messages,
        ...chatParams,
      };
    }

    // Forward the request to OpenAI with the secure API key
    const response = await fetch(openaiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API error: ${response.status}`,
          details: errorData 
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});