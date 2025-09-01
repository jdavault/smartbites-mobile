// lib/supabase.ts
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anon = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export { url };

if (!url || !anon) {
  throw new Error('Missing Supabase environment variables');
}

// Web: implicit flow, auto-detect tokens in URL, no custom storage
export const supabaseWeb = createClient(url, anon, {
  auth: {
    flowType: 'implicit',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: { headers: { 'x-application-name': 'smartbites-web' } },
});

// Mobile: PKCE flow, store verifier/session in AsyncStorage, do NOT sniff URL
export const supabaseMobile = createClient(url, anon, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
    storage: AsyncStorage,
    storageKey: 'sb-smartbites-auth',
  },
  global: { headers: { 'x-application-name': 'smartbites-mobile' } },
});

// Default export: pick the right client for the current platform
export const supabase = Platform.OS === 'web' ? supabaseWeb : supabaseMobile;

// Use the same client for email operations
export const supabaseEmail = supabase;
