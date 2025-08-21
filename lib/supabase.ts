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

// Helper function to upload image from URL to Supabase storage
export async function uploadImageFromUrl(
  imageUrl: string,
  recipeId: string,
  filename: string
): Promise<string | null> {
  try {
    console.log('🖼️ Fetching image from URL:', imageUrl);
    // Fetch the image from the URL
    const response = await fetch(imageUrl);
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
