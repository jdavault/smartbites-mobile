// Image generation and upload
// Original working logic, now using lib/openai.ts

import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { generateImage } from '@/lib/openai';

const DEFAULT_IMAGE =
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';

/**
 * Convert base64 string to Blob
 */
function base64ToBlob(b64: string, mime = 'image/png'): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Generate and upload recipe image
 * Original implementation with platform-aware handling
 */
export async function generateAndUploadImage(opts: {
  prompt: string;
  userId: string;
  recipeId: string;
  fileName: string; // without extension
  bucket?: string;
  size?: '512x512' | '1024x1024' | '2048x2048';
}): Promise<{ path: string; publicUrl?: string }> {
  const {
    prompt,
    userId,
    recipeId,
    fileName,
    bucket = 'recipe-images',
    size = '1024x1024',
  } = opts;

  try {
    const path = `${recipeId}/${fileName}.png`;

    if (Platform.OS === 'web') {
      // WEB: request base64 to avoid CORS on Azure blob
      const result = await generateImage({
        prompt,
        size,
        quality: 'standard',
        responseFormat: 'b64_json',
      });

      const b64 = result.b64_json;
      if (!b64) throw new Error('OpenAI returned no b64_json');

      const blob = base64ToBlob(b64, 'image/png');

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { contentType: 'image/png', upsert: true });

      if (error) throw error;
    } else {
      // NATIVE: request URL and download (no browser CORS)
      const result = await generateImage({
        prompt,
        size,
        quality: 'standard',
        responseFormat: 'url',
      });

      const url = result.url;
      if (!url) throw new Error('OpenAI returned no url');

      const imgRes = await fetch(url);
      if (!imgRes.ok)
        throw new Error(`Image download failed: ${imgRes.status}`);

      const arrayBuffer = await imgRes.arrayBuffer();

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, arrayBuffer, { contentType: 'image/png', upsert: true });

      if (error) throw error;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { path, publicUrl: data?.publicUrl };
  } catch (error) {
    console.error('❌ Error generating/uploading image:', error);
    console.log('⚠️ Falling back to default image');
    return {
      path: 'default.png',
      publicUrl: DEFAULT_IMAGE,
    };
  }
}