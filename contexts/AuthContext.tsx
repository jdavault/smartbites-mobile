// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { AuthService } from '@/services/authService';
import type { User, Session } from '@supabase/supabase-js';

import { makeRedirectUri } from 'expo-auth-session';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { ResponseType } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth Client IDs
const GOOGLE_CLIENT_IDS = {
  ios: '1010197305867-f3kuf70gl65tapvmj3kouiaff9bt36tb.apps.googleusercontent.com',
  android: '1010197305867-skot0d309k02prooif9o3vci80fhlb0r.apps.googleusercontent.com',
  web: '1010197305867-brcm0n9qc0v95ksrem0ljbiiktnout24.apps.googleusercontent.com',
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    additionalData?: Record<string, any>
  ) => Promise<{ error: any; data?: { user: any; session: any } }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;
  request: any;
  promptAsync: () => void;
  promptAsync: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isAuthURL = (url: string): boolean => {
  return (
    url.includes('type=recovery') ||
    url.includes('code=') ||
    url.includes('access_token=') ||
    url.includes('refresh_token=')
  );
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Google OAuth setup
  const [request, response, promptAsync] = useAuthRequest(
    {
      responseType: ResponseType.IdToken,
      clientId: GOOGLE_CLIENT_IDS[Platform.OS as keyof typeof GOOGLE_CLIENT_IDS] || GOOGLE_CLIENT_IDS.web,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: makeRedirectUri({
        scheme: 'smartbites',
        path: 'auth',
      }),
    },
    {
      authorizationEndpoint: 'https://accounts.google.com/oauth/authorize',
    }
  );

  const handleGoogleSignIn = async (idToken?: string) => {
    if (!idToken) return;
    try {
      const { error } = await AuthService.signInWithIdToken('google', idToken);
      if (error) throw error;
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken =
        response.authentication?.idToken ?? response.params?.id_token ?? null;
      if (idToken) handleGoogleSignIn(idToken);
      else console.error('No ID token found in Google response');
    }
  }, [response]);

  const signInWithGoogle = async () => {
    try {
      await promptAsync();
      return { error: null };
    } catch (error) {
      console.error('Google prompt error:', error);
      return { error };
    }
  // Initial session restore + subscribe to auth changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { session, error } = await AuthService.getSession();
        if (!mounted) return;
        if (error) {
          console.error('getSession error:', error);
          if (
            error.message?.includes('refresh_token_not_found') ||
            error.message?.includes('Invalid Refresh Token')
          ) {
            await AuthService.signOut();
          }
          setUser(null);
          setSession(null);
        } else {
          setUser(session?.user ?? null);
          setSession(session ?? null);
        }
      } catch (e) {
        console.error('initialize auth error:', e);
        setUser(null);
        setSession(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } = AuthService.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setUser(s?.user ?? null);
      setSession(s ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Handle auth links
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const url = window.location.href;
    if (isAuthURL(url)) {
      console.log('Web auth URL detected, letting reset-password handle it');
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const handleAuthLink = (incomingUrl: string) => {
      console.log('🔗 URL received in AuthContext:', incomingUrl);
      if (isAuthURL(incomingUrl)) {
        console.log('✅ Detected as auth URL, routing to reset-password');
        router.replace({
          pathname: '/reset-password',
          params: { originalUrl: encodeURIComponent(incomingUrl) },
        });
        return true;
      }
      return false;
    };
    Linking.getInitialURL().then((url) => url && handleAuthLink(url));
    const subscription = Linking.addEventListener('url', ({ url }) =>
      handleAuthLink(url)
    );
    return () => subscription.remove();
  }, [router]);

  // Public API
  const signUp = async (
    email: string,
    password: string,
    additionalData?: any
  ) => {
    const { error, user, session } = await AuthService.signUp({
      email,
      password,
      firstName: additionalData?.first_name || '',
      lastName: additionalData?.last_name || '',
      address1: additionalData?.address1,
      address2: additionalData?.address2,
      city: additionalData?.city,
      state: additionalData?.state,
      zip: additionalData?.zip,
      phone: additionalData?.phone,
    });
    return { error, data: { user, session } };
  };

  const signIn = async (email: string, password: string) => {
    return await AuthService.signIn(email, password);
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    try {
      const { error } = await AuthService.signOut();
      if (error) console.error('signOut error:', error);
    } catch (e) {
      console.error('Sign out exception:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        signInWithGoogle,
        request,
        promptAsync,
        promptAsync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}