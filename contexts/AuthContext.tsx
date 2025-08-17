import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { ResponseType } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const iosClientId = '1010197305867-f3kuf70gl65tapvmj3kouiaff9bt36tb.apps.googleusercontent.com';
const androidClientId = '1010197305867-skot0d309k02prooif9o3vci80fhlb0r.apps.googleusercontent.com';
const webClientId = '1010197305867-brcm0n9qc0v95ksrem0ljbiiktnout24.apps.googleusercontent.com';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, additionalData?: any) => Promise<{ error: any }>;
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

  const redirectUri = makeRedirectUri({
    scheme: 'smartbites',
    path: 'auth',
    preferLocalhost: true,
  });

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
      let idToken = null;
      
      // Try to get ID token from authentication object
      if (response.authentication && response.authentication.idToken) {
        idToken = response.authentication.idToken;
      }
      // Fallback to params
      else if (response.params && response.params.id_token) {
        idToken = response.params.id_token;
      }
      
      if (idToken) {
        handleGoogleSignIn(idToken);
      } else {
        console.error('No ID token found in Google authentication response');
      }
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string | undefined) => {
    if (!idToken) {
      console.error('No ID token received from Google authentication');
      return;
    }

    try {
      // Use Supabase Google sign-in with ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, additionalData?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: additionalData,
        emailRedirectTo: undefined, // Disable email confirmation for now
      },
    });
    
    // If signup successful and user is immediately available, create profile
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
    console.log('AuthContext signIn called with email:', email);
    
    try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Supabase signIn error:', error);
    } else {
      console.log('Supabase signIn successful');
    }
    
    return { error };
    } catch (err) {
      console.error('Unexpected error in signIn:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      // Clear local state immediately for better UX
      setUser(null);
      setSession(null);
      
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
      }
      
      // For web, force complete cleanup
      if (Platform.OS === 'web') {
        try {
          // Clear all browser storage
          localStorage.clear();
          sessionStorage.clear();
          
          // Clear any cookies by setting them to expire
          document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
          });
        } catch (e) {
          console.log('Storage clear failed:', e);
        }
      }
      
      // Additional cleanup - clear any cached data
      try {
        // Clear any potential cached auth tokens
        await supabase.auth.refreshSession();
      } catch (refreshError) {
        // Ignore refresh errors during logout
        console.log('Refresh session error during logout (expected):', refreshError);
      }
      
    } catch (error) {
      console.error('Sign out error:', error);
      
      // Force clear state even if Supabase signOut fails
      setUser(null);
      setSession(null);
      
      // On web, still try to clear storage even if signOut failed
      if (Platform.OS === 'web') {
        try {
          localStorage.clear();
          sessionStorage.clear();
          document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
          });
        } catch (e) {
          console.log('Storage clear failed:', e);
        }
      }
    }
    
    // Force a page reload on web to ensure complete cleanup
    if (Platform.OS === 'web') {
      // Small delay to ensure state updates are processed
      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 100);
    }
  };

  const signInWithGoogle = async () => {
    // Use the Google auth flow
    if (request) {
      await promptAsync();
      return { error: null };
    }
    return { error: { message: 'Google sign-in not ready' } };
  };

  const promptGoogleAsync = async () => {
    if (request) {
      await promptAsync();
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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}