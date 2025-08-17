import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import {
  ArrowLeft,
  Utensils,
  Shield,
  Users,
  ChefHat,
} from 'lucide-react-native';

export default function AboutScreen() {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 32,
    },
    backButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
    },
    title: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: '#FF8866',
      textAlign: 'center',
      marginBottom: 32,
    },
    paragraph: {
      fontSize: 16,
      fontFamily: 'Lato-Regular',
      color: colors.text,
      lineHeight: 24,
      marginBottom: 20,
    },
    brandName: {
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },
    trademark: {
      fontFamily: 'Inter-Regular',
    },
    featureCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
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
    featureText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      lineHeight: 20,
    },
    backLink: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
      textAlign: 'center',
      marginTop: 32,
      marginBottom: 40,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Link href="/(auth)" asChild>
          <TouchableOpacity style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
        </Link>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>About Us</Text>

        <Text style={styles.paragraph}>
          Welcome to <Text style={styles.brandName}>SmartBites</Text>
          <Text style={styles.trademark}>™</Text> — a mobile app built for
          people and families managing food allergies and dietary restrictions.
        </Text>

        <View style={styles.featureCard}>
          <View style={styles.featureIcon}>
            <Utensils size={24} color={colors.primary} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Smart Recipe Search</Text>
            <Text style={styles.featureText}>
              Search for and customize recipes that avoid common allergens like
              wheat (gluten), milk, eggs, and more. Refine, edit, and save your
              favorite recipes to your personal list for easy access at home.
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIcon}>
            <Shield size={24} color={colors.secondary} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Allergy-Safe Cooking</Text>
            <Text style={styles.featureText}>
              We currently focus on helping you cook safely at home. Future
              versions of SmartBites will go further — helping you find
              allergy-friendly restaurants and safe menu items while dining out.
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIcon}>
            <ChefHat size={24} color={colors.accent} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Coming Soon: Menu Search</Text>
            <Text style={styles.featureText}>
              Search restaurant menus for allergy-aware and diet-friendly items.
              Filter by specific allergens and dietary preferences to quickly
              spot safer dishes when dining out. Pilot locations first, then
              broader rollout.
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIcon}>
            <Users size={24} color={colors.accent} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>For Everyone</Text>
            <Text style={styles.featureText}>
              Whether you're newly diagnosed or have been navigating allergies
              for years, SmartBites is here to simplify your food choices and
              bring confidence back to your kitchen.
            </Text>
          </View>
        </View>

        <Link href="/(auth)" asChild>
          <TouchableOpacity>
            <Text style={styles.backLink}>Back Home</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}
