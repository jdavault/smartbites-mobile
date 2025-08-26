import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
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
      paddingHorizontal: 24,
      paddingTop: 6,
      paddingBottom: 6,
      backgroundColor: colors.surface,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerContent: {
      flex: 1,
    },
    headerLogo: {
      width: 72,
      height: 72,
      marginLeft: 16,
    },
    title: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: '#FF8866',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
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
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    comingSoonText: {
      fontSize: 14,
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
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: '#FF8866',
      textAlign: 'center',
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 16,
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
      padding: 20,
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
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
      marginBottom: 8,
    },
    featureDescription: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      lineHeight: 20,
    },
    websiteSection: {
      backgroundColor: colors.surface,
      padding: 20,
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
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
      marginBottom: 4,
    },
    websiteText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    websiteUrl: {
      fontSize: 14,
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
        <Image
          source={require('@/assets/images/smart-bites-logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
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
    </SafeAreaView>
  );
}