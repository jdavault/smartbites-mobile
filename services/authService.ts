import { Redirect } from 'expo-router';
// services/authService.ts
import { supabase } from '@/lib/supabase';
import { UserService } from './userService';
import type { User, Session } from '@supabase/supabase-js';
import {
  APP_URL,
  isDevelopment,
  RESET_PASSWORD_ROUTE,
} from '@/config/constants';
import { Platform } from 'react-native';

export interface SignUpData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
}

export interface AuthResult {
  error: any;
  user: User | null;
  session: Session | null;
}

export class AuthService {
  static async getSession(): Promise<{ session: Session | null; error: any }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      return { session: data.session, error };
    } catch (error) {
      console.error('getSession error:', error);
      return { session: null, error };
    }
  }

  static async signUp(signUpData: SignUpData): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            first_name: signUpData.firstName || '',
            last_name: signUpData.lastName || '',
          },
        },
      });

      // Create profile row immediately if user object is present
      if (!error && data.user) {
        try {
          await UserService.createUserProfile({
            userId: data.user.id,
            firstName: signUpData.firstName || '',
            lastName: signUpData.lastName || '',
            address1: signUpData.address1,
            address2: signUpData.address2,
            city: signUpData.city,
            state: signUpData.state,
            zip: signUpData.zip,
            phone: signUpData.phone,
          });
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }

      return { error, user: data.user, session: data.session };
    } catch (error) {
      console.error('signUp error:', error);
      return { error, user: null, session: null };
    }
  }

  static async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) console.error('signIn error:', error);
      return { error, user: data.user, session: data.session };
    } catch (error) {
      console.error('Unexpected signIn error:', error);
      return { error, user: null, session: null };
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  }

  static async signInWithOAuth(
    provider: 'google' | 'apple',
    authCode: string
  ): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: undefined, // Let Supabase handle the redirect
        },
      });

      return { error, user: data.user, session: data.session };
    } catch (error) {
      console.error('signInWithIdToken error:', error);
      return { error, user: null, session: null };
    }
  }

  static async resetPasswordForEmail(email: string) {
    try {
      const isDev = __DEV__; // Expo sets this true in dev

      const isExpoDevClient =
        typeof navigator !== 'undefined' &&
        navigator.userAgent?.toLowerCase().includes('expo');

      // // Web uses Universal Links, Mobile uses Deep Links
      const redirectTo =
        Platform.OS === 'web' && !isDev
          ? `${APP_URL}${RESET_PASSWORD_ROUTE}` // real web users
          : isExpoDevClient
          ? 'smartbites://reset-password' // force deeplink when running dev client on device
          : 'smartbites://reset-password'; // normal native builds
      // const redirectTo = 'smartbites://reset-password';
      console.log('Requesting password reset with redirectTo:', redirectTo);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        console.error('Reset password error:', error);
        return { error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Reset password exception:', error);
      return { error };
    }
  }

  static async updatePassword(newPassword: string) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { data: null, error };
    }
  }

  static async exchangeCodeForSession(url: string) {
    try {
      console.log('Exchanging url for session...');
      const { data, error } = await supabase.auth.exchangeCodeForSession(url);

      if (error) {
        console.error('Exchange url error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Exchange url exception:', error);
      return { data: null, error };
    }
  }

  static async setSession(
    accessToken: string,
    refreshToken: string
  ): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      return { data, error };
    } catch (error) {
      console.error('setSession error:', error);
      return { data: null, error };
    }
  }

  static onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  }

  static async verifyOtpToken(
    token: string,
    type: 'recovery' | 'invite' = 'recovery'
  ) {
    try {
      console.log('Verifying OTP token...');
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type,
      });

      if (error) {
        console.error('Verify OTP error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Verify OTP exception:', error);
      return { data: null, error };
    }
  }
}
