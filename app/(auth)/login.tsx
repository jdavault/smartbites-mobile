import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { Spacing } from '@/constants/Spacing';
import { Fonts, FontSizes } from '@/constants/Typography';
import ThemedText from '@/components/ThemedText';
import { Redirect } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  // if (Platform.OS === 'web') {
  //   return <Redirect href="/(auth)" />; // or a dedicated /download page
  // }
  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert('Error', 'Please fill in all fields');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) Alert.alert('Login Error', error.message);
    else router.replace('/(tabs)');
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert(
        'Google Login Error',
        error.message || 'Failed to sign in with Google'
      );
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Link href="/(auth)" asChild>
          <TouchableOpacity style={styles.backButton}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </Link>
      </View>

      {/* Main content (fills space) */}
      <View style={styles.content}>
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
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
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

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Sign up row stays near the Google button */}
            <View style={styles.signupRow}>
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

      {/* Bottom only shows SmartBites copyright */}
      <View style={styles.bottom}>
        <ThemedText style={styles.copyright}>
          <Text style={{ fontWeight: 'bold' }}>SmartBites</Text>
          <Text>™ © 2025</Text>
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 32,
    },
    backButton: { padding: 8 },

    // fills space between header and bottom
    content: {
      flex: 1,
      paddingHorizontal: 24,
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

    // Sign up row (near Google button)
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

    // Bottom anchored area (copyright only)
    bottom: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 24,
    },
    copyright: {
      fontSize: 14,
      textAlign: 'center',
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
  });
