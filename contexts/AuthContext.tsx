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
import { isAuthLink } from '@/utils/authLink';

WebBrowser.maybeCompleteAuthSession();

// Thread safety helpers
const onMain = (fn: () => void) => {
  if (Platform.OS === 'ios') {
    setTimeout(fn, 0);
  } else {
    fn();
  }
};

// Safe URL validation and opening
const safeOpenURL = async (raw: string | null | undefined) => {
  if (!raw || typeof raw !== 'string') return;
  try {
    const parsed = raw.trim();
    if (!/^([a-zA-Z][a-zA-Z0-9+\-.]*):/.test(parsed)) {
      console.warn('Invalid URL scheme:', parsed);
      return;
    }
    onMain(() => {
      try {
        Linking.openURL(parsed);
      } catch (e) {
        console.warn('Linking.openURL failed:', e);
      }
    });
  } catch (e) {
    console.warn('safeOpenURL failed:', e);
  }
};

// Safe router navigation
const safeRouterReplace = (router: any, path: string) => {
  onMain(() => {
    try {
      router.replace(path);
    } catch (e) {
      console.warn('Router replace failed:', e);
    }
  });
};

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
          if (
            error.message?.includes('refresh_token_not_found') ||
            error.message?.includes('Invalid Refresh Token')
          ) {
            try {
              await AuthService.signOut();
            } catch (signOutError) {
              console.error('Sign out during error recovery failed:', signOutError);
            }
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

  // ---- Handle auth links on WEB: forward to reset-password WITH original params; screen will exchange & strip
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    try {
      const url = window.location.href;
      if (url && isAuthLink(url)) {
        console.log('🔗 Web auth link detected:', url.replace(/(token|code|access_token)=([^&#]+)/g, '$1=***'));
        try {
          const qs = window.location.search || '';
          const hash = window.location.hash || '';
          window.location.replace(`/reset-password${qs}${hash}`);
        } catch (e) {
          console.error('Web redirect failed:', e);
        }
      }
    } catch (e) {
      console.error('Web auth link handling failed:', e);
    }
  }, []);

  // ---- Handle auth links on NATIVE: forward the FULL url to reset-password via param
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Track last processed URL to prevent re-processing
    let lastProcessedUrl: string | null = null;

    const forwardToResetIfAuthLink = (incomingUrl: string) => {
      try {
        if (!incomingUrl || typeof incomingUrl !== 'string') return false;
        
        // Prevent re-processing the same URL
        if (lastProcessedUrl === incomingUrl) {
          console.log('🔗 Skipping duplicate URL:', incomingUrl.replace(/(token|code|access_token)=([^&#]+)/g, '$1=***'));
          return false;
        }
        
        if (!isAuthLink(incomingUrl)) return false;
        
        lastProcessedUrl = incomingUrl;
        console.log('🔗 Native auth link detected:', incomingUrl.replace(/(token|code|access_token)=([^&#]+)/g, '$1=***'));

        safeRouterReplace(router, `/reset-password?url=${encodeURIComponent(incomingUrl)}`);
        return true;
      } catch (e) {
        console.error('forwardToResetIfAuthLink failed:', e);
        return false;
      }
    };

    // cold start
    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          console.log('🔗 Initial URL:', url.replace(/(token|code|access_token)=([^&#]+)/g, '$1=***'));
          forwardToResetIfAuthLink(url);
        }
      })
      .catch((e) => {
        console.error('getInitialURL failed:', e);
      });

    // foreground
    const sub = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 Foreground URL:', url.replace(/(token|code|access_token)=([^&#]+)/g, '$1=***'));
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
    try {
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
        } catch (e) {
          console.warn('Web storage cleanup failed:', e);
        }
      }
    } catch (e) {
      console.error('Sign out exception:', e);
      setUser(null);
      setSession(null);
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (request) {
        await promptAsync();
        return { error: null };
      }
      return { error: { message: 'Google sign-in not ready' } };
    } catch (error) {
      console.error('signInWithGoogle failed:', error);
      return { error: { message: 'Google sign-in failed' } };
    }
  };

  const promptGoogleAsync = async () => {
    try {
      if (request) await promptAsync();
    } catch (error) {
      console.error('promptGoogleAsync failed:', error);
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
