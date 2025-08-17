// app/(auth)/support.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // <- use this SafeAreaView
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import {
  ArrowLeft,
  CircleHelp as HelpCircle,
  Book,
  Shield,
  Zap,
  Phone,
  Mail,
} from 'lucide-react-native';

const SUPPORT_EMAIL =
  process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'support@smartbites.cooking';
const SUPPORT_PHONE = process.env.EXPO_PUBLIC_SUPPORT_PHONE ?? '623-220-9724';
// Strip spaces/dashes/parentheses for tel: link
const SUPPORT_PHONE_TEL = SUPPORT_PHONE.replace(/[^\d+]/g, '');

export default function SupportScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const handlePhonePress = () => Linking.openURL(`tel:${SUPPORT_PHONE_TEL}`);
  const handleEmailPress = () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`);

  return (
    <View style={{ flex: 1 }}>
      {/* Gradient fills the whole screen */}
      <LinearGradient
        colors={[colors.background, colors.textRice]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Protect top safe area; bottom spacing handled in scroll content */}
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Page padding that used to be on container */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Link href="/(auth)" asChild>
              <TouchableOpacity style={styles.backButton}>
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
            </Link>
          </View>

          {/* Body */}
          <ScrollView
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Support</Text>

            <Text style={styles.paragraph}>
              Need help using the{' '}
              <Text style={styles.brandName}>SmartBites</Text>
              <Text style={styles.trademark}>™</Text> app? Encountering a bug?
              We're here to assist.
            </Text>

            <View style={styles.supportItem}>
              <View style={styles.supportIcon}>
                <Phone size={24} color={colors.primary} />
              </View>
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>Support Phone</Text>
                <TouchableOpacity onPress={handlePhonePress}>
                  <Text style={styles.supportLink}>{SUPPORT_PHONE}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.supportItem}>
              <View style={styles.supportIcon}>
                <Mail size={24} color={colors.secondary} />
              </View>
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>Support Email</Text>
                <TouchableOpacity onPress={handleEmailPress}>
                  <Text style={styles.supportLink}>{SUPPORT_EMAIL}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.paragraph}>
              Please include details like your device type, OS version, and any
              screenshots if available.
            </Text>

            <Text style={styles.sectionTitle}>Getting Started</Text>

            <View style={styles.supportItem}>
              <View style={styles.supportIcon}>
                <Zap size={24} color={colors.primary} />
              </View>
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>Quick Start Guide</Text>
                <Text style={styles.supportText}>
                  Set up your allergen profile, search for recipes, and save
                  your favorites. The app learns your preferences to provide
                  better recommendations.
                </Text>
              </View>
            </View>

            <View style={styles.supportItem}>
              <View style={styles.supportIcon}>
                <Shield size={24} color={colors.secondary} />
              </View>
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>Allergen Safety</Text>
                <Text style={styles.supportText}>
                  Always double-check ingredients and consult with healthcare
                  providers. SmartBites provides suggestions but cannot
                  guarantee allergen-free recipes.
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

            <View style={styles.supportItem}>
              <View style={styles.supportIcon}>
                <HelpCircle size={24} color={colors.accent} />
              </View>
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>
                  How accurate are the allergen filters?
                </Text>
                <Text style={styles.supportText}>
                  Our AI generates recipes based on your allergen profile, but
                  always verify ingredients yourself. Cross-contamination and
                  manufacturing processes can vary.
                </Text>
              </View>
            </View>

            <View style={styles.supportItem}>
              <View style={styles.supportIcon}>
                <Book size={24} color={colors.primary} />
              </View>
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>
                  Can I modify generated recipes?
                </Text>
                <Text style={styles.supportText}>
                  Yes! Save recipes to your collection and edit ingredients,
                  instructions, or notes to match your preferences and cooking
                  style.
                </Text>
              </View>
            </View>

            <Link href="/(auth)" asChild>
              <TouchableOpacity>
                <Text style={styles.backLink}>Back Home</Text>
              </TouchableOpacity>
            </Link>
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    // Replaces container background; we put padding here now
    content: {
      flex: 1,
      paddingHorizontal: 24,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 4,
      paddingBottom: 8,
    },
    backButton: { padding: 8 },

    // Scroll content padding; add bottom space so it’s not flush with the home indicator
    scrollInner: {
      paddingBottom: 32,
    },

    title: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: '#FF8866',
      textAlign: 'center',
      marginBottom: 16,
    },
    paragraph: {
      fontSize: 16,
      fontFamily: 'Lato-Regular',
      color: colors.text,
      lineHeight: 24,
      marginBottom: 20,
    },

    supportItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    supportIcon: {
      marginRight: 16,
      marginTop: 2,
    },
    supportContent: {
      flex: 1,
    },
    supportTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
      marginBottom: 8,
    },
    supportText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      lineHeight: 20,
    },
    supportLink: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.accentDark,
    },

    sectionTitle: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
      marginTop: 16,
      marginBottom: 16,
    },

    backLink: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
      textAlign: 'center',
      marginTop: 32,
      marginBottom: 40,
    },

    brandName: {
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },
    trademark: {
      fontFamily: 'Inter-Regular',
    },
  });
