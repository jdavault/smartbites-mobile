// Centralized configuration for the app

export const APP_URL =
  process.env.EXPO_PUBLIC_APP_BASE_URL || 'https://smartbites.menu';

export const SUPABASE_RECIPE_IMAGES_PUBLIC_ROUTE =
  process.env.EXPO_PUBLIC_SUPABASE_RECIPE_IMAGES_PUBLIC_ROUTE ||
  '/storage/v1/object/public/recipe-images';
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY!;
export const RESET_PASSWORD_ROUTE =
  process.env.EXPO_PUBLIC_RESET_PASSWORD_ROUTE || '/reset-password';
export const LOGIN_ROUTE = process.env.EXPO_PUBLIC_LOGIN_ROUTE || '/sign-in';

export const REDIRECT_URLS = {
  resetPassword: `${APP_URL}${RESET_PASSWORD_ROUTE}`,
  signIn: `${APP_URL}${LOGIN_ROUTE}`,
};

export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;
