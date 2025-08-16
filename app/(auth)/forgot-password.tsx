import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  View,
  Platform,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Spacing } from '@/constants/Spacing';
import { Fonts, FontSizes } from '@/constants/Typography';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, ColorScheme } from '@/constants/Colors';
import ThemedText from '@/components/ThemedText';
//import { account } from '@/libs/appwrite/config';
import * as Device from 'expo-device';

export type ModalInfo = {
  visible: boolean;
  title: string;
  subtitle?: string;
  emoji?: string;
};

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalInfo, setModalInfo] = useState<ModalInfo>({
    visible: false,
    title: '',
  });

  const router = useRouter();
  const { colors: theme } = useTheme();

  // ✅ Fix: memoize styles so they don't re-generate every render
  const styles = useMemo(() => getStyles(theme), [theme]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!email) {
      setModalInfo({
        visible: true,
        title: 'Missing Email',
        subtitle: 'Please enter your email address.',
        emoji: '📧',
      });
      return;
    }

    if (!validateEmail(email)) {
      setModalInfo({
        visible: true,
        title: 'Invalid Email',
        subtitle: 'Please enter a valid email address.',
        emoji: '📧',
      });
      return;
    }

    setSubmitting(true);
    try {
      const resetUrl = 'https://smartbites.cooking/reset-password';
      // Platform.OS === 'web'
      //   ? __DEV__
      //     ? 'http://localhost:8081/reset-password'
      //     : 'https://smartbites.cooking/reset-password'
      //   : isSimulator && __DEV__
      //   ? 'http://localhost:8081/reset-password'
      //   : 'https://smartbites.cooking/reset-password';

      console.log('Preview origin:', resetUrl);

      //await account.createRecovery(email, resetUrl);

      setModalInfo({
        visible: true,
        title: 'Recovery Email Sent! 📧',
        subtitle:
          'Check your email for password reset instructions. The link will expire in 1 hour.',
        emoji: '✅',
      });
    } catch (error: any) {
      const message =
        error?.message?.replace(/^AppwriteException:\s*/, '') ??
        'Failed to send recovery email';
      setModalInfo({
        visible: true,
        title: 'Error',
        subtitle: message,
        emoji: '❌',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setModalInfo({ ...modalInfo, visible: false });
    if (modalInfo.title.includes('Recovery Email Sent')) {
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
                {modalInfo.subtitle && (
                  <Text style={styles.modalSubtitle}>{modalInfo.subtitle}</Text>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back to Login</Text>
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>Forgot Password?</Text>
            <Text style={styles.subheaderText}>
              No worries! Enter your email and we'll send you reset
              instructions.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                autoCapitalize="none"
                placeholder="Enter your email"
                style={styles.input}
                keyboardType="email-address"
                placeholderTextColor="#6A7679"
                value={email}
                onChangeText={setEmail}
                autoCorrect={false}
                onSubmitEditing={handleSubmit}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      <ThemedText style={{ fontSize: 14, textAlign: 'center', margin: 24 }}>
        <Text style={{ fontWeight: 'bold' }}>SmartBites</Text>
        <Text>™ © 2025</Text>
      </ThemedText>
    </SafeAreaView>
  );
}

const getStyles = (theme: typeof ColorScheme.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    scrollContent: {
      flexGrow: 1,
      padding: Spacing.lg,
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
      color: Colors.dark[500],
      textAlign: 'center',
      paddingHorizontal: Spacing.md,
    },
    formContainer: {
      marginTop: Spacing.md,
    },
    inputContainer: {
      marginBottom: Spacing.lg,
    },
    label: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.sm,
      color: Colors.dark[700],
      marginBottom: Spacing.xs,
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
      color: Colors.white,
      fontFamily: Fonts.bodyBold,
      fontSize: FontSizes.md,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: Spacing.xl,
    },
    footerText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.md,
      color: Colors.dark[700],
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
  });
