// Expo automatically loads .env files, so we just read from process.env
// ⚠️  IMPORTANT: All process.env.EXPO_PUBLIC_* must be accessed STATICALLY
//     Dynamic access like process.env[key] will NOT work on web builds!

export type Environment = 'development' | 'local' | 'test' | 'production';

// ===================================
// STATIC ENV ACCESS (required for web)
// ===================================

// Core configuration - STATIC access required
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';
export const APP_URL = process.env.EXPO_PUBLIC_APP_BASE_URL ?? '';

// Application settings - STATIC access with defaults
export const SUPABASE_RECIPE_IMAGES_PUBLIC_ROUTE =
  process.env.EXPO_PUBLIC_RECIPE_IMAGES_PUBLIC_ROUTE ||
  '/storage/v1/object/public/recipe-images';

export const CONTACT_EMAIL =
  process.env.EXPO_PUBLIC_CONTACT_EMAIL || 'support@smartbites.food';

export const SUPPORT_EMAIL =
  process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@smartbites.food';

export const SUPPORT_PHONE =
  process.env.EXPO_PUBLIC_SUPPORT_PHONE || '623-220-9724';

export const RESET_PASSWORD_ROUTE =
  process.env.EXPO_PUBLIC_RESET_PASSWORD_ROUTE || '/reset-password';

export const LOGIN_ROUTE = '/sign-in';

// Debug and environment flags
export const DEBUG_APP = process.env.EXPO_PUBLIC_DEBUG_APP === 'true';

// OpenAI Configuration
export const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

export const OPENAI_ORG_ID =
  process.env.EXPO_PUBLIC_OPENAI_ORG_ID || 'org-pigNWK6KQYXhW9KadKfDpVGu';

export const OPENAI_PROJECT =
  process.env.EXPO_PUBLIC_OPENAI_PROJECT || 'proj_WQLJGYZRj2GPZSmGchawQ5Bu';

export const USE_EDGE_FUNCTION_FOR_OPENAI =
  process.env.EXPO_PUBLIC_USE_EDGE_FUNCTION_FOR_OPENAI !== 'false'; // default true

// ===================================
// DERIVED VALUES
// ===================================

// Determine current environment
const getEnvironment = (): Environment => {
  const env = process.env.EXPO_PUBLIC_APP_ENV || 'development';
  if (env === 'production') return 'production';
  if (env === 'local') return 'local';
  if (env === 'test') return 'test';
  return 'development';
};

export const CURRENT_ENV: Environment = getEnvironment();

// Environment flags
export const isDevelopment = CURRENT_ENV === 'development';
export const isLocal = CURRENT_ENV === 'local';
export const isTest = CURRENT_ENV === 'test';
export const isProduction = CURRENT_ENV === 'production';

// Redirect URLs
export const REDIRECT_URLS = {
  resetPassword: `${APP_URL}${RESET_PASSWORD_ROUTE}`,
  signIn: `${APP_URL}${LOGIN_ROUTE}`,
};

// ===================================
// RUNTIME VALIDATION
// ===================================

// Validate required vars at runtime (catches issues in dev, shows helpful errors)
const validateRequiredEnvVars = () => {
  const missing: string[] = [];

  if (!SUPABASE_URL) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('EXPO_PUBLIC_SUPABASE_KEY');
  if (!APP_URL) missing.push('EXPO_PUBLIC_APP_BASE_URL');

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n` +
        missing.map((v) => `   - ${v}`).join('\n') +
        `\n\n💡 Make sure your .env file is set up correctly.\n` +
        `   Run: npm run env:local`
    );
  }
};

// Run validation
validateRequiredEnvVars();

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