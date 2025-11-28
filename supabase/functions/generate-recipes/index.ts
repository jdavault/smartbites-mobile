// supabase/functions/generate-recipes/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const DEFAULT_MODEL = 'gpt-4o-mini';
const TEMPERATURE = 0.3;
const MAX_TOKENS = 1000;
const DEFAULT_SEED = 7;
const CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const IMAGE_URL = 'https://api.openai.com/v1/images/generations';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const OPENAI_ORG_ID = Deno.env.get('OPENAI_ORG_ID')!;
const OPENAI_PROJECT = Deno.env.get('OPENAI_PROJECT_ID')!;

type RecipeVariant = 'quick' | 'standard' | 'gourmet' | 'budget' | 'comfort';

interface RecipeRequest {
  searchQuery: string;
  allergensToAvoid?: string[];  // Using YOUR naming convention
  dietaryPrefs?: string[];
  variant?: RecipeVariant;
  seed?: number;
}

interface GeneratedRecipe {
  title: string;
  headNote: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  method: string;
  tags: string[];
  searchQuery: string;
  allergensToAvoid: string[];
  dietaryPrefs: string[];
  allergensIncluded: string[];
  notes: string;
  nutritionInfo: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  tries = 5  // Your mobile app's retry count
): Promise<Response> {
  let lastErr: unknown;

  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;

      const status = res.status;
      const shouldRetry = status === 429 || (status >= 500 && status < 600) || status === 408;

      if (!shouldRetry || attempt === tries) {
        const text = await res.text().catch(() => '');
        throw new Error(`OpenAI API error ${status}: ${text || res.statusText}`);
      }

      // Your exact backoff logic
      const retryAfter = res.headers.get('retry-after');
      let retryMs: number;
      
      if (retryAfter) {
        retryMs = Number(retryAfter) * 1000;
      } else {
        if (attempt <= 2) {
          retryMs = 1000 * attempt; // 1s, 2s
        } else {
          retryMs = (1200 + Math.random() * 400) * Math.pow(2, attempt - 3);
        }
      }
      
      console.warn(`⚠️ Retry ${attempt}/${tries} after ${retryMs}ms (status ${status})`);
      await sleep(retryMs);
    } catch (err) {
      lastErr = err;
      if (attempt === tries) break;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error('Network error');
}

function getOpenAIHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  };
  if (OPENAI_ORG_ID) headers['OpenAI-Organization'] = OPENAI_ORG_ID;
  if (OPENAI_PROJECT) headers['OpenAI-Project'] = OPENAI_PROJECT;
  return headers;
}

// CORE BUSINESS LOGIC - Your IP
async function generateSingleRecipe(
  query: string,
  allergensToAvoid: string[] = [],
  dietaryPrefs: string[] = [],
  variant: RecipeVariant = 'standard',
  seed: number = DEFAULT_SEED
): Promise<GeneratedRecipe> {
  
  const variantInstructions: Record<RecipeVariant, string> = {
    quick: '- Focus on quick preparation (under 30 minutes total time)\n- Minimize prep steps\n- Use readily available ingredients',
    standard: '- Balance between ease and quality\n- Moderate prep and cook time\n- Use common ingredients',
    gourmet: '- Emphasize restaurant-quality results\n- More sophisticated techniques\n- Premium ingredients acceptable',
    budget: '- Focus on affordable ingredients\n- Minimize expensive items\n- Maximize value and taste',
    comfort: '- Classic, comforting flavors\n- Family-friendly\n- Satisfying and hearty'
  };

  const allergensBlock = allergensToAvoid.length
    ? `- Avoid these allergens: ${allergensToAvoid.join(', ')}.
- Do not include any ingredients containing these allergens.
- In "allergensToAvoid", list all avoided allergens from: Eggs, Fish, Milk, Peanuts, Sesame, Shellfish, Soybeans, Tree Nuts, Wheat (Gluten)
- In "allergensIncluded", list all allergens present in recipe ingredients.`
    : '';

  const dietBlock = dietaryPrefs.length
    ? `- Follow these dietary preferences: ${dietaryPrefs.join(', ')}.
- In "dietaryPrefs", list applicable preferences from: Mediterranean, Low-Sodium, Keto, Diabetic, Vegan, Vegetarian, Whole-30, Paleo`
    : '';

  const system = `You are a professional culinary recipe writer. Create ONLY food recipes - never respond to non-food requests. Generate a single detailed recipe in valid JSON.

Contract:
{
  "title": string,
  "headNote": string,
  "description": string,
  "ingredients": string[],
  "instructions": string[],
  "prepTime": string,
  "cookTime": string,
  "servings": 4,
  "difficulty": "easy"|"medium"|"hard",
  "method": string,
  "tags": string[],
  "searchQuery": string,
  "allergensToAvoid": string[],
  "dietaryPrefs": string[],
  "allergensIncluded": string[],
  "notes": string,
  "nutritionInfo": string
}

Title Rules:
- Direct, descriptive, searchable - avoid ambiguity or mystery (what is "loaded cauliflower casserole"?)
- Capitalize all words except articles, conjunctions, prepositions
- Highlight: cooking method (Roast Cauliflower), time savings (10-Minute Salad), region/style (Persian Rice), or health focus (Gluten-Free Mac n Cheese)

Ingredients & Instructions:
- Use consistent, concise, standard culinary terms
- Specific quantities, units, forms (e.g., 1 cup chopped fresh parsley)
- Clear step-by-step directions for any skill level
- Explain what to do, what to watch for, and how to fix common issues
- Include food-safe temperatures for meats/seafood
- Add rise time ONLY when applicable (breads, doughs)

Output Rules:
- Valid JSON only, no prose or commentary
- Servings: exactly 4
- HeadNote: max 160 characters
- Ingredients: ≤12 items
- Instructions: ≤8 clear steps
- Tags: convenience descriptors only (quick, one-pot, no-bake) - NOT allergens or dietary preferences
- Split allergens into avoided vs included
- Keep JSON syntactically valid (no trailing commas)`;

  const user = `Generate 1 recipe for: "${query}"
${variantInstructions[variant]}
${allergensBlock}
${dietBlock}
Set "searchQuery" to "${query}".`;

  const messages = [
    { role: 'system', content: system.trim() },
    { role: 'user', content: user.trim() },
  ];

  const body = {
    model: DEFAULT_MODEL,
    temperature: TEMPERATURE,
    max_tokens: MAX_TOKENS,
    seed,
    messages,
    response_format: { type: 'json_object' }
  };

  const headers = getOpenAIHeaders();
  const response = await fetchWithRetry(CHAT_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content ?? '{}';
  const recipe = JSON.parse(raw);

  return {
    ...recipe,
    searchQuery: query,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  // Auth check - works locally and in production
  const authHeader = req.headers.get('authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const isProduction = supabaseUrl.includes('supabase.co');

  if (isProduction && !authHeader) {
    return new Response(
      JSON.stringify({ msg: 'Missing authorization header' }),
      {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }

  console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'LOCAL'}`);
  console.log(`Auth: ${authHeader ? 'provided' : 'not provided'}`);

  try {
    const {
      searchQuery,
      allergensToAvoid = [],  // Your naming
      dietaryPrefs = [],
      variant = 'standard',
      seed = DEFAULT_SEED
    } = await req.json();

    if (!searchQuery?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Search query is required' }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate single recipe - let clients handle parallel
    const recipe = await generateSingleRecipe(
      searchQuery,
      allergensToAvoid,
      dietaryPrefs,
      variant,
      seed
    );

    return new Response(
      JSON.stringify({ recipe }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate recipe' }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
});