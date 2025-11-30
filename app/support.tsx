// app/support.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import * as Device from 'expo-device';
import {
  ArrowLeft,
  CircleHelp as HelpCircle,
  Book,
  Shield,
  Zap,
  Phone,
  Mail,
  Send,
  CheckCircle,
} from 'lucide-react-native';

const SUPPORT_EMAIL =
  process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'support@smartbites.food';
const SUPPORT_PHONE = process.env.EXPO_PUBLIC_SUPPORT_PHONE ?? '623-220-9724';
const SUPPORT_PHONE_TEL = SUPPORT_PHONE.replace(/[^\d+]/g, '');

export default function SupportScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePhonePress = () => Linking.openURL(`tel:${SUPPORT_PHONE_TEL}`);
  const handleEmailPress = () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`);

  const getDeviceInfo = () => {
    return `${Device.brand} ${Device.modelName}, ${Platform.OS} ${Platform.Version}`;
  };

  const handleSubmitSupport = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert(
        'Missing Information',
        'Please enter both a subject and message.'
      );
      return;
    }

    setLoading(true);
    try {
      // Get user session if available
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.functions.invoke('send-support-email', {
        body: {
          subject: subject.trim(),
          message: message.trim(),
          userEmail: user?.email,
          userName: user?.user_metadata?.full_name,
          deviceInfo: getDeviceInfo(),
        },
      });

      if (error) throw error;

      // Show success modal
      setShowSuccess(true);

      // Clear form
      setSubject('');
      setMessage('');

      // Hide modal after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to send support request. Please try again or contact us directly.'
      );
      console.error('Support email error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[colors.background, colors.textRice]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Link href="/(auth)" asChild>
                  <TouchableOpacity style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                  </TouchableOpacity>
                </Link>
                <Text style={styles.headerTitle}>Support</Text>
              </View>
              <Image
                source={require('@/assets/images/smart-bites-logo.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollInner}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.contentContainer}>
                <Text style={styles.paragraph}>
                  Need help using the{' '}
                  <Text style={styles.brandName}>SmartBites</Text>
                  <Text style={styles.trademark}>™</Text> app? Encountering a
                  bug? We're here to assist.
                </Text>

                {/* Getting Started Section */}
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
                      Always double-check ingredients and consult with
                      healthcare providers. SmartBites provides suggestions but
                      cannot guarantee allergen-free recipes.
                    </Text>
                  </View>
                </View>

                {/* FAQ Section */}
                <Text style={styles.sectionTitle}>
                  Frequently Asked Questions
                </Text>

                <View style={styles.supportItem}>
                  <View style={styles.supportIcon}>
                    <HelpCircle size={24} color={colors.accent} />
                  </View>
                  <View style={styles.supportContent}>
                    <Text style={styles.supportTitle}>
                      How accurate are the allergen filters?
                    </Text>
                    <Text style={styles.supportText}>
                      Our AI generates recipes based on your allergen profile,
                      but always verify ingredients yourself.
                      Cross-contamination and manufacturing processes can vary.
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
                      instructions, or notes to match your preferences and
                      cooking style.
                    </Text>
                  </View>
                </View>

                {/* CONTACT CARD MOVED HERE - RIGHT ABOVE FORM */}
                <View style={styles.contactCard}>
                  <TouchableOpacity
                    onPress={handlePhonePress}
                    style={styles.contactRowFirst} // Special style for first row
                  >
                    <Phone size={20} color={colors.primary} />
                    <Text style={styles.contactLink}>{SUPPORT_PHONE}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleEmailPress}
                    style={styles.contactRowLast} // Special style for last row
                  >
                    <Mail size={20} color={colors.secondary} />
                    <Text style={styles.contactLink}>{SUPPORT_EMAIL}</Text>
                  </TouchableOpacity>
                </View>

                {/* Support Form */}
                <View style={styles.formSection}>
                  <Text style={styles.formTitle}>Send us a message</Text>
                  <Text style={styles.formHint}>
                    Please include details like your device type, OS version,
                    and any screenshots if available.
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Subject"
                    placeholderTextColor={colors.textSecondary}
                    value={subject}
                    onChangeText={setSubject}
                    maxLength={100}
                  />

                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe your issue or question..."
                    placeholderTextColor={colors.textSecondary}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={6}
                    maxLength={1000}
                    textAlignVertical="top"
                  />

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      loading && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmitSupport}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Send size={20} color="white" />
                        <Text style={styles.submitButtonText}>
                          Send Message
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <Link href="/(auth)" asChild>
                  <TouchableOpacity>
                    <Text style={styles.backLink}>Back Home</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Success Modal stays the same */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccess(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <CheckCircle size={48} color={colors.primary} />
            <Text style={styles.successTitle}>Message Sent!</Text>
            <Text style={styles.successText}>
              We'll get back to you as soon as possible.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    content: {
      flex: 1,
      paddingHorizontal: 24,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 8,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: '#FF8866',
    },
    headerLogo: {
      width: 72,
      height: 72,
      marginLeft: 16,
    },
    scrollInner: {
      paddingBottom: 32,
      alignItems: 'center',
    },

    contentContainer: {
      width: '100%',
      maxWidth: 1024,
      alignSelf: 'center',
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
      marginTop: 8,
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

    contactCard: {
      backgroundColor: colors.surface,
      paddingTop: 12, // 🎯 ADJUST TOP PADDING HERE
      paddingBottom: 12, // 🎯 ADJUST BOTTOM PADDING HERE
      paddingHorizontal: 16, // Left/right padding
      borderRadius: 12,
      marginTop: 24, // Space above the card
      marginBottom: 16, // Space below the card (before form)
      borderWidth: 1,
      borderColor: colors.border,
    },

    contactRowFirst: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 0, // No extra padding on top
      paddingBottom: 8, // 🎯 ADJUST SPACING BETWEEN PHONE & EMAIL HERE
    },
    contactRowLast: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 0, // Inherits spacing from contactRowFirst paddingBottom
      paddingBottom: 0, // No extra padding on bottom
    },

    contactLink: {
      fontSize: 15,
      fontFamily: 'Inter-Medium',
      color: colors.accentDark,
      marginLeft: 12,
    },

    formSection: {
      marginTop: 8, // Space between contact card and form
      marginBottom: 24,
    },

    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6, // Reduced from 8
    },

    formSection: {
      marginTop: 32, // Added top margin
      marginBottom: 24, // Reduced from 32
    },
    contactTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
      marginBottom: 16,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    contactLink: {
      fontSize: 15,
      fontFamily: 'Inter-Medium',
      color: colors.accentDark,
      marginLeft: 12,
    },

    formSection: {
      marginBottom: 32,
    },
    formTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
      marginBottom: 8,
    },
    formHint: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      marginBottom: 12,
    },
    textArea: {
      minHeight: 120,
      paddingTop: 12,
    },
    submitButton: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitButtonText: {
      color: 'white',
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 8,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    successModal: {
      backgroundColor: 'white',
      padding: 32,
      borderRadius: 16,
      alignItems: 'center',
      width: '80%',
      maxWidth: 320,
    },
    successTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    successText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
