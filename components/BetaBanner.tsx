// components/BetaBanner.tsx
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

type BetaBannerProps = {
  enabled?: boolean;
  webOnly?: boolean;
  message?: string;
};

export default function BetaBanner({
  enabled = true,
  webOnly = false,
  message = 'Currently in beta — thanks for testing!',
}: BetaBannerProps) {
  const { colors } = useTheme();

  // Don't render if disabled
  if (!enabled) return null;

  // Don't render on native if webOnly is true
  if (webOnly && Platform.OS !== 'web') return null;

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      gap: 8,
    },
    badge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: 11,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    message: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Beta</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}
