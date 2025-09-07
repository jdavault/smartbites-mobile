import { supabase } from '@/lib/supabase';

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
  tags: string[];
  searchQuery: string;
  allergensToAvoid: string[];
  dietaryPrefs: string[];
  allergensIncluded: string[];
  notes: string;
  nutritionInfo: string;
}

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};
const IMAGE_MODEL = 'dall-e-3';
const IMAGE_SIZE = '1024x1024'; // was "1024x1024" — smaller helps under tight limits
const DEFAULT_IMG =
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_TIMEOUT_MS = 25_000;
// Cache for the API key to avoid multiple requests
let cachedApiKey: string | null = null;

// Get OpenAI API key securely from edge function
async function getOpenAIKey(): Promise<string> {
  if (cachedApiKey) {
    return cachedApiKey;
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL is required');
  }

  const edgeUrl = `${supabaseUrl}/functions/v1/getOpenAIKey`;

  // Get current session for authorization (optional)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(edgeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error || `Failed to get API key: ${response.status}`
    );
  }

  const data = await response.json();
  cachedApiKey = data.apiKey;

  if (!cachedApiKey) {
    throw new Error('No API key returned from edge function');
  }

  return cachedApiKey;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Retries on 429 and 5xx. Respects Retry-After if present.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  tries = 4
): Promise<Response> {
  let lastErr: unknown;

  for (let attempt = 1; attempt <= tries; attempt++) {
    let res: Response | null = null;
    try {
      res = await fetch(url, init);
    } catch (err) {
      lastErr = err;
    }

    if (res && res.ok) return res;

    // Decide whether to retry
    const status = res?.status ?? 0;
    const shouldRetry = status === 429 || (status >= 500 && status < 600);
    if (!shouldRetry || attempt === tries) {
      if (res) {
        const text = await res.text().catch(() => '');
        throw new Error(
          `OpenAI API error ${status}: ${text || res.statusText}`
        );
      }
      throw lastErr instanceof Error ? lastErr : new Error('Network error');
    }

    // Backoff (use Retry-After when present)
    const retryAfter = res?.headers.get('retry-after');
    const retryMs = retryAfter
      ? Number(retryAfter) * 1000
      : (800 + Math.random() * 400) * Math.pow(2, attempt - 1);
    await sleep(retryMs);
  }

  throw new Error('Retries exhausted');
}

// const retryWithBackoff = async <T>(
//   fn: () => Promise<T>,
//   maxRetries = 3
// ): Promise<T> => {
//   for (let i = 0; i < maxRetries; i++) {
//     try {
//       return await fn();
//     } catch (error: any) {
//       if (i === maxRetries - 1) throw error;
//       await new Promise((resolve) =>
//         setTimeout(resolve, Math.pow(2, i) * 1000)
//       );
//     }
//   }
//   throw new Error('Max retries exceeded');
// };

async function getOpenAIHeaders() {
  const apiKey = await getOpenAIKey(); // your Edge function call (keeps key off device)
  // Prefer pulling these from env/secrets so you don't hard-code:
  const org = 'org-pigNWK6KQYXhW9KadKfDpVGu'; //process.env.EXPO_PUBLIC_OPENAI_ORG_ID;
  const project = 'proj_WQLJGYZRj2GPZSmGchawQ5Bu'; //process.env.EXPO_PUBLIC_OPENAI_PROJECT;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  if (org) headers['OpenAI-Organization'] = org;
  if (project) headers['OpenAI-Project'] = project;

  return headers;
}

