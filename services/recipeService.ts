import { uploadImageToSupabaseStorage } from '@/lib/supabaseclient';
import { fetchImageBlob } from '@/lib/apiclient';
import { generateRecipeImage } from '@/lib/openai';
import { formatImageName } from '@/utils/filenames';
import { supabase } from '@/lib/supabase';

// Default fallback image URL for when image generation fails
const DEFAULT_RECIPE_IMAGE = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';

export async function persistRecipeImage({
  recipeTitle,
  searchQuery,
  allergenNames,
  recipeId,
  userId,
}: {
  recipeTitle: string;
  searchQuery: string;
  recipeId: string;
  allergenNames: string[];
  userId: string;
}): Promise<string> {
  try {
    // For now, just return the default image to avoid CORS issues
    // TODO: Re-enable OpenAI image generation once CORS proxy is working
    console.log('🖼️ Using default image for recipe:', recipeTitle);
    return DEFAULT_RECIPE_IMAGE;
  } catch (error) {
    console.error('🖼️ Error in persistRecipeImage:', error);
    // Return default fallback image instead of trying to regenerate
    return DEFAULT_RECIPE_IMAGE;
  }
}