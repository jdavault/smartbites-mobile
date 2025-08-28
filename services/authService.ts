import { supabase, supabaseEmail } from '@/lib/supabase';
import { UserService } from './userService';
import type { User, Session } from '@supabase/supabase-js';

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
  user?: User;
  session?: Session;
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
      return { error };
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
      return { error };
    }
  }

  static async signOut(): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Handle the case where session is already invalid on server
      if (error && error.message && error.message.includes('Session from session_id claim in JWT does not exist')) {
        // Session is already invalid, treat as successful logout
        return { error: null };
      }
      
      if (error) console.error('signOut error:', error);
      return { error };
    } catch (error) {
      console.error('Sign out exception:', error);
      return { error };
    }
  }

  static async signInWithIdToken(
    provider: string,
    token: string
  ): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: provider as any,
        token,
      });

      return { error, user: data.user, session: data.session };
    } catch (error) {
      console.error('signInWithIdToken error:', error);
      return { error };
    }
  }

  static async resetPasswordForEmail(
    email: string,
    redirectTo: string
  ): Promise<{ error: any }> {
    try {
      const { error } = await supabaseEmail.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      return { error };
    } catch (error) {
      console.error('resetPasswordForEmail error:', error);
      return { error };
    }
  }

  static async updatePassword(password: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (error) {
      console.error('updatePassword error:', error);
      return { error };
    }
  }

  /**
   * Exchanges a Supabase auth URL (web or deep link) for a session.
   * Safe-guards:
   * - No-ops if the URL has no auth params (avoids pointless RPCs).
   * - Logs a compact, redacted URL for debugging.
   */
  static async exchangeCodeForSession(
    url: string
  ): Promise<{ data: any; error: any }> {
    try {
      if (!url || typeof url !== 'string') {
        return { data: null, error: new Error('No URL provided') };
      }

      // Quick check to avoid calling Supabase with a bare path
      const hasAuthBits =
        url.includes('code=') ||
        url.includes('access_token=') ||
        url.includes('refresh_token=') ||
        url.includes('token='); // covers recovery-style links on some setups

      if (!hasAuthBits) {
        // Nothing to exchange; let the caller fall back to getSession()
        return { data: null, error: new Error('No auth params found in URL') };
      }

      // Helpful log without dumping the whole token to console
      const redacted = url.replace(
        /(access_token|refresh_token|code|token)=([^&#]+)/g,
        (_m, k) => `${k}=***`
      );
      console.log('🔄 exchangeCodeForSession ->', redacted);

      // Supabase v2 supports passing the raw URL (works for https and custom schemes)
      const { data, error } = await supabase.auth.exchangeCodeForSession(url);

      if (error) {
        console.error('exchangeCodeForSession: Supabase error:', error);
        return { data: null, error };
      }
      return { data, error: null };
    } catch (error) {
      console.error('exchangeCodeForSession: unexpected exception:', error);
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
}
