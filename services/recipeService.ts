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
    // 1) Get pre-signed OpenAI image URL
    const preSignedImageUrl = await generateRecipeImage(recipeTitle);
    
    // If OpenAI returns the default fallback, use it directly
    if (preSignedImageUrl === DEFAULT_RECIPE_IMAGE) {
      return DEFAULT_RECIPE_IMAGE;
    }
    
    console.log(`🖼️ Generated pre-signed image URL: ${preSignedImageUrl} for recipeId: ${recipeId}`);

    // 2) Fetch it as Blob (web) or local path (native)
    const input = await fetchImageBlob(preSignedImageUrl);
    if (!input) {
      console.log(`🖼️ No blob found searchQuery: ${searchQuery}`);
      return preSignedImageUrl;
    }

    // 3) Use same filename logic you had
    const fileName = formatImageName(searchQuery, allergenNames, 'png');
    console.log(`🖼️ Generated fileName: ${fileName}`);
    console.log(`🖼️ Input details: ${typeof input}`);

    // 4) Upload to Supabase Storage (mirrors your Appwrite fn signature)
    const uploaded = await uploadImageToSupabaseStorage(
      input,
      fileName,
      userId,
      recipeId,          // keep foldering by recipe
      'recipe-images'    // your bucket
    );
    console.log(`🖼️ UPLOAD file (so close): ${JSON.stringify(uploaded)}`);

    // 5) Persist the storage path on your recipe record
    if (uploaded.path) {
      const { error } = await supabase
        .from('recipes')
        .update({ image: fileName }) // Store just the filename like AppWrite
        .eq('id', recipeId);
      
      if (error) {
        console.error('🖼️ Error updating recipe with image:', error);
      }
    }

    // 6) Return a displayable URL; use publicUrl if available, otherwise preSigned as temp
    return uploaded.publicUrl ?? preSignedImageUrl;
  } catch (error) {
    console.error('🖼️ Error in persistRecipeImage:', error);
    // Return default fallback image instead of trying to regenerate
    return DEFAULT_RECIPE_IMAGE;
  }
}