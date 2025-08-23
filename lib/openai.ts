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

const cleanAndParse = (content: string): any => {
  try {
    // Find the first opening brace and last closing brace
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      throw new Error('No valid JSON object found in response');
    }

    // Extract content between braces
    const jsonContent = content.substring(firstBrace, lastBrace + 1);
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error('Invalid JSON response from OpenAI');
  }
};

// export async function generateRecipe(
//   query: string,
//   allergens: string[] = [],
//   dietaryPrefs: string[] = []
// ): Promise<GeneratedRecipe> {
//   // Check if API key is available
//   if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
//     throw new Error(
//       'OpenAI API key not found. Please add EXPO_PUBLIC_OPENAI_API_KEY to your environment variables.'
//     );
//   }

//   try {
//     const allergensText =
//       allergens.length > 0
//         ? `The recipe must avoid these allergens: ${allergens.join(', ')}.`
//         : 'No specific allergens to avoid.';

//     const dietText =
//       dietaryPrefs.length > 0
//         ? `The recipe must follow these dietary preferences: ${dietaryPrefs.join(
//             ', '
//           )}.`
//         : 'No specific dietary preferences.';

//     const prompt = `You are a professional culinary recipe writer. Create a detailed, well-structured recipe for "${query}".

//       - ${allergensText}
//       - ${dietText}
//       - Do not include any ingredients or instructions that contain these allergens.
//       - The "allergens" field must still list any potential allergens naturally present in the final recipe.
//       - The "dietaryPrefs" field must list the dietary preferences included in the final recipe.

//       - Use the exact casing and spelling for each allergen as provided: Eggs, Fish, Milk, Peanuts, Sesame, Shellfish, Soybeans, Tree Nuts, Wheat (Gluten).

//       Your goal is to write this recipe clearly and concisely, following best practices for real-world publication:

//         - Use consistent, standard culinary terms.
//         - Be specific with ingredient quantities, measurements, and units (e.g., "1 cup chopped fresh parsley").
//         - Include realistic prep and cook times in minutes (e.g., "15 minutes").
//         - Write clear, step-by-step instructions that guide any home cook to succeed — explain what to do, what to watch for, and how to fix common issues when possible.
//         - Use a descriptive, direct recipe title that is clear, searchable, and accurate — avoid ambiguity, mystery, or inaccurate dish names.
//         - Follow proper recipe title grammar: capitalize all words except articles, conjunctions, and prepositions.
//         - Avoid ambiguous title -- "what is loaded cauliflower casserole.  Be descriptive "Cauliflower and Broccoli Gratin with Garlic Breadcrumbs"
//         Return ONLY a valid JSON object in the following exact structure. Do not include any text or commentary outside the JSON:
//         - In recipe titles, all words except articles, propositions, and conjunctions should be capitalized -- e.g. Pigs in a Blanket, Scallion Dressing, Patty Melt with Cabbage on Rye
//         - Use Direct, descriptive Title - e.g. Avocado Toast with Smoked Salmon, Black Bean and Corn Quinoa
//         - Titles should highlight cooking method -- e.g. Roast Cauliflower, Grilled Sea Bass
//         - Use region or promotional title -- e.g. New England Johnny Cakes, Persian Rice, Ultimate Fudge Brownies
//         - Title can/should also highlight saving time - 10-minute salad, no-bake trail mix
//         - Title can/should reflect ingredients or health focus - Gluten-Free Mac n Cheese, Vegan Chocolate Chip Cookies
//         - Add "Rise Time" to recipes as needed. Ie hamburger buns, breads, pizza dough, etc.
//         - Tags are not allergens or dietary preferences .. they are additional descriptors, categories or conveniences for the recipe, such as no-bake, quick, easy, or one-pot.
//         - For each recipe list any of the following for which the recipe is free of: Milk, Eggs, Fish, Shellfish, Tree Nuts, Soybeans, Tree Nuts, Peanuts, Wheat (Gluten), Soy, Sesame, and store these in the allergens array
//         - For each recipe list any dietaryPrefs the recipe is suitable for: Vegetarian, Vegan, Gluten-Free, Dairy-Free, Keto, Paleo, Low-Carb, High-Protein and store that in the dietaryPrefs array

//       Return ONLY a valid JSON object in the following exact structure:
//       {
//         "recipes": [
//           {
//             "title": "Recipe Title",
//             "headNote": "Brief, enticing description that explains the dish",
//             "description": "Brief, enticing description that explains the dish - context or extra tips",
//             "ingredients": ["Ingredient 1", "Ingredient 2"],
//             "instructions": ["Step 1", "Step 2"],
//             "prepTime": "15 minutes",
//             "cookTime": "30 minutes",
//             "servings": 4,
//             "difficulty": "easy",
//             "tags": ["tag1", "tag2"],
//             "searchQuery": "search query used to generate this recipe",
//             "allergens",
//             "dietaryPrefs",
//             "notes": "for substitutions or troubleshooting",
//             "nutritionInfo": "nutrition information"
//           }
//         ]
//       }

//         - The JSON must be syntactically valid — no trailing commas, no extra commentary.
//         - Ingredient names and instructions must be clear and practical.
//         - Titles must be direct, descriptive, and not misleading.
//         - Always be mindful that your recipe should teach and guide any home cook to success, regardless of their skill level.
//       `;

