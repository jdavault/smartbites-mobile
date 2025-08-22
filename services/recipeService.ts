import { uploadImageToSupabaseStorage } from '@/lib/supabaseclient';
import { fetchImageBlob } from '@/lib/apiclient';
import { generateRecipeImage } from '@/lib/openai';
import { formatImageName } from '@/utils/filenames';
import { supabase } from '@/lib/supabase';

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
    // Fallback to generating a new image URL
    return await generateRecipeImage(recipeTitle);
  }
}