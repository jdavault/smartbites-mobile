// lib/supabase.ts
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

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

// Helper function to fetch image as blob (like your AppWrite fetchImageBlob)
async function fetchImageBlob(imageUrl: string): Promise<Blob | null> {
  try {
    console.log('🖼️ Fetching image blob from URL:', imageUrl);
    
    const response = await fetch(imageUrl, {
      mode: 'cors',
      headers: {
        'Accept': 'image/*',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('🖼️ Image blob created, size:', blob.size);
    return blob;
  } catch (error) {
    console.error('🖼️ Error fetching image blob:', error);
    return null;
  }
}

// Helper function to format image name (like your AppWrite formatImageName)
function formatImageName(searchQuery: string, allergenNames: string[], extension: string): string {
  const cleanQuery = searchQuery.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const allergenSuffix = allergenNames.length > 0 ? `-${allergenNames.join('-').toLowerCase()}` : '';
  return `${cleanQuery}${allergenSuffix}-${Date.now()}.${extension}`;
}

// Main function to persist recipe image (like your AppWrite persistRecipeImage)
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
    console.log(`🖼️ Starting persistRecipeImage for: ${recipeTitle}`);
    
    const preSignedImageUrl = await generateRecipeImage(recipeTitle);
    console.log(`🖼️ Generated pre-signed image URL: ${preSignedImageUrl} for recipeId: ${recipeId}`);
    
    const blob = await fetchImageBlob(preSignedImageUrl);
    if (!blob) {
      console.log(`🖼️ No blob found for searchQuery: ${searchQuery}`);
      return preSignedImageUrl; // Return the OpenAI URL as fallback
    }

    const fileName = formatImageName(searchQuery, allergenNames, 'png');
    console.log(`🖼️ Generated fileName: ${fileName}`);
    console.log(`🖼️ Blob details: size=${blob.size}, type=${blob.type}`);
    
    // Upload to Supabase storage (similar to your AppWrite uploadImageToAppwriteStorage)
    const uploadedFileName = await uploadImageFromUrl(preSignedImageUrl, recipeId, fileName);
    
    if (!uploadedFileName) {
      console.log(`🖼️ Upload failed, returning pre-signed URL`);
      return preSignedImageUrl;
    }
    
    console.log(`🖼️ UPLOAD file successful: ${uploadedFileName}`);
    
    // Update the recipe with the uploaded filename
    const { error } = await supabase
      .from('recipes')
      .update({ image: uploadedFileName })
      .eq('id', recipeId);
    
    if (error) {
      console.error('🖼️ Error updating recipe with image:', error);
    }
    
    // Return the pre-signed URL temporarily (like AppWrite pattern)
    // The actual Supabase URL will be used when the recipe is loaded later
    return preSignedImageUrl;
    
  } catch (error) {
    console.error('🖼️ Error in persistRecipeImage:', error);
    // Fallback to generating a new image URL
    return await generateRecipeImage(recipeTitle);
  }
}

// Test function to verify image upload is working
export async function testImageUpload(): Promise<void> {
  try {
    console.log('🧪 Testing image upload functionality...');
    const testImageUrl = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';
    const testRecipeId = 'test-recipe-' + Date.now();
    const testFilename = 'test-image.jpg';
    
    const result = await uploadImageFromUrl(testImageUrl, testRecipeId, testFilename);
    
    if (result) {
      console.log('🧪 ✅ Test upload successful:', result);
      console.log('🧪 Image URL:', getStorageImageUrl(testRecipeId, result));
    } else {
      console.log('🧪 ❌ Test upload failed');
    }
  } catch (error) {
    console.error('🧪 ❌ Test upload error:', error);
  }
}

export async function uploadImageFromUrl(
  imageUrl: string,
  recipeId: string,
  filename: string
): Promise<string | null> {
  try {
    console.log('🖼️ Fetching image from URL:', imageUrl);
    
    // Fetch image from URL (this will work on web with OpenAI URLs)
    const response = await fetch(imageUrl, {
      mode: 'cors',
      headers: {
        'Accept': 'image/*',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    console.log('🖼️ Image fetched successfully, converting to blob');

    const imageBlob = await response.blob();
    console.log('🖼️ Image blob created, size:', imageBlob.size);
    
    // Create the full path: recipe_id/filename
    const filePath = `${recipeId}/${filename}`;
    console.log('🖼️ Uploading to path:', filePath);
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('recipe-images')
      .upload(filePath, imageBlob, {
        contentType: 'image/png',
        upsert: true, // Replace if exists
      });

    if (error) {
      console.error('🖼️ Error uploading image to Supabase:', error);
      return null;
    }

    console.log('🖼️ ✅ Image uploaded successfully to Supabase:', data);
    return filename; // Return just the filename
  } catch (error) {
    console.error('🖼️ ❌ Error in uploadImageFromUrl:', error);
    return null;
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