export async function callOpenAI(
  messages: ChatMessage[],
  options: any = {},
  { timeoutMs = DEFAULT_TIMEOUT_MS }: { timeoutMs?: number } = {}
) {
  const headers = await getOpenAIHeaders();

  // Reasonable defaults; caller can override via options
  const body = {
    model: DEFAULT_MODEL,
    temperature: 0.3,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
    messages,
    ...options,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchWithRetry(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      },
      4 // attempts
    );
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateRecipes(
  query: string,
  allergensToAvoid: string[] = [],
  dietaryPrefs: string[] = []
): Promise<GeneratedRecipe[]> {
  try {
    const debugMessages: string[] = [];
    debugMessages.push(`=== generateRecipes START ===`);
    debugMessages.push(`Query: "${query}"`);
    debugMessages.push(`Allergens: ${JSON.stringify(allergensToAvoid)}`);
    debugMessages.push(`Dietary Prefs: ${JSON.stringify(dietaryPrefs)}`);

    const allergensBlock = allergensToAvoid.length
      ? [
          `- Avoid these allergens: ${allergensToAvoid.join(', ')}.`,
          `- Do not include any ingredients or instructions that contain the allergens above.`,
          `- In "allergensToAvoid", list any and all allergens (especially those provided) that are avoided in the final recipe based on this list:`,
          `  Eggs, Fish, Milk, Peanuts, Sesame, Shellfish, Soybeans, Tree Nuts, Wheat (Gluten)`,
          `- In "allergensIncluded", list any and all allergens from the same list that ARE present in the recipe's actual ingredients. This should be mutually exclusive from "allergensToAvoid".`,
        ].join('\n')
      : '';

    const dietBlock = dietaryPrefs.length
      ? [
          `- Follow these dietary preferences: ${dietaryPrefs.join(', ')}.`,
          `- In "dietaryPrefs", list any and all dietary preferences (especially those provided) that apply to or fall into the category of any of these:`,
          `  Mediterranean, Low-Sodium, Keto, Diabetic, Vegan, Vegetarian, Whole-30, and Paleo`,
        ].join('\n')
      : '';

    const system = `You are a professional culinary recipe writer. Create ONLY food recipes - never respond to non-food requests. Create a detailed, well-structured recipe. Output ONLY valid JSON (no prose).
      Contract:
      {
        "recipes":[
          {
            "title": string,
            "headNote": string,        // <=160 chars
            "description": string,
            "ingredients": string[],   // <=12
            "instructions": string[],  // <=8
            "prepTime": string,        // e.g. "15 minutes"
            "cookTime": string,        // e.g. "15 minutes"
            "servings": integer,
            "difficulty": "easy"|"medium"|"hard",
            "method": string,          // cooking method from enum
            "tags": string[],          // <=6 (e.g., quick, no-bake, one-pot)
            "searchQuery": string,
            "allergensToAvoid": string[],   // List of allergens explicitly AVOIDED and NOT in the recipe
            "dietaryPrefs": string[],       // from: Mediterranean, Low-Sodium, Keto, Diabetic, Vegan, Vegetarian, Whole-30, Paleo
            "allergensIncluded": string[],  // List of allergens actually PRESENT in recipe ingredients
            "notes": string,
            "nutritionInfo": string
          }
        ]
      }

      Final Recipe Rules:
        Allergens
          - "allergensToAvoid": Array of allergens that must be excluded from the recipe (from: Eggs, Fish, Milk, Peanuts, Sesame, Shellfish, Soybeans, Tree Nuts, Wheat (Gluten)).
          - "allergensIncluded": Array of allergens that ARE present in the recipe's actual ingredients. REQUIRED. [] if none.
          - You MUST scan the "ingredients" list and explicitly cross-check against this allergen list.
          - Cross-check each ingredient against this allergen mapping:
              • Any cheese, milk, cream, yogurt → Milk
              • Any bread, bun, flour, pasta, cracker → Wheat (Gluten)
              • Any shrimp, crab, lobster, scallop, oyster → Shellfish
              • Any almond, walnut, cashew, pistachio, pecan, hazelnut, macadamia → Tree Nuts
              • Any soy sauce, tofu, edamame → Soybeans
              • Any egg → Eggs
              • Any fish by name (salmon, cod, tuna, etc.) → Fish
              • Any sesame seed, tahini → Sesame
              • Any peanut, peanut butter → Peanuts
          - If any ingredient contains or implies one of these allergens, include it in "allergensIncluded".
          - The two arrays must never overlap.
          - Example:
              Ingredients: ["4 hotdog buns", "2 tbsp butter", "1 lb shrimp"]
              → "allergensToAvoid": ["Eggs", "Peanuts"]   // provided to avoid
              → "allergensIncluded": ["Wheat (Gluten)", "Milk", "Shellfish"]
        Title Rules
          - Use a direct, descriptive title that is clear, accurate, and searchable. Avoid ambiguity or mystery (what is loaded cauliflower casserole?).
          - Capitalize all words except articles, conjunctions, and prepositions (e.g., Pigs in a Blanket, Patty Melt with Cabbage on Rye).
          - Ensure titles are not misleading and are helpful for search and classification.
          - Titles should highlight:
            - Cooking method (Roast Cauliflower, Grilled Sea Bass).
            - Time savings (10-Minute Salad, No-Bake Trail Mix).
            - Region or style (New England Johnny Cakes, Persian Rice).
            - Key ingredients or health focus (Gluten-Free Mac n Cheese, Vegan Chocolate Chip Cookies).
        Ingredients & Measurements
          - Use consistent, concise, standard culinary terms.
          - Be specific with ingredient quantities, units, and forms (e.g., 1 cup chopped fresh parsley).
        Times
          - Include realistic prep and cook times in minutes (e.g., 15 minutes).
          - Add Rise Time BUT ONLY when applicable (e.g., breads, pizza dough, hamburger buns).
        Instructions
          - Write clear, step-by-step directions that guide any home cook to succeed.
          - Instructions and ingredient names must be clear, practical, and appropriate for all skill levels.
          - Explain what to do, what to watch for, and how to fix common issues when possible.
          - Include food-safe internal temperatures for meats and seafood.
          - Serving size must be exactly 4 servings (hard limit), and specified using Imperial units (e.g., "Serves 4" or "4 servings").
        Tags 
          - Tags are not allergens or dietary preferences — they are convenience/descriptor tags (e.g., BBQ, easy, quick, no-bake, one-pot).
        Formatting & Output
          - Keep JSON syntactically valid (no trailing commas, no commentary).
          - Return only a valid JSON object in the exact required structure.
    `;

    const user = [
      `Generate 3 recipes for: "${query}"`,
      allergensBlock,
      dietBlock,
      `Return exactly 3 items in "recipes". Set "searchQuery" to "${query}" on each.`,
    ]
      .filter(Boolean)
      .join('\n');

    const messages: ChatMessage[] = [
      { role: 'system', content: system.trim() },
      { role: 'user', content: user.trim() },
    ];

    const data = await callOpenAI(messages, {
      model: DEFAULT_MODEL,
      temperature: 0.3,
      max_tokens: 3000,
      seed: 7,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'recipes_schema',
          strict: true, // <— important
          schema: {
            type: 'object',
            properties: {
              recipes: {
                type: 'array',
                minItems: 3,
                maxItems: 3,
                items: {
                  type: 'object',
                  required: [
                    'title',
                    'headNote',
                    'description',
                    'ingredients',
                    'instructions',
                    'prepTime',
                    'cookTime',
                    'servings',
                    'difficulty',
                    'method',
                    'tags',
                    'searchQuery',
                    'allergensToAvoid',
                    'dietaryPrefs',
                    'allergensIncluded',
                    'notes',
                    'nutritionInfo',
                  ],
                  properties: {
                    title: { type: 'string' },
                    headNote: { type: 'string' },
                    description: { type: 'string' },
                    ingredients: {
                      type: 'array',
                      items: { type: 'string' },
                      maxItems: 8,
                    },
                    instructions: {
                      type: 'array',
                      items: { type: 'string' },
                      maxItems: 5,
                    },
                    prepTime: { type: 'string' },
                    cookTime: { type: 'string' },
                    servings: { type: 'integer', enum: [4] },
                    difficulty: {
                      type: 'string',
                      enum: ['easy', 'medium', 'hard'],
                    },
                    method: {
                      type: 'string',
                      enum: [
                        'Bake',
                        'Boil',
                        'Grill',
                        'Braise',
                        'Steam',
                        'Fry',
                        'Stew',
                        'Sous vide',
                        'Slow cooker',
                        'Instant Pot',
                        'Microwave',
                        'Air Fryer',
                      ],
                    },
                    tags: {
                      type: 'array',
                      items: { type: 'string' },
                      maxItems: 6,
                    },
                    searchQuery: { type: 'string' },
                    allergensToAvoid: {
                      type: 'array',
                      description:
                        'Allergens that are explicitly avoided and NOT present.',
                      items: {
                        type: 'string',
                        enum: [
                          'Eggs',
                          'Fish',
                          'Milk',
                          'Peanuts',
                          'Sesame',
                          'Shellfish',
                          'Soybeans',
                          'Tree Nuts',
                          'Wheat (Gluten)',
                        ],
                      },
                    },
                    dietaryPrefs: {
                      type: 'array',
                      items: {
                        type: 'string',
                        enum: [
                          'Mediterranean',
                          'Low-Sodium',
                          'Keto',
                          'Diabetic',
                          'Vegan',
                          'Vegetarian',
                          'Whole-30',
                          'Paleo',
                        ],
                      },
                    },
                    allergensIncluded: {
                      type: 'array',
                      description:
                        'List ALL allergens actually present in the recipe ingredients (mutually exclusive from allergensToAvoid). Always required, [] if none.',
                      items: {
                        type: 'string',
                        enum: [
                          'Eggs',
                          'Fish',
                          'Milk',
                          'Peanuts',
                          'Sesame',
                          'Shellfish',
                          'Soybeans',
                          'Tree Nuts',
                          'Wheat (Gluten)',
                        ],
                      },
                    },
                    notes: { type: 'string' },
                    nutritionInfo: { type: 'string' },
                  },
                  additionalProperties: false,
                },
              },
            },
            required: ['recipes'],
            additionalProperties: false,
          },
        },
      },
    });

    debugMessages.push(`OpenAI Response received.`);
    debugMessages.push(`Choices count: ${data.choices?.length || 0}`);
    debugMessages.push(
      `First choice snippet: ${
        data.choices?.[0]?.message?.content?.substring(0, 200) || 'EMPTY'
      }`
    );

    // DEBUG: Log the complete OpenAI response
    console.log(
      '🤖 DEBUG: Complete OpenAI API response:',
      JSON.stringify(data, null, 2)
    );
    console.log(
      '🤖 DEBUG: OpenAI response status:',
      data?.choices?.[0]?.finish_reason
    );
    console.log('🤖 DEBUG: OpenAI usage tokens:', data?.usage);

    const raw = data?.choices?.[0]?.message?.content ?? '{"recipes":[] }';
    console.log('🤖 DEBUG: Raw JSON content from OpenAI:');
    console.log(raw);
    console.log('🤖 DEBUG: Raw content length:', raw.length);

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
      console.log('🤖 DEBUG: Successfully parsed JSON structure:');
      console.log(JSON.stringify(parsed, null, 2));
      console.log(
        '🤖 DEBUG: Recipes array length:',
        parsed?.recipes?.length || 0
      );
    } catch {
      console.log('🤖 DEBUG: JSON parse FAILED - using empty fallback');
      parsed = { recipes: [] };
    }

    const recipes: GeneratedRecipe[] = Array.isArray(parsed.recipes)
      ? parsed.recipes
      : [];
    const result = recipes
      .slice(0, 3)
      .map((r) => ({ ...r, searchQuery: query }));

    console.log(
      '🤖 OpenAI recipes generated:',
      JSON.stringify(result, null, 2)
    );
    result.forEach((recipe, index) => {
      console.log(`🤖 DEBUG: Recipe ${index + 1} breakdown:`);
      console.log(`  - Title: "${recipe.title}"`);
      console.log(`  - Method: "${recipe.method}"`);
      console.log(`  - AllergensToAvoid:`, recipe.allergensToAvoid);
      console.log(`  - AllergensToAvoid:`, recipe.allergensToAvoid);
      console.log(`  - AllergensIncluded:`, recipe.allergensIncluded);
      console.log(
        `  - AllergensIncluded type:`,
        typeof recipe.allergensIncluded
      );
      console.log(
        `  - AllergensIncluded isArray:`,
        Array.isArray(recipe.allergensIncluded)
      );
      console.log(`  - Full recipe object:`, JSON.stringify(recipe, null, 2));
    });

    if (result.length === 0) {
      throw new Error('No recipes were generated. Please try again later.');
    }

    debugMessages.push(`=== generateRecipes END ===`);

    console.log('[generateRecipes DEBUG]', debugMessages.join('\n'));
    return result;
  } catch (err) {
    console.error('Error generating recipes:', err);
    throw new Error('Failed to generate recipes. Please try again later.');
  }
}

