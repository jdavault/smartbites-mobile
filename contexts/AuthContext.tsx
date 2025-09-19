// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { AuthService } from '@/services/authService';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

import { makeRedirectUri } from 'expo-auth-session';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { useAuthRequest as useAppleAuthRequest } from 'expo-auth-session/providers/apple';
import { ResponseType, CodeChallengeMethod } from 'expo-auth-session';

// Configure WebBrowser for better OAuth handling
if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

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
  ) => Promise<{ error: any; data?: { user: any; session: any } }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  request: any;
  promptAsync: any;
  appleRequest: any;
  promptAppleAsync: () => Promise<void>;
  promptGoogleAsync: () => Promise<void>;
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

  const redirectUri = makeRedirectUri({
    scheme: 'smartbites',
    preferLocalhost: Platform.OS === 'web',
  });

  // Google sign-in (Expo AuthSession) - only for mobile
  const [request, response, promptAsync] = useAuthRequest({
    responseType: ResponseType.Code,
    codeChallengeMethod:
      Platform.OS === 'web' ? undefined : CodeChallengeMethod.S256,
    iosClientId: Platform.OS === 'ios' ? iosClientId : undefined,
    androidClientId: Platform.OS === 'android' ? androidClientId : undefined,
    webClientId: Platform.OS === 'web' ? webClientId : undefined,
    scopes: ['openid', 'email', 'profile'],
    redirectUri,
    additionalParameters: {},
    extraParams: {},
  });

  // Apple sign-in (Expo AuthSession) - only for mobile
  const [appleRequest, appleResponse, promptAppleAsync] = useAppleAuthRequest({
    responseType: ResponseType.Code,
    codeChallengeMethod:
      Platform.OS === 'web' ? undefined : CodeChallengeMethod.S256,
    scopes: ['email', 'name'],
    redirectUri,
  });
  // Debug logging for redirect URI (after request is initialized)
  useEffect(() => {
    console.log('🔍 Google OAuth Debug Info:');
    console.log('  Platform:', Platform.OS);
    console.log('  Redirect URI:', redirectUri);
    console.log('  Web Client ID:', webClientId);
    console.log('  Request ready:', !!request);
    console.log('🔍 Apple OAuth Debug Info:');
    console.log('  Apple Request ready:', !!appleRequest);
  }, [request, redirectUri]);

  useEffect(() => {
    if (Platform.OS === 'web') return; // Skip for web
    console.log('🔍 Google response received:', response);
    if (response?.type === 'success') {
      console.log('🔍 Google success response:', response);
      const authCode = response.params?.code;
      console.log('🔍 Auth Code found:', !!authCode);
      if (authCode) handleGoogleSignIn(authCode);
      else console.error('No auth code found in Google response');
    } else if (response?.type === 'error') {
      console.error('🔍 Google OAuth error:', response.error);
      console.error('🔍 Google OAuth error params:', response.params);
    }
  }, [response]);

  useEffect(() => {
    if (Platform.OS === 'web') return; // Skip for web
    console.log('🔍 Apple response received:', appleResponse);
    if (appleResponse?.type === 'success') {
      console.log('🔍 Apple success response:', appleResponse);
      const authCode = appleResponse.params?.code;
      console.log('🔍 Apple Auth Code found:', !!authCode);
      if (authCode) handleAppleSignIn(authCode);
      else console.error('No auth code found in Apple response');
    } else if (appleResponse?.type === 'error') {
      console.error('🔍 Apple OAuth error:', appleResponse.error);
      console.error('🔍 Apple OAuth error params:', appleResponse.params);
    }
  }, [appleResponse]);
  const handleGoogleSignIn = async (authCode?: string) => {
    if (Platform.OS === 'web') return; // This should not be called on web
    console.log('🔍 Attempting Google sign-in with auth code:', !!authCode);
    if (!authCode) return;
    try {
      // Exchange the authorization code for tokens via Supabase
      const { error } = await AuthService.signInWithOAuth(
        'google',
        response?.url || '',
        false
      );
      console.log(
        '🔍 Supabase Google sign-in result:',
        error ? 'ERROR' : 'SUCCESS'
      );
      if (error) throw error;
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const handleAppleSignIn = async (authCode?: string) => {
    if (Platform.OS === 'web') return; // This should not be called on web
    console.log('🔍 Attempting Apple sign-in with auth code:', !!authCode);
    if (!authCode) return;
    try {
      // Exchange the authorization code for tokens via Supabase
      const { error } = await AuthService.signInWithOAuth(
        'apple',
        appleResponse?.url || '',
        false
      );
      console.log(
        '🔍 Supabase Apple sign-in result:',
        error ? 'ERROR' : 'SUCCESS'
      );
      if (error) throw error;
    } catch (error) {
      console.error('Apple sign-in error:', error);
    }
  };
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

  const promptGoogleAsync = async () => {
    if (Platform.OS === 'web') {
      // Use Supabase's built-in OAuth for web
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });

        if (error) {
          console.error('Supabase OAuth error:', error);
          throw error;
        }
      } catch (error) {
        console.error('Google OAuth error:', error);
      }
    } else if (request) {
      try {
        await promptAsync();
      } catch (error) {
        console.error('Google OAuth prompt error:', error);
      }
    }
  };

  const promptAppleSignIn = async () => {
    if (Platform.OS === 'web') {
      // Use Supabase's built-in OAuth for web
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: window.location.origin,
          },
        });

        if (error) {
          console.error('Supabase Apple OAuth error:', error);
          throw error;
        }
      } catch (error) {
        console.error('Apple OAuth error:', error);
      }
    } else if (appleRequest) {
      try {
        await promptAppleAsync();
      } catch (error) {
        console.error('Apple OAuth prompt error:', error);
      }
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
        promptGoogleAsync,
        request,
        promptAsync,
        appleRequest,
        promptAppleAsync: promptAppleSignIn,
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
