// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

import { makeRedirectUri } from 'expo-auth-session';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { ResponseType } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const iosClientId =
  '1010197305867-f3kuf70gl65tapvmj3kouiaff9bt36tb.apps.googleusercontent.com';
const androidClientId =
  '1010197305867-skot0d309k02prooif9o3vci80fhlb0r.apps.googleusercontent.com';
const webClientId =
  '1010197305867-brcm0n9qc0v95ksrem0ljbiiktnout24.apps.googleusercontent.com';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    additionalData?: Record<string, any>
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;
  promptGoogleAsync: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect URI used for Google & email links
  const redirectUri = makeRedirectUri({
    scheme: 'smartbites', // must match your app.json/app.config
    path: 'auth',
    preferLocalhost: true, // nicer for web dev
  });

  // ---- Google sign-in (Expo AuthSession)
  const [request, response, promptAsync] = useAuthRequest({
    responseType: ResponseType.IdToken,
    iosClientId,
    androidClientId,
    webClientId,
    scopes: ['openid', 'email', 'profile'],
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      let idToken: string | null = null;
      if (response.authentication?.idToken)
        idToken = response.authentication.idToken;
      else if (response.params?.id_token) idToken = response.params.id_token;

      if (idToken) handleGoogleSignIn(idToken);
      else console.error('No ID token found in Google response');
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken?: string) => {
    if (!idToken) return;
    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  // ---- Restore session & subscribe to auth changes
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) {
          console.error('getSession error:', error);
          // Clear invalid refresh tokens
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('Invalid Refresh Token')) {
            await supabase.auth.signOut();
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

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setUser(s?.user ?? null);
      setSession(s ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ---- Handle auth links on WEB (OAuth / email confirmations)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Only try to exchange if we see auth params present
    const url = window.location.href;
    const hasAuthParams =
      url.includes('code=') ||
      url.includes('access_token=') ||
      url.includes('refresh_token=');

    if (!hasAuthParams) return;

    (async () => {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(url);
        if (error) {
          console.warn('exchangeCodeForSession (web) error:', error);
        } else if (data?.session) {
          setUser(data.session.user);
          setSession(data.session);
        }
      } catch (e) {
        console.warn('Web exchange failed:', e);
      } finally {
        // Clean the URL so we don't re-process on refresh
        try {
          const clean = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, clean);
        } catch {}
      }
    })();
  }, []);

  // ---- Handle auth links on NATIVE (Expo deep links)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleDeepLink = async ({ url }: { url: string }) => {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(url);
        if (error) {
          console.warn('exchangeCodeForSession (native) error:', error);
        } else if (data?.session) {
          setUser(data.session.user);
          setSession(data.session);
        }
      } catch (e) {
        console.warn('Deep link handling failed:', e);
      }
    };

    // cold start
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // foreground links
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  // ---- Public API
  const signUp = async (
    email: string,
    password: string,
    additionalData?: any
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: additionalData,
        // Set this if you want confirmation emails to open your app:
        // emailRedirectTo: redirectUri,
      },
    });

    // Create profile row immediately (if user object is present)
    if (!error && data.user) {
      try {
        await supabase.from('user_profiles').insert({
          user_id: data.user.id,
          first_name: additionalData?.first_name || '',
          last_name: additionalData?.last_name || '',
        });
      } catch (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) console.error('signIn error:', error);
      return { error };
    } catch (err) {
      console.error('Unexpected signIn error:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      // Optimistically clear local state
      setUser(null);
      setSession(null);

      // Sign out from Supabase (if there was a session)
      const { error } = await supabase.auth.signOut();
      if (error) console.error('signOut error:', error);

      // Web-only: clear browser storage/cookies (optional but thorough)
      if (Platform.OS === 'web') {
        try {
          localStorage.clear();
          sessionStorage.clear();
          document.cookie.split(';').forEach((c) => {
            document.cookie = c
              .replace(/^ +/, '')
              .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
          });
        } catch {}
      }
    } catch (e) {
      console.error('Sign out exception:', e);
      // Force clear local state even on error
      setUser(null);
      setSession(null);
    }
  };

  const signInWithGoogle = async () => {
    if (request) {
      await promptAsync();
      return { error: null };
    }
    return { error: { message: 'Google sign-in not ready' } };
  };

  const promptGoogleAsync = async () => {
    if (request) await promptAsync();
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
        promptGoogleAsync,
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
