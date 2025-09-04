import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Linking,
  Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
import ThemedLogo from '@/components/ThemedLogo';
import { Spacing } from '@/constants/Spacing';
import { Fonts, FontSizes } from '@/constants/Typography';

export default function SplashScreen() {
  const { colors } = useTheme();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, height, width, insets);

  // Responsive sizing for small mobile viewports
  const isMobileWeb = Platform.OS === 'web' && width <= 480;
  const isTabletWeb = Platform.OS === 'web' && width > 480 && width <= 768;
  const isDesktopWeb = Platform.OS === 'web' && width > 768;
  const isNativeMobile = Platform.OS !== 'web';
  
  // Logo sizing: much smaller for mobile web, normal for everything else
  const logoSize = isMobileWeb ? 120 : isTabletWeb ? 180 : isNativeMobile ? 200 : 300;

  // Responsive sizing for small mobile viewports
  const isMobileWeb = Platform.OS === 'web' && width <= 480;
  const isTabletWeb = Platform.OS === 'web' && width > 480 && width <= 768;
  const isDesktopWeb = Platform.OS === 'web' && width > 768;
  const isNativeMobile = Platform.OS !== 'web';
  
  // Logo sizing: much smaller for mobile web, normal for everything else
  const logoSize = isMobileWeb ? 120 : isTabletWeb ? 180 : isNativeMobile ? 200 : 300;

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
    <View style={{ flex: 1 }}>
      {/* Gradient is the true page background */}
      <LinearGradient
        colors={[colors.background, colors.textRice]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Only protect the top safe area; footer handles bottom inset */}
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Content wrapper restores page padding that used to be on the gradient */}
        <View style={styles.content}>
          <View style={styles.column}>
            {/* Top: logo + subtitle (kept close together) */}
            <View style={styles.topGroup}>
              <Animated.View
                style={[styles.logoContainer, { opacity: logoAnim }]}
              >
                <ThemedLogo width={logoSize} height={logoSize} />
              </Animated.View>

              <Animated.Text
                style={[styles.subtitleTight, { opacity: buttonsAnim }]}
              >
                AI-powered recipes + allergy aware restaurant menu search so you
                can dine in or dine out with confidence.
              </Animated.Text>
            </View>

            {/* Middle: app-store block on web, native CTAs on devices */}
            <View style={styles.middleGroup}>
              {Platform.OS === 'web' && (
                <Animated.View
                  style={[styles.appStoreContainer, { opacity: buttonsAnim }]}
                >
                  <Text
                    style={[
                      styles.appStoreTitle,
                      { color: colors.textPrimary },
                    ]}
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
                        🤖 Android (coming Sep 2025)
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {Platform.OS === 'web' && (
                    <View style={styles.webBetaContainer}>
                      <View style={styles.webBetaBadge}>
                        <Text style={styles.webBetaBadgeText}>Beta</Text>
                      </View>
                      <Text style={styles.webBetaText}>
                        Currently in beta — thanks for testing!
                      </Text>
                    </View>
                  )}
                </Animated.View>
              )}

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
            </View>

            {/* Bottom: footer links (column uses space-between to push this down) */}
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
        </View>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (colors: ThemeColors, height: number, width: number, insets: any) =>
  StyleSheet.create({
    // Restores the padding that used to live on the gradient
    content: {
      flex: 1,
      paddingHorizontal: 32,
      paddingTop: Spacing.md,
    },

    // Master vertical layout: top / middle / bottom
    column: {
      flex: 1,
      width: '100%',
      justifyContent: 'space-between',
      alignItems: 'center',
      maxWidth: 768,
      alignSelf: 'center',
    },

    // Top group (logo + subtitle close together)
    topGroup: {
      alignItems: 'center',
      // If RN version doesn't support 'gap', replace with subtitleTight.marginTop
      gap: 6,
    },
    logoContainer: {
      marginTop: width <= 768 ? height * 0.01 : height * 0.12,
      alignItems: 'center',
    },
    subtitleTight: {
      textAlign: 'center',
      marginTop: width <= 768 ? -20 : -8, // reduce space below logo
      marginBottom: width <= 768 ? 4 : 8, // more space before middle group
      fontFamily: 'Lato-Regular',
      fontSize: 18,
      color: colors.textSecondary,
      lineHeight: 24,
    },

    // Middle group wrapper
    middleGroup: {
      width: '100%',
      alignItems: 'center',
      marginTop: -4,
    },

    // Web-only app store section
    appStoreContainer: {
      width: '100%',
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
      marginTop: -8,
      marginBottom: 8,
    },
    appStoreTitle: {
      fontFamily: Fonts.heading,
      fontSize: isMobileWeb ? FontSizes.md : FontSizes.lg,
      textAlign: 'center',
      marginBottom: 4,
    },
    appStoreSubtitle: {
      fontFamily: Fonts.body,
      fontSize: isMobileWeb ? FontSizes.xs : FontSizes.sm,
      textAlign: 'center',
      marginBottom: 12,
    },
    storeButtonsContainer: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Platform.OS === 'web' ? Spacing.sm : Spacing.lg,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    storeButton: {
      paddingVertical: isMobileWeb ? 8 : width <= 768 ? 10 : Spacing.md,
      paddingHorizontal: isMobileWeb ? 10 : width <= 768 ? 14 : Spacing.lg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: isMobileWeb ? 110 : width <= 768 ? 130 : 160,
      alignItems: 'center',
    },
    storeButtonText: {
      fontFamily: Fonts.body,
      fontSize: isMobileWeb ? 10 : width <= 768 ? 12 : FontSizes.sm,
      textAlign: 'center',
    },

    // Native CTA buttons (Sign In / Create Account)
    buttonContainer: { 
      width: '100%', 
      gap: width <= 768 ? 12 : 16 
    },
    responsiveContainer: {
      width: '100%',
      maxWidth: 400,
      alignSelf: 'center',
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: width <= 768 ? 12 : 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      paddingVertical: width <= 768 ? 12 : 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    primaryButtonText: {
      fontSize: width <= 768 ? 14 : 16,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    secondaryButtonText: {
      fontSize: width <= 768 ? 14 : 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },

    // Footer pinned at the bottom; add bottom inset here (not on column)
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      paddingHorizontal: Spacing.xl,
      paddingBottom: insets.bottom + 8,
    },
    footerLink: {
      fontSize: 14,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
      textDecorationLine: 'underline',
    },
    webBetaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      gap: 8,
    },
    webBetaBadge: {
      backgroundColor: '#FF8866',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    webBetaBadgeText: {
      fontSize: 11,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    webBetaText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
  });