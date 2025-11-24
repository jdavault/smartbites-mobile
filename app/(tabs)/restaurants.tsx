import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Image,
} from 'react-native';
import Header from '@/components/Header';
import {
  useTheme,
  ThemeColors,
  SPACING,
  RADIUS,
  SHADOWS,
  FONT_SIZES,
} from '@/contexts/ThemeContext';

import {
  MapPin,
  Star,
  Clock,
  Sparkles,
  ArrowRight,
  Utensils,
} from 'lucide-react-native';
import BetaFooter from '@/components/BetaFooter';

const FEATURES = [
  {
    icon: MapPin,
    color: '#FF8866',
    title: 'Find Nearby',
    description: 'Discover allergen-friendly restaurants in your area',
  },
  {
    icon: Star,
    color: '#FFB347',
    title: 'User Reviews',
    description: 'Read reviews from others with similar dietary needs',
  },
  {
    icon: Clock,
    color: '#77DD77',
    title: 'Real-Time Info',
    description: 'Get up-to-date menus and allergen information',
  },
];

export default function RestaurantsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Restaurants" subtitle="Find allergen-friendly dining" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentContainer}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.comingSoonBadge}>
              <Sparkles size={14} color="#FFFFFF" />
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
            <Text style={styles.heroTitle}>Restaurant Finder</Text>
            <Text style={styles.heroSubtitle}>
              We're building a comprehensive tool to help you find restaurants
              that accommodate your dietary needs and allergen restrictions.
            </Text>
          </View>

          {/* Features */}
          <Text style={styles.sectionTitle}>What to Expect</Text>
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <View key={index} style={styles.featureCard}>
                <View
                  style={[
                    styles.featureIconContainer,
                    { backgroundColor: `${feature.color}20` },
                  ]}
                >
                  <Icon size={24} color={feature.color} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Resource Card */}
          <View style={styles.resourceCard}>
            <Text style={styles.resourceTitle}>In the Meantime</Text>
            <Text style={styles.resourceDescription}>
              Check out AllergyAwareMenu for current restaurant allergen
              information.
            </Text>
            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => Linking.openURL('https://allergyawaremenu.com')}
              activeOpacity={0.8}
            >
              <Text style={styles.resourceButtonText}>
                Visit AllergyAwareMenu
              </Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Brand Section */}
          <View style={styles.brandSection}>
            <Text style={styles.brandText}>SmartBites™</Text>
            <Text style={styles.brandSubtext}>
              Allergy-aware cooking, simplified
            </Text>
          </View>
        </View>
      </ScrollView>

      <BetaFooter enabled={true} />
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: SPACING.xxl },
    contentContainer: {
      width: '100%',
      maxWidth: 600,
      alignSelf: 'center',
      paddingHorizontal: SPACING.lg,
    },
    heroSection: {
      alignItems: 'center',
      paddingVertical: SPACING.xxxl,
      marginTop: SPACING.lg,
    },
    heroIconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: `${colors.primary}10`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.xl,
    },
    comingSoonBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.full,
      marginBottom: SPACING.lg,
    },
    comingSoonText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: 'Inter-Bold',
      color: '#FFFFFF',
    },
    heroTitle: {
      fontSize: FONT_SIZES.xxl,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: SPACING.md,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    heroSubtitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      maxWidth: 320,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
      marginBottom: SPACING.lg,
      letterSpacing: -0.3,
    },
    featureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      marginBottom: SPACING.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...SHADOWS.sm,
    },
    featureIconContainer: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: SPACING.lg,
    },
    featureContent: { flex: 1 },
    featureTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: SPACING.xs,
    },
    featureDescription: {
      fontSize: FONT_SIZES.sm,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
      lineHeight: 20,
    },
    resourceCard: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      padding: SPACING.xl,
      marginTop: SPACING.xl,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      ...SHADOWS.md,
    },
    resourceTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: SPACING.sm,
    },
    resourceDescription: {
      fontSize: FONT_SIZES.md,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: SPACING.lg,
      lineHeight: 22,
    },
    resourceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.md,
      ...SHADOWS.sm,
    },
    resourceButtonText: {
      fontSize: FONT_SIZES.md,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    brandSection: { alignItems: 'center', paddingVertical: SPACING.xxxl },
    brandText: {
      fontSize: FONT_SIZES.lg,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
      letterSpacing: -0.3,
    },
    brandSubtext: {
      fontSize: FONT_SIZES.sm,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
      marginTop: SPACING.xs,
    },
  });
