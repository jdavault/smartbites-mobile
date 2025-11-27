// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, View, ActivityIndicator, Text } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { AuthService } from '@/services/authService';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Ensure WebBrowser cleanup for OAuth flows
WebBrowser.maybeCompleteAuthSession();

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
  promptGoogleAsync: () => Promise<void>;
  promptAppleAsync: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Only treat real password-recovery links as reset
const isPasswordResetURL = (url: string): boolean =>
  url.includes('type=recovery');

// Simple SmartBites loading screen while auth bootstraps
function AuthLoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F9F8F2', // Rice
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Swap this Text for your logo Image later if you want */}
      <Text
        style={{
          fontSize: 26,
          fontWeight: '700',
          marginBottom: 12,
          color: '#253031', // Iron Black
        }}
      >
        SmartBites
      </Text>
      <ActivityIndicator size="large" />
      <Text
        style={{
          marginTop: 8,
          color: '#253031',
          fontSize: 14,
        }}
      >
        Loading your allergy-aware experience…
      </Text>
    </View>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // true until first getSession completes

  // FIX: Use Platform.OS to safely determine the redirect URI
  const webRedirectUri = Platform.select({
    web:
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin + '/auth/callback'
        : 'https://smartbites.food/auth/callback',
    default: 'https://smartbites.food/auth/callback',
  }) as string;

  // Native: must match app.json `"scheme": "smartbites"`
  // and be in Supabase Auth Redirect URLs.
  const nativeRedirectUri = 'smartbites://auth';

  // =======================
  // Session bootstrap + auth change listener
  // =======================

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;

      if (error) {
        console.error('Session error:', error);
        setUser(null);
        setSession(null);
      } else {
        setUser(session?.user ?? null);
        setSession(session ?? null);
      }
      setLoading(false); // initial auth bootstrap complete
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setSession(session ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // =======================
  // After-login navigation
  // =======================

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    console.log('✅ Authenticated user detected, routing to /(tabs)');
    router.replace('/(tabs)');
  }, [user, loading, router]);

  // =======================
  // Deep link handling (reset password only)
  // =======================

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleAuthLink = (url: string) => {
      if (isPasswordResetURL(url)) {
        console.log('📧 Password reset URL detected:', url);
        router.replace({
          pathname: '/reset-password',
          params: { originalUrl: encodeURIComponent(url) },
        });
      } else {
        // For OAuth callback (smartbites://auth?code=...), we let WebBrowser /
        // exchangeCodeForSession handle it; just log here.
        console.log('🔗 Non-reset auth URL received:', url);
      }
    };

    Linking.getInitialURL().then((url) => url && handleAuthLink(url));

    const subscription = Linking.addEventListener('url', ({ url }) =>
      handleAuthLink(url)
    );

    return () => subscription.remove();
  }, [router]);

  // =======================
  // Public API methods: email/password
  // =======================

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
    await supabase.auth.signOut();
    try {
      router.replace('/login');
    } catch (e) {
      console.log('signOut navigation error:', e);
    }
  };

  // =======================
  // Google OAuth via Supabase
  // =======================

  const promptGoogleAsync = async () => {
    const redirectTo =
      Platform.OS === 'web' ? webRedirectUri : nativeRedirectUri;

    console.log('🔍 Starting Google OAuth via Supabase');
    console.log('   Platform:', Platform.OS);
    console.log('   redirectTo:', redirectTo);

    if (Platform.OS === 'web') {
      // Web: Supabase will redirect the browser
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) {
        console.error('Google OAuth error (web):', error);
        alert('Failed to initiate Google sign-in. Please try again.');
      }
      return;
    }

    // Native: get the URL, then open it in a browser ourselves
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true, // important on native
      },
    });

    if (error) {
      console.error('Google OAuth error (native):', error);
      alert('Failed to initiate Google sign-in. Please try again.');
      return;
    }

    if (!data?.url) {
      console.error('Google OAuth: no auth URL returned from Supabase');
      alert('Failed to start Google sign-in. Please try again.');
      return;
    }

    console.log('✅ Google OAuth auth URL:', data.url);

    // Open Google login in a browser / custom tab
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      nativeRedirectUri
    );
    console.log('🔍 WebBrowser result:', result);

    if (result.type === 'success' && result.url) {
      // Parse the redirect URL to get the `code`
      const parsed = Linking.parse(result.url);
      const code = parsed.queryParams?.code as string | undefined;

      console.log('🔍 Parsed callback URL:', parsed);
      console.log('🔍 OAuth code present:', !!code);

      if (code) {
        const { data: exchangeData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('❌ Error exchanging code for session:', exchangeError);
          alert('Failed to complete Google sign-in. Please try again.');
        } else {
          console.log(
            '✅ Exchanged code for session, user:',
            exchangeData.session?.user?.id
          );
          // onAuthStateChange listener will update user/session,
          // and the "after-login" effect will route to /(tabs)
        }
      }
    } else if (result.type === 'cancel') {
      console.log('ℹ️ Google sign-in cancelled by user.');
    }
  };

  const promptAppleAsync = async () => {
    const redirectTo =
      Platform.OS === 'web' ? webRedirectUri : nativeRedirectUri;

    console.log('🔍 Starting Apple OAuth via Supabase');
    console.log('   Platform:', Platform.OS);
    console.log('   redirectTo:', redirectTo);

    if (Platform.OS === 'web') {
      // Web: let Supabase handle the full redirect flow
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo,
        },
      });

      if (error) {
        console.error('Apple OAuth error (web):', error);
        alert('Failed to initiate Apple sign-in. Please try again.');
      }
      return;
    }

    // Native: same pattern as Google
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
        skipBrowserRedirect: true, // important on native
      },
    });

    if (error) {
      console.error('Apple OAuth error (native):', error);
      alert('Failed to initiate Apple sign-in. Please try again.');
      return;
    }

    if (!data?.url) {
      console.error('Apple OAuth: no auth URL returned from Supabase');
      alert('Failed to start Apple sign-in. Please try again.');
      return;
    }

    console.log('✅ Apple OAuth auth URL:', data.url);

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      nativeRedirectUri
    );
    console.log('🔍 Apple WebBrowser result:', result);

    if (result.type === 'success' && result.url) {
      const parsed = Linking.parse(result.url);
      const code = parsed.queryParams?.code as string | undefined;

      console.log('🔍 Parsed Apple callback URL:', parsed);
      console.log('🔍 Apple OAuth code present:', !!code);

      if (code) {
        const { data: exchangeData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error(
            '❌ Error exchanging Apple code for session:',
            exchangeError
          );
          alert('Failed to complete Apple sign-in. Please try again.');
        } else {
          console.log(
            '✅ Apple sign-in complete, user:',
            exchangeData.session?.user?.id
          );
          // onAuthStateChange + after-login effect will route to /(tabs)
        }
      }
    } else if (result.type === 'cancel') {
      console.log('ℹ️ Apple sign-in cancelled by user.');
    }
  };

  // =======================
  // Gate the entire app on auth loading
  // =======================

  if (loading) {
    // While Supabase is figuring out if there's an existing session,
    // DO NOT render any routes (no +not-found, no empty tabs).
    return <AuthLoadingScreen />;
  }

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
        promptAppleAsync,
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
