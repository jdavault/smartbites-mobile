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
    
    // Step 2: Fetch the image blob from OpenAI's presigned URL
    // console.log('🖼️ Fetching image blob from OpenAI...');
    // const blob = await fetchImageBlob(preSignedImageUrl);
    // console.log('🖼️ Successfully fetched blob');
    
    // Step 3: Generate filename and upload to Supabase
    // const fileName = formatImageName(searchQuery, allergenNames, 'png');
    // console.log('🖼️ Uploading to Supabase with filename:', fileName);
    
    // const uploaded = await uploadImageToSupabaseStorage(
    //   blob,
    //   fileName,
    //   userId,
    //   recipeId,
    //   'recipe-images'
    // );
    
    // console.log('🖼️ ✅ Upload successful:', uploaded.publicUrl);
    
    // Step 4: Update the recipe record with the image filename
    // const { error: updateError } = await supabase
    //   .from('recipes')
    //   .update({ image: fileName })
    //   .eq('id', recipeId);
    
    // if (updateError) {
    //   console.error('🖼️ Error updating recipe with image filename:', updateError);
    // }
    
    // return uploaded.publicUrl || DEFAULT_RECIPE_IMAGE;
    
  } catch (error) {
    console.error('🖼️ Error in persistRecipeImage:', error);
    // Return default fallback image instead of failing
    return DEFAULT_RECIPE_IMAGE;
  }
}