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
    // Call OpenAI 
    const preSignedImageUrl = await generateRecipeImage(recipeTitle);
    
    // Call axios and blob or the local path (react-native)
    const input = await fetchImageBlob(preSignedImageUrl);
    
    // Some novel way to name the file .. doesn't matter really
    const fileName = formatImageName(searchQuery, allergenNames, 'png');
    
    // Upload to Supabase
    const uploaded = await uploadImageToSupabaseStorage(
      input,
      fileName,
      userId,
      recipeId,          // keep foldering by recipe
      'recipe-images'    // your bucket
    );
    
    console.log(`🖼️ Upload successful: ${JSON.stringify(uploaded)}`);

    // Persist the storage path on your recipe record
    if (uploaded.path) {
      const { error } = await supabase
        .from('recipes')
        .update({ image: fileName }) // Store just the filename like AppWrite
        .eq('id', recipeId);
      
      if (error) {
        console.error('🖼️ Error updating recipe with image:', error);
      }
    }

    // Return a displayable URL; use publicUrl if available, otherwise fallback
    return uploaded.publicUrl ?? DEFAULT_RECIPE_IMAGE;
  } catch (error) {
    console.error('🖼️ Error in persistRecipeImage:', error);
    // Return default fallback image instead of trying to regenerate
    return DEFAULT_RECIPE_IMAGE;
  }
}