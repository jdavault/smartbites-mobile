// app/(auth)/forgot-password.tsx
import React, { useMemo, useState, Fragment } from 'react';
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors: theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [modalInfo, setModalInfo] = useState<ModalInfo>({
    visible: false,
    title: '',
  });

  const RESET_REDIRECT = Platform.select({
    // Web: go straight to the web reset page (keeps your good web flow)
    web:
      typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : 'https://smartbites.food/reset-password',

    // Native: go straight into the app via custom scheme (no /recover hop)
    default: Linking.createURL('/reset-password'), // => smartbites://reset-password
  })!;

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
      // This triggers Supabase to send a magic recovery link that lands on RESET_REDIRECT
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

  const handleModalClose = () => {
    const success = modalInfo.title.startsWith('Recovery Email Sent');
    setModalInfo((m) => ({ ...m, visible: false }));
    if (success) {
      router.replace('/login');
    }
  };

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
              <Text style={styles.headerText}>Forgot Password?</Text>
              <Text style={styles.subheaderText}>
                Enter your email and we&apos;ll send you reset instructions.
              </Text>
            </View>

            <View style={styles.formContainer}>
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
                  <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>

              <View style={{ height: Spacing.md }} />

              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkInline}>Back to Sign In</Text>
                </TouchableOpacity>
              </Link>
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
      paddingRight: 14,
      width: '100%',
      marginBottom: Spacing.md,
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
