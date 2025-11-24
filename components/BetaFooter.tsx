// components/BetaFooter.tsx
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme, SPACING, FONT_SIZES } from '@/contexts/ThemeContext';

type BetaFooterProps = {
  enabled?: boolean;
  mobileOnly?: boolean;
  message?: string;
};

export default function BetaFooter({
  enabled = true,
  mobileOnly = true,
  message = 'Currently in beta — thanks for testing!',
}: BetaFooterProps) {
  const { colors } = useTheme();

  // Don't render if disabled
  if (!enabled) return null;

  // Don't render on web if mobileOnly is true
  if (mobileOnly && Platform.OS === 'web') return null;

  const styles = StyleSheet.create({
    footer: {
      paddingHorizontal: SPACING.xxl,
      paddingVertical: SPACING.sm,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>{message}</Text>
    </View>
  );
}
