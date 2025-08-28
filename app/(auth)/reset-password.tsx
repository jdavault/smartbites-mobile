// app/(auth)/reset-password.tsx
import React, { useEffect, useMemo, useState, Fragment, useRef } from 'react';
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
import { useRouter, Link, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing } from '@/constants/Spacing';
import { Fonts, FontSizes } from '@/constants/Typography';
import ThemedText from '@/components/ThemedText';
import { AuthService } from '@/services/authService';
import {
  parseTokensFromUrl,
  stripAuthParamsFromWebLocation,
} from '@/utils/authLink';

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
  const { url: urlParam } = useLocalSearchParams<{ url?: string }>();
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

  // Track last processed URL to avoid double-processing (cold start + event)
  const lastProcessedUrlRef = useRef<string | null>(null);

  // --- Initialization + runtime deep links: parse → exchange → set session ---
  useEffect(() => {
    let isMounted = true;

    const processUrl = async (rawUrl: string | null) => {
      if (!isMounted || !rawUrl) return;

      if (lastProcessedUrlRef.current === rawUrl) return;
      lastProcessedUrlRef.current = rawUrl;

      try {
        const { code, access_token, refresh_token } =
          parseTokensFromUrl(rawUrl);

        let sessionEstablished = false;

        // If Supabase sent tokens (PKCE code or implicit tokens), exchange the ORIGINAL url
        if (code || (access_token && refresh_token)) {
          const { data, error } = await AuthService.exchangeCodeForSession(
            rawUrl
          );
          if (error) {
            console.error('exchangeCodeForSession error:', error);
            if (!isMounted) return;
            setHeaderStatus(
              'This reset link is invalid or expired. Please request a new password reset.'
            );
            setMode('request');
            return;
          }
          if (data?.session) {
            sessionEstablished = true;
            if (!isMounted) return;
            setUserEmail(data.session.user?.email || null);
            setMode('reset');
            setHeaderStatus('Enter a new password to complete your reset.');
          }
        }

        // If we didn’t get a session from tokens, check existing session
        if (!sessionEstablished) {
          const { session, error: getErr } = await AuthService.getSession();
          if (getErr) {
            console.error('getSession error:', getErr);
            if (!isMounted) return;
            setHeaderStatus(
              'Could not validate session. Please request a new password reset.'
            );
            setMode('request');
            return;
          }
          if (!session) {
            if (!isMounted) return;
            setHeaderStatus(
              'This reset link is invalid or expired. Please request a new password reset from the Forgot Password page.'
            );
            setMode('request');
          } else {
            if (!isMounted) return;
            setUserEmail(session.user?.email || null);
            setMode('reset');
            setHeaderStatus('Enter a new password to complete your reset.');
          }
        }

        // Clean auth params from the address bar on web so refresh won’t re-process
        if (Platform.OS === 'web') {
          stripAuthParamsFromWebLocation();
        }
      } catch (e) {
        console.error('Reset password link handling error:', e);
        if (!isMounted) return;
        setHeaderStatus(
          'Could not validate the reset link. Please request a new password reset.'
        );
        setMode('request');
      } finally {
        if (isMounted) setInitializing(false);
      }
    };

    // 1) Initial URL (web or native cold start)
    if (Platform.OS === 'web') {
      processUrl(window.location.href);
    } else {
      const paramUrl =
        typeof urlParam === 'string' ? decodeURIComponent(urlParam) : null;
      if (paramUrl) {
        processUrl(paramUrl);
      } else {
        Linking.getInitialURL().then((url) => processUrl(url));
      }
    }

    // 2) Native runtime deep links
    let sub: { remove: () => void } | undefined;
    if (Platform.OS !== 'web') {
      sub = Linking.addEventListener('url', ({ url }) => processUrl(url));
    }

    return () => {
      isMounted = false;
      sub?.remove?.();
    };
  }, [urlParam]);

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

                {/* live match hint */}
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
