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
import { ArrowLeft, CircleHelp as HelpCircle, Book, Shield, Zap, Phone, Mail } from 'lucide-react-native';

export default function SupportScreen() {
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
    sectionTitle: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
      marginTop: 24,
      marginBottom: 16,
    },
    backLink: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
      textAlign: 'center',
      marginTop: 32,
    brandName: {
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },
    trademark: {
      fontFamily: 'Inter-Regular',
    },
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
        <Text style={styles.title}>Support</Text>

        <Text style={styles.paragraph}>
          Need help using the <Text style={styles.brandName}>SmartBites</Text>
          <Text style={styles.trademark}>™</Text> app? Encountering a bug? We're here to assist.
        </Text>

        <View style={styles.supportItem}>
          <View style={styles.supportIcon}>
            <Phone size={24} color={colors.primary} />
          </View>
          <View style={styles.supportContent}>
            <Text style={styles.supportTitle}>Support Phone</Text>
            <Text style={styles.supportText}>623-220-9724</Text>
          </View>
        </View>

        <View style={styles.supportItem}>
          <View style={styles.supportIcon}>
            <Mail size={24} color={colors.secondary} />
          </View>
          <View style={styles.supportContent}>
            <Text style={styles.supportTitle}>Support Email</Text>
            <Text style={styles.supportText}>joe@davault.dev</Text>
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
              Set up your allergen profile, search for recipes, and save your favorites. 
              The app learns your preferences to provide better recommendations.
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
              Always double-check ingredients and consult with healthcare providers. 
              SmartBites provides suggestions but cannot guarantee allergen-free recipes.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        <View style={styles.supportItem}>
          <View style={styles.supportIcon}>
            <HelpCircle size={24} color={colors.accent} />
          </View>
          <View style={styles.supportContent}>
            <Text style={styles.supportTitle}>How accurate are the allergen filters?</Text>
            <Text style={styles.supportText}>
              Our AI generates recipes based on your allergen profile, but always verify 
              ingredients yourself. Cross-contamination and manufacturing processes can vary.
            </Text>
          </View>
        </View>

        <View style={styles.supportItem}>
          <View style={styles.supportIcon}>
            <Book size={24} color={colors.primary} />
          </View>
          <View style={styles.supportContent}>
            <Text style={styles.supportTitle}>Can I modify generated recipes?</Text>
            <Text style={styles.supportText}>
              Yes! Save recipes to your collection and edit ingredients, instructions, 
              or notes to match your preferences and cooking style.
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