// src/utils/generateAndUploadImage.ts
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { getOpenAIKey } from '@/utils/openAIApiKey';

const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

function base64ToBlob(b64: string, mime = 'image/png'): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function generateAndUploadImage(opts: {
  prompt: string;
  userId: string;
  recipeId: string;
  fileName: string; // without extension
  bucket?: string; // default: 'recipe-images'
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

  const OPENAI_API_KEY = await getOpenAIKey();
  const path = `${recipeId}/${fileName}.png`;

  if (Platform.OS === 'web') {
    // WEB: request base64 to avoid CORS on Azure blob
    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size,
        response_format: 'b64_json',
      }),
    });
    if (!res.ok) throw new Error(`OpenAI images error (web): ${res.status}`);
    const json = await res.json();
    const b64 = json?.data?.[0]?.b64_json as string | undefined;
    if (!b64) throw new Error('OpenAI returned no b64_json');

    const blob = base64ToBlob(b64, 'image/png');
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, { contentType: 'image/png', upsert: true });
    if (error) throw error;
  } else {
    // NATIVE: request URL and download (no browser CORS)
    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size,
        response_format: 'url',
      }),
    });
    if (!res.ok) throw new Error(`OpenAI images error (native): ${res.status}`);
    const json = await res.json();
    const url = json?.data?.[0]?.url as string | undefined;
    if (!url) throw new Error('OpenAI returned no url');

    const imgRes = await fetch(url);
    if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status}`);
    const arrayBuffer = await imgRes.arrayBuffer();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, { contentType: 'image/png', upsert: true });
    if (error) throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data?.publicUrl };
}
