// app/(auth)/reset-password.tsx
import React, { useEffect, useMemo, useState, Fragment } from 'react';
import {
  ActivityIndicator,
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
import { useRouter, Link } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing } from '@/constants/Spacing';
import { Fonts, FontSizes } from '@/constants/Typography';
import ThemedText from '@/components/ThemedText';
import { AuthService } from '@/services/authService';

type ModalInfo = {
  visible: boolean;
  title: string;
  subtitle?: string;
  emoji?: string;
};

const DismissWrapper =
  Platform.OS === 'web' ? (Fragment as any) : TouchableWithoutFeedback;

/**
 * Parse both query (?code=...) and hash (#access_token=...) params from:
 * - Web URLs (https://domain/reset-password?...#...)
 * - Deep links (smartbites://reset-password?...#...)
 * We DO NOT rewrite the scheme; we just parse strings safely.
 */
function parseTokensFromUrl(rawUrl: string | null) {
  if (!rawUrl) return { code: null, access_token: null, refresh_token: null };
  try {
    const qIndex = rawUrl.indexOf('?');
    const hIndex = rawUrl.indexOf('#');

    const queryStr =
      qIndex >= 0
        ? rawUrl.slice(qIndex + 1, hIndex >= 0 ? hIndex : undefined)
        : '';
    const hashStr = hIndex >= 0 ? rawUrl.slice(hIndex + 1) : '';

    const q = new URLSearchParams(queryStr);
    const h = new URLSearchParams(hashStr);

    const code = q.get('code') || h.get('code');
    const access_token = h.get('access_token') || q.get('access_token');
    const refresh_token = h.get('refresh_token') || q.get('refresh_token');

    return { code, access_token, refresh_token };
  } catch {
    return { code: null, access_token: null, refresh_token: null };
  }
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { colors: theme } = useTheme();
  const { signIn } = useAuth();
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

  const [modalInfo, setModalInfo] = useState<ModalInfo>({
    visible: false,
    title: '',
  });

  // --- Initialization: check URL for tokens and exchange into session ---
  useEffect(() => {
    (async () => {
      try {
        const initialUrl =
          Platform.OS === 'web'
            ? window.location.href
            : (await Linking.getInitialURL()) ?? '';

        const { code, access_token, refresh_token } =
          parseTokensFromUrl(initialUrl);

        let sessionEstablished = false;

        // Exchange if Supabase provided PKCE code or implicit tokens
        if (code || (access_token && refresh_token)) {
          const { data, error } = await AuthService.exchangeCodeForSession(
            initialUrl
          );
          if (error) {
            console.error('exchangeCodeForSession error:', error);
            setHeaderStatus(
              'This reset link is invalid or expired. Please request a new password reset.'
            );
            setMode('request');
            return;
          }
          if (data?.session) {
            sessionEstablished = true;
            setUserEmail(data.session.user?.email || null);
            setMode('reset');
            setHeaderStatus('Enter a new password to complete your reset.');
          }
        }

        // If no tokens present, see if we already have a session
        if (!sessionEstablished) {
          const { session, error: getErr } = await AuthService.getSession();
          if (getErr) {
            console.error('getSession error:', getErr);
            setHeaderStatus(
              'Could not validate session. Please request a new password reset.'
            );
            setMode('request');
            return;
          }
          if (!session) {
            setHeaderStatus(
              'This reset link is invalid or expired. Please request a new password reset from the Forgot Password page.'
            );
            setMode('request');
          } else {
            setUserEmail(session.user?.email || null);
            setMode('reset');
            setHeaderStatus('Enter a new password to complete your reset.');
          }
        }

        // Clean the URL on web to avoid re-processing on refresh
        if (Platform.OS === 'web') {
          const clean = `${window.location.origin}${window.location.pathname}`;
          window.history.replaceState({}, '', clean);
        }
      } catch (e: any) {
        console.error('Reset password init error:', e);
        setHeaderStatus(
          'Could not validate the reset link. Please request a new password reset.'
        );
        setMode('request');
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  // --- Native deep link handling while app is open ---
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleDeepLink = async ({ url }: { url: string }) => {
      try {
        const { code, access_token, refresh_token } = parseTokensFromUrl(url);
        if (!code && !(access_token && refresh_token)) return;

        const { data, error } = await AuthService.exchangeCodeForSession(url);
        if (error) {
          console.error('Deep link exchange error:', error);
          setHeaderStatus(
            'This reset link is invalid or expired. Please request a new password reset.'
          );
          setMode('request');
          return;
        }
        if (data?.session) {
          setUserEmail(data.session.user?.email || null);
          setMode('reset');
          setHeaderStatus('Enter a new password to complete your reset.');
        }
      } catch (e) {
        console.error('Deep link handling failed:', e);
        setHeaderStatus(
          'Could not validate the reset link. Please request a new password reset.'
        );
        setMode('request');
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
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

      // Optional: auto-sign-in so you can route back immediately
      if (userEmail) {
        const { error: signInError } = await signIn(userEmail, password);
        if (!signInError) {
          router.replace('/(tabs)');
          return;
        }
      }

      setModalInfo({
        visible: true,
        title: 'Password Updated 🔐',
        subtitle:
          'Your password has been changed successfully. Please sign in with your new password.',
        emoji: '✅',
      });

      setPassword('');
      setPassword2('');
      setShowPass(false);
      setShowConfirm(false);
    } catch (e: any) {
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

  // ✅ restore your live match hint
  const showMatchHint = password.length > 0 && password2.length > 0;

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  // If we're in request mode, show a message to go back to forgot password
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

              {/* Confirm */}
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

                {/* ✅ live match hint restored */}
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
    passwordRow: { position: 'relative', width: '100%' },
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
    // Modal styles
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
    emoji: { fontSize: 40, marginBottom: 12 },
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
