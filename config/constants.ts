// Centralized configuration for the app

// Determine environment from NODE_ENV
const getEnvironment = () => {
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') return 'production';
  if (nodeEnv === 'staging') return 'staging';
  return 'development'; // default
};

const environment = getEnvironment();

// Environment-specific defaults
const environmentDefaults = {
  development: {
    APP_BASE_URL: 'http://localhost:8081',
    SUPABASE_URL: 'http://127.0.0.1:54321',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    DEBUG_APP: 'true',
  },
  staging: {
    APP_BASE_URL: 'https://dev.smartbites.menu',
    SUPABASE_URL: 'https://ahikcpeeuyaxyssscgqk.supabase.co',
    SUPABASE_KEY: 'sb_publishable_tEXAe_K7Oqkx7OETDgRTCw_YSFvjPpH',
    DEBUG_APP: 'false',
  },
  production: {
    APP_BASE_URL: 'https://smartbites.food',
    SUPABASE_URL: 'https://ahikcpeeuyaxyssscgqk.supabase.co',
    SUPABASE_KEY: 'sb_publishable_tEXAe_K7Oqkx7OETDgRTCw_YSFvjPpH',
    DEBUG_APP: 'false',
  },
};

const envDefaults = environmentDefaults[environment];

export const APP_URL =
  process.env.EXPO_PUBLIC_APP_BASE_URL || envDefaults.APP_BASE_URL;

export const SUPABASE_RECIPE_IMAGES_PUBLIC_ROUTE =
  process.env.EXPO_PUBLIC_SUPABASE_RECIPE_IMAGES_PUBLIC_ROUTE ||
  '/storage/v1/object/public/recipe-images';
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || envDefaults.SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY || envDefaults.SUPABASE_KEY;
export const RESET_PASSWORD_ROUTE =
  process.env.EXPO_PUBLIC_RESET_PASSWORD_ROUTE || '/reset-password';
export const LOGIN_ROUTE = process.env.EXPO_PUBLIC_LOGIN_ROUTE || '/sign-in';

export const REDIRECT_URLS = {
  resetPassword: `${APP_URL}${RESET_PASSWORD_ROUTE}`,
  signIn: `${APP_URL}${LOGIN_ROUTE}`,
};

export const DEBUG_APP =
  (typeof process !== 'undefined' &&
    (process?.env?.EXPO_PUBLIC_DEBUG_APP || envDefaults.DEBUG_APP) === 'true') ||
  false;

export const isDevelopment =
  (typeof __DEV__ !== 'undefined' && __DEV__) || false;

export const isProduction = !isDevelopment;
