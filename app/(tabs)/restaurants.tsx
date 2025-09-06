import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ChefHat, MapPin, Calendar, Globe, Star, Clock } from 'lucide-react-native';

export default function RestaurantsScreen() {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: Platform.OS === 'android' ? 16 : 24,
      paddingTop: Platform.OS === 'android' ? 32 : 4,
      paddingBottom: 2,
      backgroundColor: colors.surface,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerContent: {
      flex: 1,
    },
    headerLogoContainer: {
      alignItems: 'center',
      position: 'relative',
    },
    headerLogo: {
      width: 72,
      height: 72,
      marginLeft: 16,
    },
    betaBadge: {
      position: 'absolute',
      top: -4,
      right: -8,
      backgroundColor: '#FF8866',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    betaBadgeText: {
      fontSize: 10,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    title: {
      fontSize: Platform.OS === 'android' ? 20 : 20,
      fontFamily: 'Inter-Bold',
      color: '#FF8866',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: Platform.OS === 'android' ? 11 : 16,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 12, // keep reduced for body content
    },
    contentContainer: {
      width: '100%',
      maxWidth: 1024,
      alignSelf: 'center',
    },
    comingSoonSection: {
      backgroundColor: colors.surface,
      padding: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      marginBottom: 16,
    },
    comingSoonBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 16,
    },
    comingSoonBadgeText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    comingSoonTitle: {
      fontSize: Platform.OS === 'android' ? 16 : 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    comingSoonText: {
      fontSize: Platform.OS === 'android' ? 12 : 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    heroSection: {
      alignItems: 'center',
      marginBottom: 16,
    },
    heroIcon: {
      marginBottom: 12,
    },
    heroTitle: {
      fontSize: Platform.OS === 'android' ? 20 : 24,
      fontFamily: 'Inter-Bold',
      color: '#FF8866',
      textAlign: 'center',
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: Platform.OS === 'android' ? 14 : 16,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 16,
    },
    featuresGrid: {
      gap: 16,
      marginBottom: 16,
    },
    featureCard: {
      backgroundColor: colors.surface,
      padding: Platform.OS === 'android' ? 16 : 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    featureIcon: {
      marginRight: 16,
      marginTop: 2,
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: Platform.OS === 'android' ? 14 : 16,
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
      marginBottom: 8,
    },
    featureDescription: {
      fontSize: Platform.OS === 'android' ? 12 : 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      lineHeight: 20,
    },
    websiteSection: {
      backgroundColor: colors.surface,
      padding: Platform.OS === 'android' ? 16 : 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    websiteIcon: {
      marginRight: 16,
    },
    websiteContent: {
      flex: 1,
    },
    websiteTitle: {
      fontSize: Platform.OS === 'android' ? 14 : 16,
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
      marginBottom: 4,
    },
    websiteText: {
      fontSize: Platform.OS === 'android' ? 12 : 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    websiteUrl: {
      fontSize: Platform.OS === 'android' ? 12 : 14,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
      marginTop: 4,
    },
    brandName: {
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },
    trademark: {
      fontFamily: 'Inter-Regular',
    },
    mobileBetaFooter: {
      paddingHorizontal: 24,
      paddingVertical: 8,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    mobileBetaText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    futureFeatures: {
      gap: 16,
      marginBottom: 16,
    },
    futureFeature: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    futureFeatureIcon: {
      marginRight: 12,
    },
    futureFeatureText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Restaurants</Text>
          <Text style={styles.subtitle}>Find allergy-friendly dining options</Text>
        </View>
        <View style={styles.headerLogoContainer}>
          <Image
            source={require('@/assets/images/smart-bites-logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          {Platform.OS !== 'web' && (
            <View style={styles.betaBadge}>
              <Text style={styles.betaBadgeText}>Beta</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <View style={styles.comingSoonSection}>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
          </View>
          <Text style={styles.comingSoonTitle}>Launching Early 2026</Text>
          <Text style={styles.comingSoonText}>
            We're working hard to bring you the most comprehensive allergy-aware restaurant database. 
            Stay tuned for updates!
          </Text>
        </View>

          <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <ChefHat size={64} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Restaurant & Menu Search</Text>
          <Text style={styles.heroSubtitle}>
            Discover allergy-aware restaurants and menus tailored to your dietary needs
          </Text>
        </View>

          <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <MapPin size={24} color={colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Location-Based Search</Text>
              <Text style={styles.featureDescription}>
                Find nearby restaurants that accommodate your specific allergens and dietary preferences
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Star size={24} color={colors.secondary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Verified Safe Options</Text>
              <Text style={styles.featureDescription}>
                Browse menu items that have been verified as safe for your specific allergies
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Clock size={24} color={colors.accent} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Real-Time Updates</Text>
              <Text style={styles.featureDescription}>
                Get up-to-date information on menu changes and allergen warnings
              </Text>
            </View>
          </View>
        </View>

          <View style={styles.websiteSection}>
          <View style={styles.websiteIcon}>
            <Globe size={24} color={colors.primary} />
          </View>
          <View style={styles.websiteContent}>
            <Text style={styles.websiteTitle}>Current Resources</Text>
            <Text style={styles.websiteText}>
              For immediate restaurant information, visit our partner site
            </Text>
            <Text style={styles.websiteUrl}>allergyawaremenu.com</Text>
          </View>
        </View>

          <Text style={styles.heroSubtitle}>
          Part of the <Text style={styles.brandName}>SmartBites</Text>
          <Text style={styles.trademark}>™</Text> ecosystem for safer dining experiences.
        </Text>
        </View>
      </ScrollView>

      {/* Mobile Beta Footer */}
      {Platform.OS !== 'web' && (
        <View style={styles.mobileBetaFooter}>
          <Text style={styles.mobileBetaText}>
            Currently in beta — thanks for testing!
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}