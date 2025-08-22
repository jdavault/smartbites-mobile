// lib/supabase.ts
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import axios from 'axios';

import {
  createClient,
  processLock,
  type SupabaseClient,
} from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateRecipeImage } from './openai';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!; // publishable/anon public key

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase env. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY.'
  );
}

// Singleton to avoid initializing native storage at module import time
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  _client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      // Use AsyncStorage on native, default browser storage on web
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      storageKey: 'sb-smartbites-auth', // customize/version if you ever need to migrate
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: Platform.OS === 'web',
      lock: processLock,
      // For mobile OAuth add this (optional):
      // flowType: Platform.OS === 'web' ? 'implicit' : 'pkce',
    },
    // optional: a tiny bit of app metadata on requests
    global: {
      headers: { 'x-application-name': 'smartbites' },
    },
  });

  return _client;
}

// ---- Email/Deep-link client (explicit flowType) ----
let _clientEmail: SupabaseClient | null = null;
export function getSupabaseEmail(): SupabaseClient {
  if (_clientEmail) return _clientEmail;

  _clientEmail = createClient(supabaseUrl, supabaseKey, {
    auth: {
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      storageKey: 'sb-smartbites-auth', // share session with the base client
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: Platform.OS === 'web',
      lock: processLock,
      flowType: Platform.OS === 'web' ? 'implicit' : 'pkce',
    },
    global: { headers: { 'x-application-name': 'smartbites' } },
  });

  return _clientEmail;
}

export const supabaseEmail = getSupabaseEmail();
export const supabase = getSupabase();

// Helper function to fetch image as blob (exactly like your AppWrite fetchImageBlob)
export async function fetchImageBlob(url: string): Promise<Blob | string> {
  if (Platform.OS === 'web') {
    // ✅ Web - use axios with blob response type
    const response = await axios.get(url, { responseType: 'blob' });
    return response.data; // native Blob
  } else {
    // ✅ Native - save to cache directory and return file path
    // Note: This would require react-native-blob-util for full implementation
    // For now, we'll use a simpler approach with fetch
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('🖼️ Error fetching image on native:', error);
      throw error;
    }
  }
}

// Helper function to format image name (exactly like your AppWrite formatImageName)
function formatImageName(searchQuery: string, allergenNames: string[], extension: string): string {
  const cleanQuery = searchQuery.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const allergenSuffix = allergenNames.length > 0 ? `-${allergenNames.join('-').toLowerCase()}` : '';
  return `${cleanQuery}${allergenSuffix}-${Date.now()}.${extension}`;
}

// Upload function (like your AppWrite uploadImageToAppwriteStorage)
export async function uploadImageToSupabaseStorage(
  input: Blob | string,
  fileName: string,
  recipeId: string
): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      // ✅ Web - input is a Blob
      const blob = input as Blob;
      const filePath = `${recipeId}/${fileName}`;
      
      console.log('🖼️ Uploading blob to Supabase storage:', filePath);
      
      const { data, error } = await supabase.storage
        .from('recipe-images')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        console.error('🖼️ Error uploading to Supabase:', error);
        return null;
      }

      console.log('🖼️ ✅ Upload successful:', data);
      return fileName;
    } else {
      // ✅ Native - input is a file path string
      // For now, treat as blob since we're using fetch fallback
      const blob = input as Blob;
      const filePath = `${recipeId}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('recipe-images')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        console.error('🖼️ Error uploading to Supabase:', error);
        return null;
      }

      return fileName;
    }
  } catch (error) {
    console.error('🖼️ Error in uploadImageToSupabaseStorage:', error);
    return null;
  }
}

// Main function to persist recipe image (exactly like your AppWrite persistRecipeImage)
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
    const preSignedImageUrl = await generateRecipeImage(recipeTitle);
    console.log(`🖼️ Generated pre-signed image URL: ${preSignedImageUrl} for recipeId: ${recipeId}`);
    
    const blob = await fetchImageBlob(preSignedImageUrl);
    if (!blob) {
      console.log(`🖼️ No blob found searchQuery: ${searchQuery}`);
      return preSignedImageUrl;
    }

    const fileName = formatImageName(searchQuery, allergenNames, 'png');
    console.log(`🖼️ Generated fileName: ${fileName}`);
    console.log(`🖼️ Blob details: ${JSON.stringify(blob)}`);
    
    // Upload to Supabase storage (like your AppWrite uploadImageToAppwriteStorage)
    const uploadedFileName = await uploadImageToSupabaseStorage(
      blob,
      fileName,
      recipeId
    );
    console.log(`🖼️ UPLOAD file (so close): ${JSON.stringify(uploadedFileName)}`);
    
    if (uploadedFileName) {
      // Update the recipe with the uploaded filename (like your AppWrite updateRecipe)
      const { error } = await supabase
        .from('recipes')
        .update({ image: uploadedFileName })
        .eq('id', recipeId);
      
      if (error) {
        console.error('🖼️ Error updating recipe with image:', error);
      }
    }
    
    // It takes Supabase a while to set the image, so we return and temporarily use the OpenAI pre-signed URL
    return preSignedImageUrl;
    
  } catch (error) {
    console.error('🖼️ Error in persistRecipeImage:', error);
    // Fallback to generating a new image URL
    return await generateRecipeImage(recipeTitle);
  }
}

// Helper function to get public URL for stored image
export function getStorageImageUrl(
  recipeId: string,
  filename: string
): string {
  const filePath = `${recipeId}/${filename}`;
  const { data } = supabase.storage
    .from('recipe-images')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}