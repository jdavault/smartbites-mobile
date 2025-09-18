// Define allowed environments
export type Environment = 'development' | 'local' | 'test' | 'production';


// Figure out which environment we're in
const getEnvironment = (): Environment => {
  const appEnv =
    process.env.EXPO_PUBLIC_APP_ENV ||
    process.env.APP_ENV ||
    process.env.NODE_ENV ||
    (__DEV__ ? 'development' : 'production');

  if (appEnv === 'production') return 'production';
  if (appEnv === 'local') return 'local';
  if (appEnv === 'test') return 'test';
  return 'development'; // default
};

// Environment-specific configuration
const configs: Record<
  Environment,
  {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    APP_BASE_URL: string;
    RECIPE_IMAGES_PUBLIC_ROUTE: string;
    CONTACT_EMAIL: string;
    SUPPORT_EMAIL: string;
    SUPPORT_PHONE: string;
    RESET_PASSWORD_ROUTE: string;
    DEBUG_APP: boolean;
  }
> = {
  development: {
    SUPABASE_URL: 'https://ahikcpeeuyaxyssscgqk.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_tEXAe_K7Oqkx7OETDgRTCw_YSFvjPpH',
    APP_BASE_URL: 'https://smartbites.food',
    RECIPE_IMAGES_PUBLIC_ROUTE: '/storage/v1/object/public/recipe-images',
    CONTACT_EMAIL: 'support@smartbites.food',
    SUPPORT_EMAIL: 'support@smartbites.food',
    SUPPORT_PHONE: '623-220-9724',
    RESET_PASSWORD_ROUTE: '/reset-password',
    DEBUG_APP: false,
  },
  local: {
    SUPABASE_URL: 'https://supabase-api.ngrok.io',
    SUPABASE_ANON_KEY:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    APP_BASE_URL: 'https://dev.smartbites.food',
    RECIPE_IMAGES_PUBLIC_ROUTE: '/storage/v1/object/public/recipe-images',
    CONTACT_EMAIL: 'support@smartbites.food',
    SUPPORT_EMAIL: 'support@smartbites.food',
    SUPPORT_PHONE: '623-220-9724',
    RESET_PASSWORD_ROUTE: '/reset-password',
    DEBUG_APP: true,
  },
  test: {
    SUPABASE_URL: 'https://supabase-api.ngrok.io',
    SUPABASE_ANON_KEY: 'test-anon-key', // dummy or mock key
    APP_BASE_URL: 'http://localhost:9999', // can be a mock server
    RECIPE_IMAGES_PUBLIC_ROUTE: '/storage/v1/object/public/recipe-images',
    CONTACT_EMAIL: 'test@smartbites.food',
    SUPPORT_EMAIL: 'test@smartbites.food',
    SUPPORT_PHONE: '000-000-0000',
    RESET_PASSWORD_ROUTE: '/reset-password',
    DEBUG_APP: true,
  },
  production: {
    SUPABASE_URL: 'https://ahikcpeeuyaxyssscgqk.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_tEXAe_K7Oqkx7OETDgRTCw_YSFvjPpH',
    APP_BASE_URL: 'https://smartbites.food',
    RECIPE_IMAGES_PUBLIC_ROUTE: '/storage/v1/object/public/recipe-images',
    CONTACT_EMAIL: 'support@smartbites.food',
    SUPPORT_EMAIL: 'support@smartbites.food',
    SUPPORT_PHONE: '623-220-9724',
    RESET_PASSWORD_ROUTE: '/reset-password',
    DEBUG_APP: false,
  },
};

// Get current environment and config
export const CURRENT_ENV: Environment = getEnvironment();
const currentConfig = configs[CURRENT_ENV];

console.log("APP_ENV (from process.env.EXPO_PUBLIC_APP_ENV):", process.env.EXPO_PUBLIC_APP_ENV);
console.log("CURRENT_ENV (after getEnvironment()):", CURRENT_ENV);



// Export all constants
export const APP_URL = currentConfig.APP_BASE_URL;
export const SUPABASE_URL = currentConfig.SUPABASE_URL;
export const SUPABASE_ANON_KEY = currentConfig.SUPABASE_ANON_KEY;
export const SUPABASE_RECIPE_IMAGES_PUBLIC_ROUTE =
  currentConfig.RECIPE_IMAGES_PUBLIC_ROUTE;
export const CONTACT_EMAIL = currentConfig.CONTACT_EMAIL;
export const SUPPORT_EMAIL = currentConfig.SUPPORT_EMAIL;
export const SUPPORT_PHONE = currentConfig.SUPPORT_PHONE;
export const RESET_PASSWORD_ROUTE = currentConfig.RESET_PASSWORD_ROUTE;
export const LOGIN_ROUTE = '/sign-in';

export const REDIRECT_URLS = {
  resetPassword: `${APP_URL}${RESET_PASSWORD_ROUTE}`,
  signIn: `${APP_URL}${LOGIN_ROUTE}`,
};

export const DEBUG_APP = currentConfig.DEBUG_APP;
export const isDevelopment = CURRENT_ENV === 'development';
export const isLocal = CURRENT_ENV === 'local';
export const isTest = CURRENT_ENV === 'test';
export const isProduction = CURRENT_ENV === 'production';

// 🚨 Safety checks
if (isProduction && SUPABASE_URL.includes('ngrok')) {
  throw new Error('❌ Production build is pointing at ngrok! Check eas.json envs.');
}

if (isLocal && !SUPABASE_URL.includes('ngrok')) {
  console.warn('⚠️ Local build is not pointing at ngrok. Did you forget to update eas.json?');
}

// Log current environment for debugging
console.log(`🌍 Environment: ${CURRENT_ENV}`);
console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
console.log(`🏠 App URL: ${APP_URL}`);
console.log(`🐛 Debug: ${DEBUG_APP}`);
