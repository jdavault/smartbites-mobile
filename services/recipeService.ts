import { generateRecipeImage } from '@/lib/openai';
import { formatImageName } from '@/utils/filenames';
import { supabase } from '@/lib/supabase';
import { fetchImageUploadable, UploadableImage } from '@/lib/apiclient';
import { Platform } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';

const DEFAULT_RECIPE_IMAGE =
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = global.atob
    ? atob(b64)
    : Buffer.from(b64, 'base64').toString('binary');
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function bytesFromUploadable(
  up: UploadableImage
): Promise<Uint8Array> {
  if (Platform.OS === 'web') {
    const blob = up as Blob;
    // @ts-ignore: arrayBuffer may exist or not; on web it does.
    const ab: ArrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(ab);
  }

  // React Native: read file directly from FS as base64, then to bytes
  const { uri } = up as { uri: string; name: string; type: string };
  const path = uri.replace(/^file:\/\//, '');
  const base64 = await RNBlobUtil.fs.readFile(path, 'base64');
  return base64ToUint8Array(base64);
}
// assumes you have: generateRecipeImage, formatImageName, DEFAULT_RECIPE_IMAGE
async function ensureBlobFromUploadable(
  up: UploadableImage,
  mime = 'image/png'
): Promise<Blob> {
  // Web already returns a Blob from fetchImageUploadable
  if (Platform.OS === 'web') return up as Blob;

  // Native: we got { uri, name, type } — turn it into a real Blob
  const { uri } = up as { uri: string; name: string; type: string };

  // Some RN fetch implementations require no "file://" prefix; but standard works with it.
  const resp = await fetch(uri);
  if (!resp.ok) {
    throw new Error(
      `Failed to read local file: ${resp.status} ${resp.statusText}`
    );
  }
  const blob = await resp.blob();

  // Force correct MIME if missing
  const type = blob.type || mime;
  return blob.slice(0, blob.size, type);
}

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
    //console.log('🖼️ Start image generation:', recipeTitle);

    let preSignedImageUrl: string;
    try {
      preSignedImageUrl = await generateRecipeImage(recipeTitle);
    } catch (imageGenError) {
      console.error('🖼️ Image generation failed:', imageGenError);
      return DEFAULT_RECIPE_IMAGE;
    }

    //console.log('🖼️ Presigned URL:', preSignedImageUrl);

    if (preSignedImageUrl === DEFAULT_RECIPE_IMAGE) {
      return DEFAULT_RECIPE_IMAGE;
    }

    const fileName = formatImageName(searchQuery, allergenNames, 'png');

    // Get uploadable (Blob on web; {uri,name,type} on RN)
    let uploadable: UploadableImage;
    try {
      uploadable = await fetchImageUploadable(
        preSignedImageUrl,
        fileName,
        'image/png'
      );
    } catch (fetchError) {
      console.error('🖼️ Image fetch failed:', fetchError);
      return DEFAULT_RECIPE_IMAGE;
    }

    // Convert to raw bytes in a RN-safe way
    let bytes: Uint8Array;
    try {
      bytes = await bytesFromUploadable(uploadable);
    } catch (bytesError) {
      console.error('🖼️ Bytes conversion failed:', bytesError);
      return DEFAULT_RECIPE_IMAGE;
    }

    //console.log('🖼️ Bytes length:', bytes.byteLength);

    // Basic guardrail
    if (!bytes || bytes.byteLength < 1024) {
      console.warn('⚠️ Byte payload too small; aborting upload.');
      return DEFAULT_RECIPE_IMAGE;
    }

    const filePath = `${recipeId}/${fileName}`;

    let uploadError: any;
    try {
      const uploadResult = await supabase.storage
        .from('recipe-images')
        .upload(filePath, bytes, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: true,
        });
      uploadError = uploadResult.error;
    } catch (storageError) {
      console.error('🖼️ Storage upload exception:', storageError);
      return DEFAULT_RECIPE_IMAGE;
    }

    if (uploadError) {
      console.error('🖼️ Upload failed:', uploadError);
      console.error('🖼️ Upload error details:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError.error,
      });
      return DEFAULT_RECIPE_IMAGE;
    }

    // Public URL
    let publicUrl: string;
    try {
      const { data: pub } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(filePath);
      publicUrl = pub?.publicUrl ?? DEFAULT_RECIPE_IMAGE;
    } catch (urlError) {
      console.error('🖼️ Public URL generation failed:', urlError);
      return DEFAULT_RECIPE_IMAGE;
    }

    //console.log('🖼️ ✅ Upload successful:', publicUrl);

    // Optional: persist filename in DB
    try {
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ image: fileName })
        .eq('id', recipeId);
      if (updateError) {
        console.error('🖼️ DB update error:', updateError);
        console.error('🖼️ DB update error details:', {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
        });
      }
    } catch (dbError) {
      console.error('🖼️ DB update exception:', dbError);
    }

    return publicUrl;
  } catch (err) {
    console.error('🖼️ Error in persistRecipeImage:', err);
    console.error('🖼️ Full error details:', {
      name: err instanceof Error ? err.name : 'Unknown',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return DEFAULT_RECIPE_IMAGE;
  }
}
