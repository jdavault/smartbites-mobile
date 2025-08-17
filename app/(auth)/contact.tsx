import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, Mail, MapPin } from 'lucide-react-native';

const CONTACT_EMAIL =
  process.env.EXPO_PUBLIC_CONTACT_EMAIL ?? 'support@smartbites.cooking';

export default function ContactScreen() {
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
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    contactIcon: {
      marginRight: 16,
    },
    contactContent: {
      flex: 1,
    },
    contactTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
      marginBottom: 4,
    },
    contactText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    contactLink: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.accentDark,
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

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}`);
  };
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
        <Text style={styles.title}>Contact Us</Text>

        <Text style={styles.paragraph}>
          We'd love to hear from you. Whether you have questions about billing,
          employment, partnerships, or general inquiries — reach out!
        </Text>

        <View style={styles.contactItem}>
          <View style={styles.contactIcon}>
            <Mail size={24} color={colors.primary} />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>General Email</Text>
            <TouchableOpacity onPress={handleEmailPress}>
              <Text style={styles.contactLink}>{CONTACT_EMAIL}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contactItem}>
          <View style={styles.contactIcon}>
            <MapPin size={24} color={colors.secondary} />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>Mailing Address</Text>
            <Text style={styles.contactText}>
              SmartBites, Inc.{'\n'}
              2101 E Donald Dr.{'\n'}
              Phoenix, AZ 85024{'\n'}
              623-220-9724
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
