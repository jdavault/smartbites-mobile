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
  allergens: string[];
  dietaryPrefs: string[];
  notes: string;
  nutritionInfo: string;
}

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

  const edgeUrl = `${supabaseUrl}/functions/v1/generate-recipes`;
  
  // Get current session for authorization (optional)
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(edgeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        'Authorization': `Bearer ${session.access_token}`
      }),
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error || `Failed to get API key: ${response.status}`);
  }

  const data = await response.json();
  cachedApiKey = data.apiKey;
  
  if (!cachedApiKey) {
    throw new Error('No API key returned from edge function');
  }

  return cachedApiKey;
}

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  throw new Error('Max retries exceeded');
};

// Direct OpenAI API call with secure key
async function callOpenAI(messages: any[], options: any = {}) {
  const apiKey = await getOpenAIKey();
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ 
      messages,
      ...options
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `OpenAI API error: ${response.status}`);
  }

  return await response.json();
}

export async function generateRecipes(
  query: string,
  allergens: string[] = [],
  dietaryPrefs: string[] = []
): Promise<GeneratedRecipe[]> {
  try {
    // Build constraint blocks
    const allergensBlock = allergens.length
      ? [
          `- Avoid these allergens: ${allergens.join(', ')}.`,
          `- Do not include any ingredients or instructions that contain the allergens above.`,
          `- In "allergens", list any and all allergens (including those provided) that are avoided in the final recipe per this list:`,
          `  Eggs, Fish, Milk, Peanuts, Sesame, Shellfish, Soybeans, Tree Nuts, Wheat (Gluten)`,
        ].join('\n')
      : '';

    const dietBlock = dietaryPrefs.length
      ? [
          `- Follow these dietary preferences: ${dietaryPrefs.join(', ')}.`,
          `- In "dietaryPrefs", list any and all dietary preferences (including those provided) that would be covered by or apply to this recipe, per this list:`,
          `  Vegetarian, Vegan, Gluten-Free, Dairy-Free, Keto, Paleo, Low-Carb, High-Protein`,
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
            "tags": string[],          // <=6 (e.g., quick, no-bake, one-pot)
            "searchQuery": string,
            "allergens": string[],     // from: Eggs, Fish, Milk, Peanuts, Sesame, Shellfish, Soybeans, Tree Nuts, Wheat (Gluten)
            "dietaryPrefs": string[],  // from: Vegetarian, Vegan, Gluten-Free, Dairy-Free, Keto, Paleo, Low-Carb, High-Protein
            "notes": string,
            "nutritionInfo": string
          }
        ]
      }

      Final Recipe Rules:
        Title Rules
          - Use a direct, descriptive title that is clear, accurate, and searchable. Avoid ambiguity or mystery (what is loaded cauliflower casserole?).
          - Capitalize all words except articles, conjunctions, and prepositions (e.g., Pigs in a Blanket, Patty Melt with Cabbage on Rye).
          - Titles should highlight:
            - Cooking method (Roast Cauliflower, Grilled Sea Bass).
            - Time savings (10-Minute Salad, No-Bake Trail Mix).
            - Region or style (New England Johnny Cakes, Persian Rice).
            - Key ingredients or health focus (Gluten-Free Mac n Cheese, Vegan Chocolate Chip Cookies).
        Ingredients & Measurements
          - Use consistent, standard culinary terms.
          - Be specific with ingredient quantities, units, and forms (e.g., 1 cup chopped fresh parsley).
        Times
          - Include realistic prep and cook times in minutes (e.g., 15 minutes).
          - Add Rise Time when applicable (e.g., breads, pizza dough, hamburger buns).
        Instructions
          - Write clear, step-by-step directions that guide any home cook to succeed.
          - Explain what to do, what to watch for, and how to fix common issues when possible.
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

    const messages = [
      { role: 'system', content: system.trim() },
      { role: 'user', content: user.trim() },
    ];

    const data = await retryWithBackoff(() =>
      callOpenAI(messages, {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 1400,
        seed: 7,
        response_format: { type: 'json_object' },
      })
    );

    const raw = data.choices?.[0]?.message?.content ?? '{"recipes": []}';

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { recipes: [] };
    }

    const recipes: GeneratedRecipe[] = Array.isArray(parsed.recipes)
      ? parsed.recipes
      : [];

    const result = recipes
      .slice(0, 3)
      .map((r) => ({ ...r, searchQuery: query }));

    return result.length ? result : [generateMockRecipe(query, allergens, dietaryPrefs)];

  } catch (error) {
    console.error('Error generating recipes:', error);
    
    // Fallback to mock recipe
    return [generateMockRecipe(query, allergens, dietaryPrefs)];
  }
}

export async function generateRecipeImage(title: string): Promise<string> {
  try {
    const apiKey = await getOpenAIKey();
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `High quality food photo of ${title}, professional lighting, styled on a plate`,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `Image generation error: ${response.status}`);
    }

    const data = await response.json();
    
    // OpenAI DALL-E response format
    const imageUrl = data?.data?.[0]?.url;
    return imageUrl || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';
    
  } catch (error) {
    console.error('Error generating recipe image:', error);
    return 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';
  }
}

function generateMockRecipe(
  query: string,
  allergens: string[],
  dietaryPrefs: string[]
): GeneratedRecipe {
  return {
    title: `Delicious ${query}`,
    headNote: `A wonderful take on ${query} that's both flavorful and satisfying.`,
    description: `This ${query} recipe combines fresh ingredients with simple cooking techniques to create a memorable meal.`,
    ingredients: [
      '2 cups fresh ingredients',
      '1 tablespoon olive oil',
      '1 teaspoon salt',
      '1/2 teaspoon black pepper',
      '2 cloves garlic, minced',
    ],
    instructions: [
      'Prepare all ingredients by washing and chopping as needed.',
      'Heat olive oil in a large skillet over medium heat.',
      'Add garlic and cook for 1 minute until fragrant.',
      'Add main ingredients and season with salt and pepper.',
      'Cook for 15-20 minutes until tender and golden.',
      'Serve immediately while hot.',
    ],
    prepTime: '15 minutes',
    cookTime: '25 minutes',
    servings: 4,
    difficulty: 'easy' as const,
    tags: ['quick', 'healthy', 'family-friendly'],
    searchQuery: query,
    allergens: [],
    dietaryPrefs: dietaryPrefs,
    notes: 'Feel free to substitute ingredients based on your preferences.',
    nutritionInfo: 'Approximately 250 calories per serving',
  };
}