export async function generateRecipeImage(title: string): Promise<string> {
  try {
    // Return a special marker that indicates we should generate the image
    // The actual generation will be handled by generateAndUploadImage
    return `GENERATE_IMAGE:${title}`;
  } catch (err) {
    console.error('Error generating recipe image:', err);
    throw new Error('Failed to generate recipe image. Please try again later.');
  }
}

async function fetchWithRateLimitRetry(
  url: string,
  init: RequestInit,
  tries = 3
): Promise<Response> {
  for (let attempt = 1; attempt <= tries; attempt++) {
    const res = await fetch(url, init);

    // Log useful RL headers for diagnosis
    const rlLimit = res.headers.get('x-ratelimit-limit-requests');
    const rlRemain = res.headers.get('x-ratelimit-remaining-requests');
    const rlReset = res.headers.get('x-ratelimit-reset-requests');
    const retryAfter = res.headers.get('retry-after');

    if (!res.ok) {
      // handle 429 with backoff
      if (res.status === 429 && attempt < tries) {
        const retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : undefined;
        const backoffMs =
          retryAfterMs ??
          1500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 400);

        console.warn(
          `[images] 429 attempt ${attempt}/${tries} — limit=${rlLimit}, remaining=${rlRemain}, reset=${rlReset}, retryAfter=${retryAfter}. Backing off ${backoffMs}ms`
        );
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      const text = await res.text().catch(() => '');
      throw new Error(
        `OpenAI image error ${res.status}: ${
          text || res.statusText
        } (limit=${rlLimit}, remaining=${rlRemain}, reset=${rlReset})`
      );
    }

    return res; // success
  }
  throw new Error('OpenAI image error: retries exhausted');
}