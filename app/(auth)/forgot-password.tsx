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
import { Link, useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseTokensFromUrl(rawUrl: string | null) {
  if (!rawUrl) return {};
  try {
    const url = new URL(rawUrl);
    const hash = (url.hash || '').replace(/^#/, '');
    const h = new URLSearchParams(hash);
    const q = url.searchParams;

    const code = q.get('code') || h.get('code') || undefined;
    const access_token =
      h.get('access_token') || q.get('access_token') || undefined;
    const refresh_token =
      h.get('refresh_token') || q.get('refresh_token') || undefined;

    return { code, access_token, refresh_token };
  } catch {
    return {};
  }
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors: theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  // Modes: "request" (email form) or "reset" (password form, when opened from email link)
  const [mode, setMode] = useState<'request' | 'reset'>('request');
  const [initializing, setInitializing] = useState(true);

  // Request mode state
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  // Reset mode state
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Shared modal
  const [modalInfo, setModalInfo] = useState<ModalInfo>({
    visible: false,
    title: '',
  });

  const WEB_ORIGIN = 'https://smartbites.food';

  const RESET_REDIRECT = Platform.select({
    web: `${WEB_ORIGIN}/reset-password`,
    default: 'smartbites://reset-password', // Direct deep link for mobile
  })!;

  // Detect if we arrived with a Supabase recovery link; if yes, exchange for a session and switch to reset mode
  useEffect(() => {
    (async () => {
      try {
        const initialUrl =
          Platform.OS === 'web'
            ? window.location.href
            : (await Linking.getInitialURL()) ?? '';

        const { code, access_token, refresh_token } =
          parseTokensFromUrl(initialUrl);

        if (code) {
          const { error } = await AuthService.exchangeCodeForSession(code);
          if (error) throw error;
          setMode('reset');
        } else if (access_token && refresh_token) {
          const { error } = await AuthService.setSession(
            access_token,
            refresh_token
          );
          if (error) throw error;
          setMode('reset');
        } else {
          // No tokens — stay in request mode
          setMode('request');
        }

        // Clean the URL on web
        if (Platform.OS === 'web') {
          const cleanUrl = `${window.location.origin}${window.location.pathname}`;
          window.history.replaceState({}, '', cleanUrl);
        }
      } catch {
        // If token exchange fails, fall back to request mode
        setMode('request');
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  // --- Request mode: send email ---
  const handleSendEmail = async () => {
    const trimmed = email.trim();

    if (!trimmed) {
      setModalInfo({
        visible: true,
        title: 'Missing Email',
        subtitle: 'Please enter your email address.',
        emoji: '📧',
      });
      return;
    }
    if (!emailRegex.test(trimmed)) {
      setModalInfo({
        visible: true,
        title: 'Invalid Email',
        subtitle: 'Please enter a valid email address.',
        emoji: '📧',
      });
      return;
    }

    setSending(true);
    try {
      console.log('🔗 RESET_REDIRECT URL:', RESET_REDIRECT);
      const { error } = await AuthService.resetPasswordForEmail(
        trimmed,
        RESET_REDIRECT
      );
      if (error) throw error;

      setModalInfo({
        visible: true,
        title: 'Recovery Email Sent! 📧',
        subtitle:
          'Check your email for a link to reset your password. The link typically expires in about an hour.',
        emoji: '✅',
      });
    } catch (e: any) {
      setModalInfo({
        visible: true,
        title: 'Error',
        subtitle: e?.message ?? 'Failed to send recovery email',
        emoji: '❌',
      });
    } finally {
      setSending(false);
    }
  };

  // --- Reset mode: update password (👁️ + matching check) ---
  const handleUpdatePassword = async () => {
    if (!password || !confirm) {
      setModalInfo({
        visible: true,
        title: 'Missing Password',
        subtitle: 'Please enter and confirm your new password.',
        emoji: '🔐',
      });
      return;
    }
    if (password.length < 8) {
      setModalInfo({
        visible: true,
        title: 'Too Short',
        subtitle: 'Password must be at least 8 characters.',
        emoji: '🙅‍♀️',
      });
      return;
    }
    if (password !== confirm) {
      setModalInfo({
        visible: true,
        title: 'Passwords Do Not Match',
        subtitle: 'Please re-enter your new password.',
        emoji: '⚠️',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await AuthService.updatePassword(password);
      if (error) throw error;

      // Optional: Sign out recovery session so user signs in fresh
      await AuthService.signOut();

      setModalInfo({
        visible: true,
        title: 'Password Updated 🔐',
        subtitle: 'You can now sign in with your new password.',
        emoji: '✅',
      });
    } catch (e: any) {
      setModalInfo({
        visible: true,
        title: 'Error',
        subtitle: e?.message ?? 'Failed to update password. Please try again.',
        emoji: '❌',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleModalClose = () => {
    const success =
      modalInfo.title.startsWith('Recovery Email Sent') ||
      modalInfo.title.startsWith('Password Updated');
    setModalInfo((m) => ({ ...m, visible: false }));
    if (success) {
      // After either success, head back to login
      router.replace('/login');
    }
  };

  if (initializing) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator />
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
              <Text style={styles.headerText}>
                {mode === 'request' ? 'Forgot Password?' : 'Reset Password'}
              </Text>
              <Text style={styles.subheaderText}>
                {mode === 'request'
                  ? "Enter your email and we'll send you reset instructions."
                  : 'Enter your new password below.'}
              </Text>
            </View>

            <View style={styles.formContainer}>
              {mode === 'request' ? (
                <>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    placeholder="you@example.com"
                    placeholderTextColor={theme.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    onSubmitEditing={handleSendEmail}
                    style={styles.input}
                  />

                  <TouchableOpacity
                    style={[styles.primaryButton, sending && { opacity: 0.6 }]}
                    onPress={handleSendEmail}
                    disabled={sending}
                  >
                    {sending ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        Send Reset Link
                      </Text>
                    )}
                  </TouchableOpacity>

                  <View style={{ height: Spacing.md }} />

                  <Link href="/login" asChild>
                    <TouchableOpacity>
                      <Text style={styles.linkInline}>Back to Sign In</Text>
                    </TouchableOpacity>
                  </Link>
                </>
              ) : (
                <>
                  {/* New Password */}
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new password"
                      placeholderTextColor={theme.textTertiary}
                      secureTextEntry={!showPass}
                      value={password}
                      onChangeText={setPassword}
                      autoCapitalize="none"
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

                  {/* Confirm */}
                  <Text style={[styles.label, { marginTop: Spacing.md }]}>
                    Confirm Password
                  </Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter new password"
                      placeholderTextColor={theme.textTertiary}
                      secureTextEntry={!showConfirm}
                      value={confirm}
                      onChangeText={setConfirm}
                      autoCapitalize="none"
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

                  <TouchableOpacity
                    style={[styles.primaryButton, saving && { opacity: 0.6 }]}
                    onPress={handleUpdatePassword}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        Update Password
                      </Text>
                    )}
                  </TouchableOpacity>

                  <View style={{ height: Spacing.md }} />

                  <Link href="/login" asChild>
                    <TouchableOpacity>
                      <Text style={styles.linkInline}>Back to Sign In</Text>
                    </TouchableOpacity>
                  </Link>
                </>
              )}
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
      paddingHorizontal: Spacing.xs,
    },
    backButtonText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.md,
      color: theme.primary,
    },
    headerContainer: {
      marginBottom: Spacing.xl,
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
    },
    headerText: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.xxxl,
      color: theme.primary,
      marginBottom: Spacing.xs,
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
      width: '100%',
    },

    label: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.sm,
      color: theme.accentDark,
      marginBottom: Spacing.xs,
    },
    input: {
      minHeight: 52,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'android' ? 10 : 8,
      fontFamily: Fonts.body,
      fontSize: FontSizes.md,
      backgroundColor: theme.backgroundLight,
      color: theme.textPrimary,
      paddingRight: 44, // space for 👁️ button in reset mode
      width: '100%',
      marginBottom: Spacing.md,
    },
    passwordRow: {
      position: 'relative',
      width: '100%',
    },
    eyeBtn: {
      position: 'absolute',
      right: 10,
      top: 12,
      padding: 8,
    },

    primaryButton: {
      backgroundColor: theme.primary,
      height: 54,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    primaryButtonText: {
      color: theme.textWhite,
      fontFamily: Fonts.bodyBold,
      fontSize: FontSizes.md,
    },

    linkInline: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.md,
      color: theme.primary,
      textAlign: 'center',
      textDecorationLine: 'underline',
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
      width: '90%',
      maxWidth: 420,
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
  });
