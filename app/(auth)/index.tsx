import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  useWindowDimensions,
  Linking,
  Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedLogo from '@/components/ThemedLogo';
import { Spacing } from '@/constants/Spacing';
import { Fonts, FontSizes } from '@/constants/Typography';

export default function SplashScreen() {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, height, insets);

  const logoAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.textRice]}
        style={styles.gradient}
      >
        {/* New column wrapper spaces top/middle/bottom */}
        <View style={styles.column}>
          {/* Top: logo + subtitle*/}
          <View style={styles.topGroup}>
            <Animated.View
              style={[styles.logoContainer, { opacity: logoAnim }]}
            >
              <ThemedLogo />
            </Animated.View>

            <Animated.Text
              style={[styles.subtitleTight, { opacity: buttonsAnim }]}
            >
              AI-powered recipes + allergy aware restaurant menu search so you
              can dine in or dine out with confidence.
            </Animated.Text>
          </View>
          {/* Middle: app store block (web only) + your CTA buttons */}
          <View style={{ width: '100%', alignItems: 'center' }}>
            {Platform.OS === 'web' && (
              <Animated.View
                style={[styles.appStoreContainer, { opacity: buttonsAnim }]}
              >
                <Text
                  style={[styles.appStoreTitle, { color: colors.textPrimary }]}
                >
                  Get the SmartBites™ Mobile App
                </Text>
                <Text
                  style={[
                    styles.appStoreSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Download for the best experience on your phone
                </Text>

                <View style={styles.storeButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.storeButton,
                      { backgroundColor: colors.card },
                    ]}
                    onPress={() =>
                      Linking.openURL(
                        'https://apps.apple.com/app/smartbites/id6745743999'
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.storeButtonText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      📱 Download for iPhone
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.storeButton,
                      { backgroundColor: colors.card },
                    ]}
                    onPress={() =>
                      Linking.openURL(
                        'https://play.google.com/store/apps/details?id=cooking.safeplate.allergyawarerecipefinder'
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.storeButtonText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      🤖 Download for Android
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* <View style={styles.webContinueContainer}>
                  <Text
                    style={[
                      styles.webContinueText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Or continue using the web version below
                  </Text>
                </View> */}
              </Animated.View>
            )}

            {/* Your existing “Sign In / Create Account” buttons */}
            {Platform.OS !== 'web' && (
              <View style={styles.buttonContainer}>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                  </TouchableOpacity>
                </Link>

                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>
                      Create Account
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            )}
          </View>

          {/* Bottom: footer links (flex pushes this down) */}
          <View style={styles.footer}>
            <Link href="/(auth)/about" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>About</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(auth)/contact" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Contact</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(auth)/support" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Support</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors, height: number, insets: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    column: {
      flex: 1,
      width: '100%',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },

    // Keep the subtitle snug to the logo
    topGroup: {
      alignItems: 'center',
      gap: 6, // keep these two close; if 'gap' not available, use marginTop on subtitle
    },

    subtitleTight: {
      textAlign: 'center',
      // tighten spacing to the logo:
      marginTop: 6, // small gap under the logo
      // and *reduce* the push toward the middle:
      marginBottom: 8, // was large (e.g., 48)
      fontFamily: 'Lato-Regular',
      fontSize: 18,
      color: colors.textSecondary,
      lineHeight: 24,
    },

    // Give the middle block its own breathing room from the subtitle
    middleGroup: {
      width: '100%',
      alignItems: 'center',
      marginTop: 12, // bump if you want more separation
    },

    // (optional) ensure appStoreContainer itself doesn't add extra top margin
    appStoreContainer: {
      // ...existing styles...
      marginTop: Spacing.sm, // keep modest
    },
    mainShift: {
      width: '100%',
      alignItems: 'center',
      transform: [{ translateY: -Math.min(height * 0.1, 72) }],
    },

    logoContainer: {
      marginTop: height * 0.08,
      alignItems: 'center',
    },
    appStoreContainer: {
      width: '100%',
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.md,
    },
    appStoreTitle: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.lg,
      textAlign: 'center',
      marginBottom: Spacing.xs,
    },
    appStoreSubtitle: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.sm,
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    storeButtonsContainer: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    storeButton: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 160,
      alignItems: 'center',
    },
    storeButtonText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.sm,
      textAlign: 'center',
    },
    webContinueContainer: { alignItems: 'center' },
    webContinueText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.sm,
      fontStyle: 'italic',
      textAlign: 'center',
    },

    gradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    logo: {
      width: 180,
      height: 180,
      marginBottom: 32,
      borderRadius: 24,
    },
    title: {
      fontSize: 32,
      fontFamily: 'Inter-Bold',
      color: '#FF8866',
      textAlign: 'center',
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 18,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 48,
      lineHeight: 24,
    },
    buttonContainer: { width: '100%', gap: 16 },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    primaryButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    secondaryButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },

    footer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      paddingHorizontal: Spacing.xl,
      paddingBottom: insets.bottom + 8,
      // position: 'absolute',
      // bottom: 40,
      // left: 0,
      // right: 0,
      // gap: 24,
    },
    footerLink: {
      fontSize: 14,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
      textDecorationLine: 'underline',
    },
  });
