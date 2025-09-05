// utils/recipeMapping.ts
import type { Recipe } from '@/contexts/RecipesContext';

/**
 * Maps OpenAI recipe response to our internal Recipe interface
 * OpenAI uses 'allergensToAvoid' but our app uses 'allergens'
 */
export function mapOpenAIRecipeToRecipe(openAIRecipe: any): Recipe {
  return {
    ...openAIRecipe,
    // Map OpenAI's allergensToAvoid to our allergens field
    allergens: openAIRecipe.allergensToAvoid || [],
    // Keep both for compatibility
    allergensToAvoid: openAIRecipe.allergensToAvoid || [],
    // Ensure all required fields have defaults
    id: openAIRecipe.id || undefined,
    searchKey: openAIRecipe.searchKey || '',
    allergensIncluded: openAIRecipe.allergensIncluded || [],
    isFavorite: openAIRecipe.isFavorite || false,
    createdAt: openAIRecipe.createdAt || undefined,
    actions: openAIRecipe.actions || [],
  };
}