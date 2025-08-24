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

// Export supabaseUrl for use in other modules
export { supabaseUrl };

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
      detectSessionInUrl: Platform.OS === 'web', // true on web only
      flowType: Platform.OS === 'web' ? 'implicit' : 'pkce',
      lock: processLock, // if you use tab-locking, otherwise remove
    },
    global: { headers: { 'x-application-name': 'smartbites' } },
  });

  return _clientEmail;
}

export const supabaseEmail = getSupabaseEmail();
export const supabase = getSupabase();
