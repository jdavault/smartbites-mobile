// components/ScreenWithGradient.tsx
import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  SafeAreaView,
  useSafeAreaInsets,
  Edge,
} from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

type Props = {
  /** Optional slot above the middle content (e.g., logo + subtitle) */
  top?: ReactNode;
  /** Main content (e.g., app store block or CTA buttons) */
  middle?: ReactNode;
  /** Footer / bottom links (pinned by flex) */
  bottom?: ReactNode;
  /** For fully custom layouts, you can ignore the slots and pass children */
  children?: ReactNode;

  /** Override gradient colors, default = [colors.background, colors.textRice] */
  gradientColors?: string[];

  /** Page padding (horizontal); default 32 */
  paddingHorizontal?: number;
  /** Page padding (top, in addition to the top safe-area); default 12 */
  paddingTop?: number;

  /** Add bottom inset to the bottom slot; default true */
  bottomInset?: boolean;
  /** Extra bottom padding beneath inset; default 8 */
  bottomExtra?: number;

  /** Use ScrollView for the slot content (keeps footer at bottom with flexGrow) */
  scroll?: boolean;

  /** Style overrides */
  contentStyle?: StyleProp<ViewStyle>;
  columnStyle?: StyleProp<ViewStyle>;

  /** Safe area edges for the SafeAreaView; default ['top'] */
  safeEdges?: Edge[];
};

export default function ScreenWithGradient({
  top,
  middle,
  bottom,
  children,
  gradientColors,
  paddingHorizontal = 32,
  paddingTop = 12,
  bottomInset = true,
  bottomExtra = 8,
  scroll = false,
  contentStyle,
  columnStyle,
  safeEdges = ['top'],
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const bg = (gradientColors ?? [colors.background, colors.textRice]) as [
    string,
    string,
    ...string[]
  ];
  const bottomPad = bottomInset ? insets.bottom + bottomExtra : 0;

  const contentPaddingStyle = {
    paddingHorizontal,
    paddingTop,
  };

  const Column = (
    <View style={[styles.column, columnStyle]}>
      {/* If you provide slots, we render the slot layout.
          If you pass only children, we render children as-is. */}
      {top || middle || bottom ? (
        <>
          <View>{top}</View>
          <View style={styles.middle}>{middle}</View>
          <View style={[styles.bottom, { paddingBottom: bottomPad }]}>
            {bottom}
          </View>
        </>
      ) : (
        children
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Gradient fills the whole screen behind everything */}
      <LinearGradient colors={bg} style={StyleSheet.absoluteFillObject} />

      {/* Protect the top with safe-area. Bottom inset is applied to the bottom slot. */}
      <SafeAreaView edges={safeEdges} style={styles.safe}>
        <View style={[styles.content, contentPaddingStyle, contentStyle]}>
          {scroll ? (
            <ScrollView
              contentContainerStyle={styles.scrollGrow}
              keyboardShouldPersistTaps="handled"
            >
              {Column}
            </ScrollView>
          ) : (
            Column
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  // Restores page padding (used to live on the gradient)
  content: { flex: 1 },
  // Master vertical layout: push bottom down
  column: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Middle wrapper lets you center or apply grid later if needed
  middle: { width: '100%', alignItems: 'center' },
  // Bottom (footer): bottom inset is added inline in component
  bottom: {
    width: '100%',
  },
  // For scroll mode, keep footer at bottom by growing content
  scrollGrow: {
    flexGrow: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