//     const schema = {
//       name: 'recipes_payload',
//       schema: {
//         type: 'object',
//         properties: {
//           recipes: {
//             type: 'array',
//             minItems: 5,
//             maxItems: 5,
//             items: {
//               type: 'object',
//               properties: {
//                 title: { type: 'string' },
//                 headNote: { type: 'string', maxLength: 160 },
//                 description: { type: 'string' },
//                 ingredients: {
//                   type: 'array',
//                   items: { type: 'string' },
//                   maxItems: 12,
//                 },
//                 instructions: {
//                   type: 'array',
//                   items: { type: 'string' },
//                   maxItems: 8,
//                 },
//                 prepTime: { type: 'string' },
//                 cookTime: { type: 'string' },
//                 servings: { type: 'integer' },
//                 difficulty: {
//                   type: 'string',
//                   enum: ['easy', 'medium', 'hard'],
//                 },
//                 tags: { type: 'array', items: { type: 'string' }, maxItems: 6 },
//                 searchQuery: { type: 'string' },
//                 allergens: {
//                   type: 'array',
//                   items: { type: 'string' },
//                   maxItems: 6,
//                 },
//                 dietaryPrefs: {
//                   type: 'array',
//                   items: { type: 'string' },
//                   maxItems: 6,
//                 },
//                 notes: { type: 'string' },
//                 nutritionInfo: { type: 'string' },
//               },
//               required: [
//                 'title',
//                 'headNote',
//                 'description',
//                 'ingredients',
//                 'instructions',
//                 'prepTime',
//                 'cookTime',
//                 'servings',
//                 'difficulty',
//                 'tags',
//                 'searchQuery',
//                 'allergens',
//                 'dietaryPrefs',
//                 'notes',
//                 'nutritionInfo',
//               ],
//               additionalProperties: false,
//             },
//           },
//         },
//         required: ['recipes'],
//         additionalProperties: false,
//       },
//     };

//     const response = await retryWithBackoff(() =>
//       fetch('https://api.openai.com/v1/chat/completions', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
//         },
//         body: JSON.stringify({
//           model: 'gpt-4o-mini',
//           response_format: {
//             type: 'json_object',
//             json_schema: schema,
//           },
//           messages: [
//             {
//               role: 'system',
//               content: prompt,
//             },
//             {
//               role: 'user',
//               content: `Generate a recipe for: ${query}`,
//             },
//           ],
//           max_tokens: 3000,
//           temperature: 0.3,
//         }),
//       })
//     );

//     if (!response.ok) {
//       throw new Error(`OpenAI API error: ${response.status}`);
//     }

//     const data = await response.json();
//     const content = data.choices[0].message.content;

//     const recipeData = cleanAndParse(content);
//     return {
//       ...recipeData,
//       searchQuery: query,
//     };
//   } catch (error) {
//     if (error instanceof Error && error.message.includes('401')) {
//       console.error(
//         'OpenAI API key is invalid. Please check your EXPO_PUBLIC_OPENAI_API_KEY.'
//       );
//     } else {
//       console.error('Error generating recipe:', error);
//     }

//     // Return a mock recipe for demonstration
//     return generateMockRecipe(query, allergens, dietaryPrefs);
//   }
// }

export async function generateRecipes(
  query: string,
  allergens: string[] = [],
  dietaryPrefs: string[] = []
): Promise<GeneratedRecipe[]> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error(
      'OpenAI API key not found. Set EXPO_PUBLIC_OPENAI_API_KEY.'
    );
  }

  try {
    // --- Constraint blocks (only included when non-empty) ---
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

    // --- System prompt (unchanged structure; just minor tidy) ---
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

    // Build user prompt with optional blocks
    const user = [
      `Generate 3 recipes for: "${query}"`,
      allergensBlock,
      dietBlock,
      `Return exactly 3 items in "recipes". Set "searchQuery" to "${query}" on each.`,
    ]
      .filter(Boolean)
      .join('\n');

    const response = await retryWithBackoff(() =>
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.3,
          max_tokens: 1400,
          seed: 7,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system.trim() },
            { role: 'user', content: user.trim() },
          ],
        }),
        // If AbortSignal.timeout isn't available in your runtime, swap to an AbortController wrapper.
        signal: (AbortSignal as any).timeout?.(25000),
      })
    );

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
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

    console.log('---------------------- RECIPES ----------------------');
    console.log(
      'Recipe constraints:',
      result.map((r, i) => ({
        recipe: i + 1,
        allergens: r.allergens,
        dietaryPrefs: r.dietaryPrefs,
      }))
    );
    return result;
    // return result.length
    //   ? result
    //   : [generateMockRecipe(query, allergens, dietaryPrefs)];
  } catch (error) {
    if (error instanceof Error && error.message.includes('401')) {
      console.warn(
        'OpenAI API key invalid/expired. Falling back to mock recipe.',
        error
      );
    } else {
      console.error('Error generating recipes:', error);
      console.warn('Falling back to mock recipe due to API error.');
    }
    return [generateMockRecipe(query, allergens, dietaryPrefs)];
  }
}

export async function generateRecipeImage(title: string): Promise<string> {
  try {
    const response = await retryWithBackoff(() =>
      fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          prompt: `High quality food photo of ${title}, professional lighting, styled on a plate`,
          n: 1,
          size: '512x512',
        }),
      })
    );

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return (
      data?.data?.[0]?.url ||
      'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'
    );
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
