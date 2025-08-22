import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

function contentTypeFromName(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (!ext) return 'application/octet-stream';
  if (['jpg', 'jpeg'].includes(ext)) return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'application/octet-stream';
}

function normalizeFileUri(uri: string) {
  if (!uri) return uri;
  if (uri.startsWith('/')) return `file://${uri}`;
  if (!uri.startsWith('file://')) return `file://${uri}`;
  return uri;
}

/**
 * Supabase equivalent of uploadImageToAppwriteStorage
 * - Web: pass a Blob
 * - Native: pass a local file URI ("file:///.../image.png")
 * Returns { path, publicUrl } so you can persist + display immediately.
 */
export async function uploadImageToSupabaseStorage(
  input: Blob | string,
  fileName: string,
  userId: string,           // kept to mirror your signature (useful for foldering)
  recipeId?: string,        // optional: nice to nest by recipe
  bucket = 'recipe-images', // your bucket
) {
  const contentType = contentTypeFromName(fileName);
  const path = `${userId}/${recipeId ?? 'misc'}/${fileName}`;

  // Turn input into a Blob for Supabase
  let blob: Blob;
  if (Platform.OS === 'web') {
    blob = input as Blob;
  } else {
    const uri = normalizeFileUri(input as string);
    // Expo-friendly: fetch the local file to get a Blob
    const res = await fetch(uri);
    blob = await res.blob();
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      contentType,
      upsert: true, // same overwrite behavior you had
      cacheControl: '3600',
    });

  if (error) throw error;

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  return {
    path: data?.path ?? path,
    publicUrl: pub?.publicUrl, // will exist if your bucket (or policy) allows public read
  };
}