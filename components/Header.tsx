import React from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import {
  useTheme,
  SPACING,
  RADIUS,
  SHADOWS,
  FONT_SIZES,
} from '@/contexts/ThemeContext';

type HeaderProps = {
  title: string;
  subtitle: string;
};

export default function Header({ title, subtitle }: HeaderProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.xxl,

      paddingTop: Platform.select({
        android: SPACING.xxl,
        ios: SPACING.sm,
        web: SPACING.sm,
      }),
      paddingBottom: Platform.select({
        android: SPACING.sm,
        ios: SPACING.sm,
        web: SPACING.md,
      }),
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerContent: { flex: 1 },
    headerTitle: {
      fontSize: FONT_SIZES.xl,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
      marginBottom: Platform.select({ android: 2, ios: 2, web: SPACING.xs }),
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
    },
    headerLogoContainer: { alignItems: 'center', position: 'relative' },
    headerLogo: { width: 64, height: 64 },
    betaBadge: {
      position: 'absolute',
      top: -2,
      right: -6,
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: RADIUS.sm,
      ...SHADOWS.sm,
    },
    betaBadgeText: {
      fontSize: 9,
      fontFamily: 'Inter-Bold',
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.headerLogoContainer}>
        <Image
          source={require('@/assets/images/smart-bites-logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        {/* {Platform.OS !== 'web' && (
          <View style={styles.betaBadge}>
            <Text style={styles.betaBadgeText}>Beta</Text>
          </View>
        )} */}
      </View>
    </View>
  );
}
