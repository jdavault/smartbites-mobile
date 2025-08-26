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
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect URI used for Google OAuth only (not for Supabase email links)
  const redirectUri = makeRedirectUri({
    scheme: 'smartbites', // must match app.json/app.config
    preferLocalhost: true,
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
      const idToken =
        response.authentication?.idToken ?? response.params?.id_token ?? null;
      if (idToken) handleGoogleSignIn(idToken);
      else console.error('No ID token found in Google response');
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken?: string) => {
    if (!idToken) return;
    try {
      const { error } = await AuthService.signInWithIdToken('google', idToken);
      if (error) throw error;
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  // ---- Initial session restore + subscribe to auth changes
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { session, error } = await AuthService.getSession();
        if (!mounted) return;

        if (error) {
          console.error('getSession error:', error);
          // If refresh token is borked, clear it
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
      // guard for older SDKs
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // ---- Handle auth links on WEB (just route to reset-password; let that screen do the exchange)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const url = window.location.href;
    const hasRecovery = url.includes('type=recovery');
    const hasTokens =
      url.includes('code=') ||
      url.includes('access_token=') ||
      url.includes('refresh_token=');

    if (hasRecovery || hasTokens) {
      // Send the user to the reset-password screen; it will parse & exchange.
      try {
        // Preserve query/hash so the screen can read them
        const qs = window.location.search || '';
        const hash = window.location.hash || '';
        window.location.replace(`/reset-password${qs}${hash}`);
      } catch {}
    }
  }, []);

  // ---- Handle auth links on NATIVE (deep links): route to reset-password; let that screen do the work
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const forwardToResetIfAuthLink = (incomingUrl: string) => {
      const isAuthish =
        incomingUrl.includes('type=recovery') ||
        incomingUrl.includes('code=') ||
        incomingUrl.includes('access_token=') ||
        incomingUrl.includes('refresh_token=');

      if (isAuthish) {
        // Always route to reset screen. It will parse & exchange using the full URL.
        router.replace('/reset-password');
        return true;
      }
      return false;
    };

    // cold start
    Linking.getInitialURL().then((url) => {
      if (url) forwardToResetIfAuthLink(url);
    });

    // foreground
    const sub = Linking.addEventListener('url', ({ url }) => {
      forwardToResetIfAuthLink(url);
    });

    return () => sub.remove();
  }, [router]);

  // ---- Public API
  const signUp = async (
    email: string,
    password: string,
    additionalData?: any
  ) => {
    const { error } = await AuthService.signUp({
      email,
      password,
      firstName: additionalData?.first_name || '',
      lastName: additionalData?.last_name || '',
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    return await AuthService.signIn(email, password);
  };

  const signOut = async () => {
    try {
      // Optimistically clear local state
      setUser(null);
      setSession(null);

      const { error } = await AuthService.signOut();
      if (error) console.error('signOut error:', error);

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
