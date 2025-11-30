// app/reset-password.tsx
import React, { useEffect, useMemo, useState, Fragment } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter, Link, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing } from '@/constants/Spacing';
import { Fonts, FontSizes } from '@/constants/Typography';
import ThemedText from '@/components/ThemedText';
import { AuthService } from '@/services/authService';
import { stripAuthParamsFromWebLocation } from '@/utils/authLink';
import { supabase, supabaseWeb, supabaseMobile } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { APP_URL, isDevelopment, DEBUG_APP } from '@/config/constants';

type ModalInfo = {
  visible: boolean;
  title: string;
  subtitle?: string;
  emoji?: string;
};

const DismissWrapper =
  Platform.OS === 'web' ? (Fragment as any) : TouchableWithoutFeedback;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const routerParams = useLocalSearchParams();
  const { colors: theme } = useTheme();
  const { signIn, setIsResettingPassword } = useAuth();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [initializing, setInitializing] = useState(true);
  const [headerStatus, setHeaderStatus] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [mode, setMode] = useState<'request' | 'reset'>('request');

  // Debug state
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);

  const [modalInfo, setModalInfo] = useState<ModalInfo>({
    visible: false,
    title: '',
  });

  useEffect(() => {
    let isMounted = true;
    setIsResettingPassword(true);

    const processReset = async () => {
      // ---- Debug helpers (env-gated) ----
      const DEBUG = true;
      // (typeof DEBUG_APP !== 'undefined' && DEBUG_APP) || isDevelopment;
      const debugMessages: string[] = [];
      const pushDbg = (line: string) => {
        debugMessages.push(line);
        if (DEBUG) console.log('[RESET]', line);
      };

      try {
        // 0) Existing session?
        try {
          const { session, error: sessionError } =
            await AuthService.getSession();
          if (session && !sessionError) {
            pushDbg('✓ Found existing session!');
            pushDbg(`Session user: ${session.user?.email}`);
            pushDbg(`Session established: ${new Date().toISOString()}`);

            if (isMounted) {
              setUserEmail(session.user?.email || null);
              setMode('reset');
              setHeaderStatus('Enter a new password to complete your reset.');
              setDebugInfo(debugMessages.join('\n'));
              setInitializing(false);
              setShowDebug(DEBUG);
            }
            return; // We already have a session
          }
          pushDbg(
            `No existing session found. Error: ${
              sessionError?.message || 'none'
            }`
          );
          pushDbg('Proceeding with URL parsing...');
        } catch (e: any) {
          pushDbg(`Session check error: ${e?.message}`);
        }

        // 1) Determine current URL (web vs native)
        let currentUrl: string | null = null;

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          currentUrl = window.location.href;
          pushDbg(`Web URL: ${currentUrl}`);
        } else {
          // ✅ MOBILE: prefer routerParams.originalUrl from AuthProvider
          if (routerParams.originalUrl) {
            try {
              currentUrl = decodeURIComponent(
                routerParams.originalUrl as string
              );
              pushDbg(`Decoded from router: ${currentUrl}`);
            } catch (e) {
              pushDbg(`Decode error: ${e}`);
            }
          }

          if (!currentUrl) {
            const initialUrl = await Linking.getInitialURL();
            pushDbg(`Initial URL: ${initialUrl || 'none'}`);
            if (initialUrl) {
              currentUrl = initialUrl;
            }
          }
        }

        if (!currentUrl) {
          pushDbg('ERROR: No URL found from any source');
          if (isMounted) {
            setDebugInfo(debugMessages.join('\n'));
            setHeaderStatus('No reset link found. Please request a new one.');
            setMode('request');
            setInitializing(false);
            setShowDebug(DEBUG);
          }
          return;
        }

        // 1a) Web fallback for custom scheme
        if (!currentUrl.startsWith('http') && Platform.OS === 'web') {
          currentUrl = currentUrl.replace(/^smartbites:\/\/[^/]+/, APP_URL);
          pushDbg(`Converted deep link to web fallback: ${currentUrl}`);
        }

        const isActuallyMobile =
          Platform.OS !== 'web' ||
          (typeof window !== 'undefined' &&
            window.navigator?.userAgent?.includes('Mobile'));

        // 2) Pick client
        let supabaseClient: SupabaseClient<any, 'public', 'public', any, any>;
        if (currentUrl.startsWith('smartbites://')) {
          pushDbg('Deep link detected - forcing mobile client');
          supabaseClient = supabaseMobile;
        } else {
          supabaseClient = isActuallyMobile ? supabaseMobile : supabaseWeb;
        }

        pushDbg('=== Reset Password Process Started ===');
        pushDbg(`Platform.OS: ${Platform.OS}`);
        pushDbg(`Detected as mobile: ${isActuallyMobile}`);
        pushDbg(
          `Using client: ${isActuallyMobile ? 'supabaseMobile' : 'supabaseWeb'}`
        );
        try {
          pushDbg(`Client config exists: ${!!supabaseClient}`);
          pushDbg(`Auth config exists: ${!!supabaseClient.auth}`);
        } catch (e) {
          pushDbg(`Client debug error: ${e}`);
        }

        // 3) Parse URL
        let urlObj: URL;
        try {
          if (currentUrl.startsWith('smartbites://')) {
            urlObj = new URL(
              currentUrl.replace('smartbites://', 'https://temp.com/')
            );
          } else {
            urlObj = new URL(currentUrl);
          }
          pushDbg('URL parsed successfully');
          pushDbg(`Current timestamp: ${Date.now()}`);
          pushDbg(`URL length: ${currentUrl.length}`);
          pushDbg(
            `Contains duplicate params: ${
              currentUrl.includes('?error=access_denied') &&
              currentUrl.includes('#error=access_denied')
            }`
          );
        } catch (e) {
          pushDbg(`URL parse error: ${e}`);
          if (isMounted) {
            setDebugInfo(debugMessages.join('\n'));
            setHeaderStatus('Invalid reset link format.');
            setMode('request');
            setInitializing(false);
            setShowDebug(DEBUG);
          }
          return;
        }

        // 3a) Extract params (search + hash)
        const params = {
          code: urlObj.searchParams.get('code'),
          token: urlObj.searchParams.get('token'),
          type: urlObj.searchParams.get('type'),
          access_token: urlObj.searchParams.get('access_token'),
          refresh_token: urlObj.searchParams.get('refresh_token'),
          error: urlObj.searchParams.get('error'),
          error_code: urlObj.searchParams.get('error_code'),
        };
        if (urlObj.hash) {
          const hashParams = new URLSearchParams(urlObj.hash.substring(1));
          params.access_token =
            params.access_token || hashParams.get('access_token');
          params.refresh_token =
            params.refresh_token || hashParams.get('refresh_token');
          params.code = params.code || hashParams.get('code');
          params.token = params.token || hashParams.get('token');
          params.type = params.type || hashParams.get('type');
          params.error = params.error || hashParams.get('error');
          params.error_code = params.error_code || hashParams.get('error_code');
        }

        pushDbg('=== Parameters Found ===');
        Object.entries(params).forEach(([k, v]) =>
          pushDbg(
            `${k}: ${
              v
                ? k.includes('token')
                  ? String(v).substring(0, 20) + '...'
                  : v
                : 'null'
            }`
          )
        );

        if (params.error || params.error_code) {
          pushDbg(`ERROR in URL: ${params.error || params.error_code}`);
          if (isMounted) {
            setDebugInfo(debugMessages.join('\n'));
            setHeaderStatus(
              'The reset link contains an error. Please request a new one.'
            );
            setMode('request');
            setInitializing(false);
            setShowDebug(DEBUG);
          }
          return;
        }

        // 4) Establish session
        let sessionEstablished = false;

        if (Platform.OS === 'web') {
          // Prefer token on web (bridge path), else fall back to PKCE exchange
          if (params.token && (params.type === 'recovery' || !params.type)) {
            pushDbg('=== Web: verifyOtp with token ===');
            try {
              const { data, error } = await supabaseClient.auth.verifyOtp({
                token_hash: params.token,
                type: 'recovery',
              });
              if (!error && data?.session) {
                pushDbg('✓ Web OTP verification successful!');
                sessionEstablished = true;
                if (isMounted) {
                  setUserEmail(data.session.user?.email || null);
                  setMode('reset');
                  setHeaderStatus(
                    'Enter a new password to complete your reset.'
                  );
                }
              } else {
                pushDbg(`✗ Web OTP failed: ${error?.message}`);
              }
            } catch (e: any) {
              pushDbg(`✗ Web OTP exception: ${e?.message}`);
            }
          } else if (params.code) {
            pushDbg('=== Web: exchangeCodeForSession (PKCE) ===');
            try {
              const { data, error } =
                await supabaseClient.auth.exchangeCodeForSession(currentUrl);
              if (error) {
                pushDbg(`✗ Web exchange failed: ${error.message}`);
              } else if (data?.session) {
                pushDbg('✓ Web code exchange successful!');
                sessionEstablished = true;
                if (isMounted) {
                  setUserEmail(data.session.user?.email || null);
                  setMode('reset');
                  setHeaderStatus(
                    'Enter a new password to complete your reset.'
                  );
                }
              }
            } catch (e: any) {
              pushDbg(`✗ Web exchange exception: ${e?.message}`);
            }
          } else {
            pushDbg('Web: no token or code found.');
          }
          // app/reset-password.tsx - Replace the mobile branch (around line 340)
        } else {
          // MOBILE
          const tokenValue = params.token;
          const codeValue = params.code;

          if (tokenValue?.startsWith('pkce_')) {
            // Direct PKCE token (shouldn't happen anymore but keep for safety)
            pushDbg('=== Mobile: PKCE token - exchangeCodeForSession ===');
            try {
              const { data, error } =
                await supabaseClient.auth.exchangeCodeForSession(currentUrl);
              // ... rest of PKCE handling
            } catch (e: any) {
              pushDbg(`✗ Mobile PKCE exchange exception: ${e?.message}`);
            }
          } else if (codeValue) {
            // Authorization code from Supabase redirect - use exchangeCodeForSession
            pushDbg(
              '=== Mobile: Authorization code - exchangeCodeForSession ==='
            );
            pushDbg(`Code: ${codeValue.substring(0, 12)}...`);
            try {
              const { data, error } =
                await supabaseClient.auth.exchangeCodeForSession(currentUrl);

              if (!error && data?.session) {
                pushDbg('✓ Mobile code exchange successful!');
                sessionEstablished = true;
                if (isMounted) {
                  setUserEmail(data.session.user?.email || null);
                  setMode('reset');
                  setHeaderStatus(
                    'Enter a new password to complete your reset.'
                  );
                }
              } else {
                pushDbg(`✗ Mobile code exchange failed: ${error?.message}`);
              }
            } catch (e: any) {
              pushDbg(`✗ Mobile code exchange exception: ${e?.message}`);
            }
          } else if (tokenValue) {
            // Regular OTP token (non-PKCE) - use verifyOtp
            pushDbg(`=== Mobile: OTP token - verifyOtp ===`);
            pushDbg(`Token: ${tokenValue.substring(0, 12)}...`);
            try {
              const { data, error } = await supabaseClient.auth.verifyOtp({
                token_hash: tokenValue,
                type: 'recovery',
              });

              if (!error && data?.session) {
                pushDbg('✓ Mobile OTP verification successful!');
                sessionEstablished = true;
                if (isMounted) {
                  setUserEmail(data.session.user?.email || null);
                  setMode('reset');
                  setHeaderStatus(
                    'Enter a new password to complete your reset.'
                  );
                }
              } else {
                pushDbg(`✗ Mobile OTP failed: ${error?.message}`);
              }
            } catch (e: any) {
              pushDbg(`✗ Mobile OTP exception: ${e?.message}`);
            }
          } else {
            pushDbg('Mobile: no token/code found.');
          }
        }

        // 5) Fallback: implicit flow tokens (rare but safe to keep)
        if (
          !sessionEstablished &&
          params.access_token &&
          params.refresh_token
        ) {
          pushDbg('=== Attempting token-based session ===');
          try {
            const { data, error } = await supabaseClient.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
            if (!error && data?.session) {
              pushDbg('✓ Token session successful!');
              sessionEstablished = true;
              if (isMounted) {
                setUserEmail(data.session.user?.email || null);
                setMode('reset');
                setHeaderStatus('Enter a new password to complete your reset.');
              }
            } else {
              pushDbg(`✗ Token session failed: ${error?.message}`);
            }
          } catch (e: any) {
            pushDbg(`✗ Token session exception: ${e?.message}`);
          }
        }

        // 6) Finalize
        pushDbg('=== Final Result ===');
        pushDbg(sessionEstablished ? '✓ SESSION ESTABLISHED' : '✗ NO SESSION');

        if (DEBUG) {
          console.log('[DEBUG RESET FLOW]\n' + debugMessages.join('\n'));
        }

        if (isMounted) {
          setDebugInfo(debugMessages.join('\n'));
          if (!sessionEstablished) {
            setHeaderStatus(
              'This reset link is invalid or expired. Please request a new password reset.'
            );
            setMode('request');
            setShowDebug(DEBUG);
          }
          setInitializing(false);
        }

        if (Platform.OS === 'web' && sessionEstablished) {
          try {
            stripAuthParamsFromWebLocation();
          } catch (e) {
            console.warn('URL cleanup failed:', e);
          }
        }
      } catch (e: any) {
        debugMessages.push('=== FATAL ERROR ===');
        debugMessages.push(e?.message || 'Unknown error');

        if (DEBUG) {
          console.log('[DEBUG RESET FLOW]\n' + debugMessages.join('\n'));
        }

        if (isMounted) {
          setDebugInfo(debugMessages.join('\n'));
          setHeaderStatus(
            'Could not process the reset link. Please try again.'
          );
          setMode('request');
          setInitializing(false);
          setShowDebug(DEBUG);
        }
      }
    };

    processReset();

    return () => {
      isMounted = false;
      setIsResettingPassword(false);
    };
  }, []);

  const onSave = async () => {
    setFieldError(null);

    if (!password || !password2) {
      setFieldError('Please enter and confirm your new password.');
      return;
    }
    if (password.length < 8) {
      setFieldError('Password must be at least 8 characters.');
      return;
    }
    if (password !== password2) {
      setFieldError('Passwords do not match. Please re-enter.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await AuthService.updatePassword(password);
      if (error) throw error;

      setIsResettingPassword(false);
      if (userEmail) {
        try {
          const { error: signInError } = await signIn(userEmail, password);
          if (!signInError) {
            router.replace('/(tabs)');
            return;
          }
        } catch (signInError) {
          console.warn('Auto sign-in failed:', signInError);
        }
      }

      setModalInfo({
        visible: true,
        title: 'Password Updated',
        subtitle:
          'Your password has been changed successfully. Please sign in with your new password.',
        emoji: '✅',
      });

      setPassword('');
      setPassword2('');
      setShowPass(false);
      setShowConfirm(false);
    } catch (e: any) {
      console.error('Password update failed:', e);
      setModalInfo({
        visible: true,
        title: 'Error',
        subtitle:
          e?.message ||
          'Failed to update password. Please try again with a fresh link.',
        emoji: '❌',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleModalClose = () => {
    setModalInfo((m) => ({ ...m, visible: false }));
  };

  const showMatchHint = password.length > 0 && password2.length > 0;

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  // Request mode - show link to request new reset
  if (mode === 'request') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>Reset Password</Text>
              {!!headerStatus && (
                <Text style={styles.subheaderText}>{headerStatus}</Text>
              )}
            </View>

            {/* Debug info box */}
            {showDebug && (
              <View style={styles.debugBox}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <ScrollView style={{ maxHeight: 200 }}>
                  <Text selectable style={styles.debugText}>
                    {debugInfo}
                  </Text>
                </ScrollView>
                <TouchableOpacity
                  onPress={() => Alert.alert('Debug Info', debugInfo)}
                  style={styles.debugButton}
                >
                  <Text style={styles.debugButtonText}>Show Full Debug</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.formContainer}>
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>Request Password Reset</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>

        <ThemedText style={{ fontSize: 14, textAlign: 'center', margin: 24 }}>
          <Text style={{ fontWeight: 'bold' }}>SmartBites</Text>
          <Text>™ © 2025</Text>
        </ThemedText>
      </SafeAreaView>
    );
  }

  // Reset mode - show password form
  return (
    <SafeAreaView style={styles.container}>
      {modalInfo.visible && (
        <Modal
          transparent
          animationType="fade"
          visible={modalInfo.visible}
          onRequestClose={handleModalClose}
        >
          <TouchableWithoutFeedback onPress={handleModalClose}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                {modalInfo.emoji && (
                  <Text style={styles.emoji}>{modalInfo.emoji}</Text>
                )}
                <Text style={styles.modalTitle}>{modalInfo.title}</Text>
                {!!modalInfo.subtitle && (
                  <Text style={styles.modalSubtitle}>{modalInfo.subtitle}</Text>
                )}
                <View style={{ height: Spacing.md }} />
                <TouchableOpacity
                  onPress={handleModalClose}
                  style={styles.modalCloseBtn}
                >
                  <Text style={styles.modalCloseText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      <DismissWrapper
        {...(Platform.OS !== 'web'
          ? { onPress: Keyboard.dismiss, accessible: false }
          : {})}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>Reset Password</Text>
              {!!headerStatus && (
                <Text style={styles.subheaderText}>{headerStatus}</Text>
              )}
            </View>

            {/* Debug info box */}
            {showDebug && (
              <View style={styles.debugBox}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <ScrollView style={{ maxHeight: 200 }}>
                  <Text style={styles.debugText}>{debugInfo}</Text>
                </ScrollView>
                <TouchableOpacity
                  onPress={() => Alert.alert('Debug Info', debugInfo)}
                  style={styles.debugButton}
                >
                  <Text style={styles.debugButtonText}>Show Full Debug</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.form}>
              {/* New Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                    placeholder="Enter new password"
                    placeholderTextColor="#6A7679"
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (fieldError) setFieldError(null);
                    }}
                    style={styles.input}
                    textContentType="newPassword"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPass((v) => !v)}
                  >
                    {showPass ? (
                      <EyeOff size={20} color={theme.textSecondary} />
                    ) : (
                      <Eye size={20} color={theme.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    placeholder="Re-enter new password"
                    placeholderTextColor="#6A7679"
                    value={password2}
                    onChangeText={(t) => {
                      setPassword2(t);
                      if (fieldError) setFieldError(null);
                    }}
                    style={styles.input}
                    textContentType="newPassword"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowConfirm((v) => !v)}
                  >
                    {showConfirm ? (
                      <EyeOff size={20} color={theme.textSecondary} />
                    ) : (
                      <Eye size={20} color={theme.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Match hint */}
                {showMatchHint && (
                  <Text
                    style={
                      password === password2 ? styles.matchOk : styles.matchNo
                    }
                  >
                    {password === password2
                      ? '✅ Passwords match'
                      : 'Passwords do not match'}
                  </Text>
                )}

                {!!fieldError && (
                  <Text style={styles.errorText}>{fieldError}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={onSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Save New Password</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Link expired?</Text>
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text style={styles.footerLink}> Request a new reset</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </DismissWrapper>

      <ThemedText style={{ fontSize: 14, textAlign: 'center', margin: 24 }}>
        <Text style={{ fontWeight: 'bold' }}>SmartBites</Text>
        <Text>™ © 2025</Text>
      </ThemedText>
    </SafeAreaView>
  );
}

const getStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    scrollContent: {
      flexGrow: 1,
      padding: Spacing.lg,
      alignItems: 'center',
    },
    contentContainer: {
      width: '100%',
      maxWidth: 768,
      alignSelf: 'center',
    },
    backButton: {
      alignSelf: 'flex-start',
      marginBottom: Spacing.sm,
    },
    backButtonText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.md,
      color: theme.primary,
    },
    headerContainer: {
      marginBottom: Spacing.xl,
      alignItems: 'center',
    },
    headerText: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.xxxl,
      color: theme.primary,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    subheaderText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.md,
      color: theme.accentDark,
      textAlign: 'center',
      paddingHorizontal: Spacing.md,
    },
    debugBox: {
      backgroundColor: '#f5f5f5',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 12,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.lg,
    },
    debugTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: FontSizes.sm,
      color: '#333',
      marginBottom: 8,
    },
    debugText: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 11,
      color: '#555',
      lineHeight: 16,
    },
    debugButton: {
      marginTop: 8,
      backgroundColor: '#007AFF',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    debugButtonText: {
      color: 'white',
      fontSize: FontSizes.xs,
      fontFamily: Fonts.bodyBold,
    },
    formContainer: {
      marginTop: Spacing.md,
    },
    form: {
      marginTop: Spacing.md,
      width: '100%',
    },
    inputContainer: {
      marginBottom: Spacing.lg,
    },
    label: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.sm,
      color: theme.accentDark,
      marginBottom: Spacing.xs,
    },
    passwordRow: {
      position: 'relative',
      width: '100%',
    },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'android' ? 10 : 8,
      fontFamily: Fonts.body,
      fontSize: FontSizes.md,
      backgroundColor: theme.backgroundLight,
      width: '100%',
      paddingRight: 44,
      color: theme.textPrimary,
    },
    eyeBtn: {
      position: 'absolute',
      right: 10,
      top: 10,
      padding: 8,
    },
    matchOk: {
      marginTop: Spacing.xs,
      fontFamily: Fonts.body,
      fontSize: FontSizes.sm,
      color: '#2e7d32',
    },
    matchNo: {
      marginTop: Spacing.xs,
      fontFamily: Fonts.body,
      fontSize: FontSizes.sm,
      color: theme.error,
    },
    errorText: {
      marginTop: Spacing.xs,
      fontFamily: Fonts.body,
      fontSize: FontSizes.sm,
      color: theme.error,
    },
    button: {
      backgroundColor: theme.primary,
      height: 54,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    buttonText: {
      color: theme.textWhite,
      fontFamily: Fonts.bodyBold,
      fontSize: FontSizes.md,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: Spacing.xl,
      flexWrap: 'wrap',
    },
    footerText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.md,
      color: theme.accentDark,
    },
    footerLink: {
      fontFamily: Fonts.bodyBold,
      fontSize: FontSizes.md,
      color: theme.primary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: 'white',
      padding: 24,
      borderRadius: 12,
      width: '80%',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
    emoji: {
      fontSize: 40,
      marginBottom: 12,
    },
    modalTitle: {
      fontFamily: Fonts.headingBold,
      fontSize: FontSizes.lg,
      color: '#222',
      marginBottom: 8,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.md,
      color: '#555',
      textAlign: 'center',
    },
    modalCloseBtn: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    modalCloseText: {
      color: theme.textWhite,
      fontFamily: Fonts.bodyBold,
      fontSize: FontSizes.md,
    },
  });
