import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StyleSheet as RNStyleSheet,
  KeyboardAvoidingView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { Spacing } from '@/constants/Spacing';
import { Fonts, FontSizes } from '@/constants/Typography';
import ThemedText from '@/components/ThemedText';

type ModalInfo = {
  visible: boolean;
  title: string;
  subtitle?: string;
  emoji?: string;
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [modalInfo, setModalInfo] = useState<ModalInfo>({
    visible: false,
    title: '',
    subtitle: '',
    emoji: undefined,
  });

  const { signIn /*, signInWithGoogle */ } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);

  const openModal = (info: Omit<ModalInfo, 'visible'>) =>
    setModalInfo({ ...info, visible: true });
  const closeModal = () => setModalInfo((m) => ({ ...m, visible: false }));

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      openModal({
        title: 'Missing Fields',
        subtitle: 'Please fill in all fields before continuing.',
        emoji: '📝',
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting login for:', email.trim());
      const { error } = await signIn(email.trim(), password);

      if (error) {
        console.error('Login error:', error);
        openModal({
          title: 'Login Failed',
          subtitle: error.message || 'Please try again.',
          emoji: '🚫',
        });
      } else {
        console.log('Login successful, redirecting...');
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('Unexpected login error:', err);
      openModal({
        title: 'Unexpected Error',
        subtitle: 'Something went wrong. Please try again.',
        emoji: '⚠️',
      });
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Background */}
      <LinearGradient
        colors={[colors.background, colors.textRice]}
        style={RNStyleSheet.absoluteFillObject}
      />

      {/* Modal */}
      {modalInfo.visible && (
        <Modal
          transparent
          animationType="fade"
          visible={modalInfo.visible}
          onRequestClose={closeModal}
        >
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                {modalInfo.emoji ? (
                  <Text style={styles.emoji}>{modalInfo.emoji}</Text>
                ) : null}
                <Text style={styles.modalTitle}>{modalInfo.title}</Text>
                {!!modalInfo.subtitle && (
                  <Text style={styles.modalSubtitle}>{modalInfo.subtitle}</Text>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Link href="/(auth)" asChild>
                <TouchableOpacity style={styles.backButton}>
                  <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </Link>
            </View>

            {/* Main */}
            <View style={styles.main}>
              <Text style={styles.brandTitle}>SmartBites™</Text>
              <Text style={styles.subtitle}>
                Sign in to continue your culinary journey
              </Text>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color={colors.textSecondary} />
                      ) : (
                        <Eye size={20} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Google => "coming soon" modal */}
                  <TouchableOpacity
                    style={styles.googleButton}
                    onPress={() =>
                      openModal({
                        title: 'Google Login Not Available',
                        subtitle: "We're working on it — coming soon!",
                        emoji: '😔',
                      })
                    }
                    disabled={loading}
                  >
                    <Text style={styles.googleButtonText}>
                      Continue with Google
                    </Text>
                  </TouchableOpacity>

                  {/* Sign up */}
                  <View className="signupRow" style={styles.signupRow}>
                    <Text style={styles.footerText}>
                      Don&apos;t have an account?{' '}
                    </Text>
                    <Link href="/(auth)/register" asChild>
                      <TouchableOpacity>
                        <Text style={styles.footerLink}>Sign Up</Text>
                      </TouchableOpacity>
                    </Link>
                  </View>

                  <View style={styles.forgotPasswordContainer}>
                    <Link href="/(auth)/forgot-password" asChild>
                      <TouchableOpacity>
                        <Text style={styles.forgotPasswordLink}>
                          Forgot Password?
                        </Text>
                      </TouchableOpacity>
                    </Link>
                  </View>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <ThemedText style={styles.copyright}>
                <Text style={{ fontWeight: 'bold' }}>SmartBites</Text>
                <Text>™ © 2025</Text>
              </ThemedText>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (colors: ThemeColors, insets: { bottom: number }) =>
  StyleSheet.create({
    content: {
      flex: 1,
      paddingHorizontal: 24,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 16,
      paddingBottom: 32,
    },
    backButton: { padding: 8 },

    main: {
      flex: 1,
    },

    brandTitle: {
      fontSize: 47,
      fontFamily: 'Inter-Bold',
      color: '#FF8866',
      textAlign: 'center',
      marginBottom: 15,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: Fonts.heading,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 40,
    },

    form: { gap: 20 },
    actions: { gap: 8 },
    inputContainer: { gap: 8 },

    label: {
      fontSize: 16,
      fontFamily: Fonts.bodyBold,
      color: colors.textSecondary,
    },
    input: {
      height: 50,
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: Spacing.sm,
      paddingHorizontal: Spacing.md,
      fontFamily: Fonts.body,
      fontSize: FontSizes.md,
      color: colors.textPrimary,
      backgroundColor: colors.textWhite,
    },

    passwordInputContainer: {
      height: 50,
      borderColor: colors.accent,
      borderRadius: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      backgroundColor: colors.textWhite,
    },
    passwordInput: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: Spacing.md,
      fontFamily: Fonts.body,
      fontSize: FontSizes.md,
      color: colors.textPrimary,
    },
    eyeButton: { padding: 12 },

    button: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: {
      fontSize: 16,
      fontFamily: Fonts.headingBold,
      color: '#FFFFFF',
    },

    googleButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    googleButtonText: {
      color: colors.textSecondary,
      fontFamily: Fonts.heading,
      fontSize: FontSizes.md,
    },

    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: Spacing.md,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.accent },
    dividerText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.sm,
      color: colors.accentLight,
      marginHorizontal: Spacing.md,
    },

    signupRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    footerText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    footerLink: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },

    forgotPasswordContainer: {
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    forgotPasswordLink: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.sm,
      color: colors.primary,
      textDecorationLine: 'underline',
    },

    footer: {
      paddingTop: 8,
      paddingBottom: insets.bottom + 24,
      paddingHorizontal: 24,
    },
    copyright: {
      fontSize: 14,
      textAlign: 'center',
    },

    // Modal styles (mirrors your old look/feel)
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      padding: 24,
      borderRadius: 12,
      width: '80%',
      maxWidth: 420,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
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
    emoji: {
      fontSize: 40,
      marginBottom: 12,
    },
  });
