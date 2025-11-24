// utils/generateAIRecipes.ts
// Generate recipes in parallel with configurable count and variant

import { callOpenAI, type ChatMessage } from '@/lib/openai';

export interface GeneratedRecipe {
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

export type RecipeVariant = 'quick' | 'standard' | 'gourmet' | 'budget' | 'comfort' | 'mix';

const DEFAULT_MODEL = 'gpt-4o-mini';

// Variant display names for UI
export const VARIANT_LABELS: Record<RecipeVariant, string> = {
  quick: 'Quick (< 30 min)',
  standard: 'Standard',
  gourmet: 'Gourmet',
  budget: 'Budget-Friendly',
  comfort: 'Comfort Food',
  mix: 'Mix (Variety)',
};

// All variants except 'mix'
const ALL_VARIANTS: Exclude<RecipeVariant, 'mix'>[] = ['quick', 'standard', 'gourmet', 'budget', 'comfort'];

/**
 * Generate a single recipe with a specific variant
 */
async function generateSingleRecipe(
  query: string,
  allergensToAvoid: string[] = [],
  dietaryPrefs: string[] = [],
  variant: Exclude<RecipeVariant, 'mix'> = 'standard',
  seed: number = 7
): Promise<GeneratedRecipe> {
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

  // Variant-specific instructions
  const variantInstructions: Record<Exclude<RecipeVariant, 'mix'>, string> = {
    quick: '- Focus on quick preparation (under 30 minutes total time)\n- Minimize prep steps\n- Use readily available ingredients',
    standard: '- Balance between ease and quality\n- Moderate prep and cook time\n- Use common ingredients',
    gourmet: '- Emphasize restaurant-quality results\n- More sophisticated techniques\n- Premium ingredients acceptable',
    budget: '- Focus on affordable ingredients\n- Minimize expensive items\n- Maximize value and taste',
    comfort: '- Classic, comforting flavors\n- Family-friendly\n- Satisfying and hearty'
  };

  const system = `You are a professional culinary recipe writer. Generate a single detailed recipe in valid JSON.

Contract:
{
  "title": string,
  "headNote": string,        // <=160 chars
  "description": string,
  "ingredients": string[],   // <=12
  "instructions": string[],  // <=8
  "prepTime": string,
  "cookTime": string,
  "servings": 4,
  "difficulty": "easy"|"medium"|"hard",
  "method": string,
  "tags": string[],          // <=6
  "searchQuery": string,
  "allergensToAvoid": string[],
  "dietaryPrefs": string[],
  "allergensIncluded": string[],
  "notes": string,
  "nutritionInfo": string
}

Rules:
- JSON only, no prose
- Title: Descriptive, capitalized
- HeadNote: max 160 characters
- Ingredients: ≤12 items
- Instructions: ≤8 clear steps
- Servings: exactly 4
- Tags: convenience descriptors only (e.g., quick, one-pot)
- Allergens: mutually exclusive arrays covering full list`;

  const user = `Generate 1 recipe for: "${query}"
${variantInstructions[variant]}
${allergensBlock}
${dietBlock}
Split allergens [Eggs, Fish, Milk, Peanuts, Sesame, Shellfish, Soybeans, Tree Nuts, Wheat (Gluten)] into:
- "allergensToAvoid" (NOT present)
- "allergensIncluded" (present)
Set "searchQuery" to "${query}".`;

  const messages: ChatMessage[] = [
    { role: 'system', content: system.trim() },
    { role: 'user', content: user.trim() },
  ];

  const data = await callOpenAI(messages, {
    model: DEFAULT_MODEL,
    temperature: 0.3,
    max_tokens: 800,
    seed,
    response_format: { type: 'json_object' }
  });

  const raw = data?.choices?.[0]?.message?.content ?? '{}';
  const recipe = JSON.parse(raw);

  return {
    ...recipe,
    searchQuery: query,
  };
}

/**
 * Get variants for a given count and selected variant
 */
function getVariantsForRequest(
  count: number, 
  selectedVariant: RecipeVariant
): Exclude<RecipeVariant, 'mix'>[] {
  if (selectedVariant === 'mix') {
    // Cycle through all variants
    const variants: Exclude<RecipeVariant, 'mix'>[] = [];
    for (let i = 0; i < count; i++) {
      variants.push(ALL_VARIANTS[i % ALL_VARIANTS.length]);
    }
    return variants;
  }
  
  // All same variant
  return Array(count).fill(selectedVariant);
}

/**
 * Generate recipes in parallel with configurable count and variant
 * 
 * @param query - Search query
 * @param allergensToAvoid - Array of allergen names to avoid
 * @param dietaryPrefs - Array of dietary preference names
 * @param count - Number of recipes to generate (1-10)
 * @param variant - Recipe variant (quick, standard, gourmet, budget, comfort, or mix)
 * @param onRecipeReady - Callback fired as each recipe completes
 */
export async function generateRecipesParallel(
  query: string,
  allergensToAvoid: string[] = [],
  dietaryPrefs: string[] = [],
  count: number = 3,
  variant: RecipeVariant = 'mix',
  onRecipeReady?: (recipe: GeneratedRecipe, index: number) => void
): Promise<GeneratedRecipe[]> {
  try {
    // Clamp count between 1 and 10
    const safeCount = Math.max(1, Math.min(10, count));
    
    console.log(`🚀 Starting parallel recipe generation (${safeCount} recipes, variant: ${variant})...`);
    const startTime = Date.now();

    // Get the variants for each recipe
    const variants = getVariantsForRequest(safeCount, variant);
    
    // Generate seeds for variety (different seed per recipe)
    const seeds = variants.map((_, i) => 1 + i * 7);

    // Generate recipes in parallel
    const recipePromises = variants.map((v, index) =>
      generateSingleRecipe(query, allergensToAvoid, dietaryPrefs, v, seeds[index])
        .then((recipe) => {
          // Call callback as each recipe completes
          if (onRecipeReady) {
            onRecipeReady(recipe, index);
          }
          console.log(`✅ Recipe ${index + 1}/${safeCount} ready (${Date.now() - startTime}ms) [${v}]`);
          return recipe;
        })
    );

    // Wait for all to complete
    const recipes = await Promise.all(recipePromises);

    const duration = Date.now() - startTime;
    console.log(`🎉 All ${safeCount} recipes generated in ${duration}ms (~${Math.round(duration/1000)}s)`);

    return recipes;
  } catch (err) {
    console.error('Error generating recipes:', err);
    throw new Error('Failed to generate recipes. Please try again later.');
  }
}

/**
 * Original serial generation (for fallback)
 */
export async function generateRecipes(
  query: string,
  allergensToAvoid: string[] = [],
  dietaryPrefs: string[] = [],
  count: number = 3,
  variant: RecipeVariant = 'mix'
): Promise<GeneratedRecipe[]> {
  // Just use parallel generation - it's always better
  return generateRecipesParallel(query, allergensToAvoid, dietaryPrefs, count, variant);
}