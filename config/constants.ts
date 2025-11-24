// Expo automatically loads .env files, so we just read from process.env

export type Environment = 'development' | 'local' | 'test' | 'production';

// Helper to get required env var with validation
const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `❌ Missing required environment variable: ${key}\n` +
        `💡 Make sure your .env file is set up correctly.\n` +
        `   Run: npm run env:local`
    );
  }
  return value;
};

// Helper to get optional env var with default
const getOptionalEnv = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

// Helper to get boolean env var
const getBooleanEnv = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

// Determine current environment from .env (loaded by Expo)
const getEnvironment = (): Environment => {
  const env = process.env.EXPO_PUBLIC_APP_ENV || 'development';

  if (env === 'production') return 'production';
  if (env === 'local') return 'local';
  if (env === 'test') return 'test';
  return 'development';
};

// ===================================
// EXPORTED CONSTANTS
// ===================================

export const CURRENT_ENV: Environment = getEnvironment();

// Core configuration (loaded from .env by Expo)
export const SUPABASE_URL = getRequiredEnv('EXPO_PUBLIC_SUPABASE_URL');
export const SUPABASE_ANON_KEY = getRequiredEnv('EXPO_PUBLIC_SUPABASE_KEY');

export const APP_URL = getRequiredEnv('EXPO_PUBLIC_APP_BASE_URL');

// Application settings
export const SUPABASE_RECIPE_IMAGES_PUBLIC_ROUTE = getOptionalEnv(
  'EXPO_PUBLIC_RECIPE_IMAGES_PUBLIC_ROUTE',
  '/storage/v1/object/public/recipe-images'
);
export const CONTACT_EMAIL = getOptionalEnv(
  'EXPO_PUBLIC_CONTACT_EMAIL',
  'support@smartbites.food'
);
export const SUPPORT_EMAIL = getOptionalEnv(
  'EXPO_PUBLIC_SUPPORT_EMAIL',
  'support@smartbites.food'
);
export const SUPPORT_PHONE = getOptionalEnv(
  'EXPO_PUBLIC_SUPPORT_PHONE',
  '623-220-9724'
);
export const RESET_PASSWORD_ROUTE = getOptionalEnv(
  'EXPO_PUBLIC_RESET_PASSWORD_ROUTE',
  '/reset-password'
);
export const LOGIN_ROUTE = '/sign-in';

// Redirect URLs
export const REDIRECT_URLS = {
  resetPassword: `${APP_URL}${RESET_PASSWORD_ROUTE}`,
  signIn: `${APP_URL}${LOGIN_ROUTE}`,
};

// Debug and environment flags
export const DEBUG_APP = getBooleanEnv('EXPO_PUBLIC_DEBUG_APP', false);
export const isDevelopment = CURRENT_ENV === 'development';
export const isLocal = CURRENT_ENV === 'local';
export const isTest = CURRENT_ENV === 'test';
export const isProduction = CURRENT_ENV === 'production';

// OpenAI Configuration
export const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
export const OPENAI_ORG_ID = getOptionalEnv(
  'EXPO_PUBLIC_OPENAI_ORG_ID',
  'org-pigNWK6KQYXhW9KadKfDpVGu'
);
export const OPENAI_PROJECT = getOptionalEnv(
  'EXPO_PUBLIC_OPENAI_PROJECT',
  'proj_WQLJGYZRj2GPZSmGchawQ5Bu'
);
export const USE_EDGE_FUNCTION_FOR_OPENAI = getBooleanEnv(
  'EXPO_PUBLIC_USE_EDGE_FUNCTION_FOR_OPENAI',
  true // default to true for security
);
// ===================================
// SAFETY CHECKS
// ===================================

if (isProduction && SUPABASE_URL.includes('ngrok')) {
  throw new Error(
    '❌ Production build is pointing at ngrok! Check your .env file.\n' +
      '   Expected EXPO_PUBLIC_APP_ENV=production with production Supabase URL.'
  );
}

if (isLocal && !SUPABASE_URL.includes('ngrok')) {
  console.warn(
    '⚠️  Local environment is not pointing at ngrok.\n' +
      '    Current URL: ' +
      SUPABASE_URL +
      '\n' +
      '    Expected: https://supabase-api.ngrok.io\n' +
      '    Run: npm run env:local'
  );
}

// ===================================
// STARTUP LOGS (dev mode only)
// ===================================

if (DEBUG_APP && __DEV__) {
  console.log('');
  console.log('📱 SmartBites Configuration');
  console.log(`   Environment: ${CURRENT_ENV}`);
  console.log(`   Supabase: ${SUPABASE_URL.substring(0, 30)}...`);
  console.log(`   Debug: ${DEBUG_APP}`);
  console.log('');
}