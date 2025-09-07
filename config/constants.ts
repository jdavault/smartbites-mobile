// config/constants.ts
import {
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_KEY,
  EXPO_PUBLIC_SUPABASE_RECIPE_IMAGES_PUBLIC_ROUTE,
  EXPO_PUBLIC_APP_BASE_URL,
  EXPO_PUBLIC_CONTACT_EMAIL,
  EXPO_PUBLIC_SUPPORT_EMAIL,
  EXPO_PUBLIC_SUPPORT_PHONE,
  EXPO_PUBLIC_RESET_PASSWORD_ROUTE,
  EXPO_PUBLIC_DEBUG_APP,
} from '@env';

// All values come directly from the environment file selected by NODE_ENV
export const APP_URL = EXPO_PUBLIC_APP_BASE_URL;
export const SUPABASE_URL = EXPO_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = EXPO_PUBLIC_SUPABASE_KEY;
export const SUPABASE_RECIPE_IMAGES_PUBLIC_ROUTE = EXPO_PUBLIC_SUPABASE_RECIPE_IMAGES_PUBLIC_ROUTE;
export const CONTACT_EMAIL = EXPO_PUBLIC_CONTACT_EMAIL;
export const SUPPORT_EMAIL = EXPO_PUBLIC_SUPPORT_EMAIL;
export const SUPPORT_PHONE = EXPO_PUBLIC_SUPPORT_PHONE;
export const RESET_PASSWORD_ROUTE = EXPO_PUBLIC_RESET_PASSWORD_ROUTE;
export const LOGIN_ROUTE = '/sign-in';

export const REDIRECT_URLS = {
  resetPassword: `${APP_URL}${RESET_PASSWORD_ROUTE}`,
  signIn: `${APP_URL}${LOGIN_ROUTE}`,
};

export const DEBUG_APP = EXPO_PUBLIC_DEBUG_APP === 'true';
export const isDevelopment = (typeof __DEV__ !== 'undefined' && __DEV__) || false;
export const isProduction = !isDevelopment;

// Log current environment for debugging
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
console.log(`🏠 App URL: ${APP_URL}`);
console.log(`🐛 Debug: ${DEBUG_APP}`);