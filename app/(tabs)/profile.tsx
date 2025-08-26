// app/(tabs)/profile.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Platform,
  ActivityIndicator,
  Linking,
  Image,
  Modal,
  TouchableWithoutFeedback,
  type ScrollView as RNScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeColors, useTheme } from '@/contexts/ThemeContext';
import { useAllergens, ALLERGENS } from '@/contexts/AllergensContext';
import { useDietary, DIETARY_PREFERENCES } from '@/contexts/DietaryContext';
import { UserService } from '@/services/userService';
import {
  Moon,
  Sun,
  ChevronDown,
  CircleAlert as AlertCircle,
  ExternalLink,
} from 'lucide-react-native';

import { US_STATES } from '@/constants/States';
import { formatPhoneNumber, isValidPhoneNumber } from '@/utils/phone';
import packageJson from '../../package.json';

const APP_VERSION = packageJson.version;

type ModalInfo = {
  visible: boolean;
  title: string;
  subtitle?: string;
  emoji?: string;
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { colors, toggleTheme, isDark } = useTheme();
  const {
    userAllergens,
    toggleAllergen,
    loading: allergensLoading,
  } = useAllergens();
  const {
    userDietaryPrefs,
    toggleDietaryPref,
    loading: dietaryLoading,
  } = useDietary();

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [showStates, setShowStates] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const [modalInfo, setModalInfo] = useState<ModalInfo>({
    visible: false,
    title: '',
  });

  const openModal = (info: Omit<ModalInfo, 'visible'>) =>
    setModalInfo({ ...info, visible: true });
  const closeModal = () => setModalInfo((m) => ({ ...m, visible: false }));

  // --------- Scroll to bottom when expanding About ----------
  const scrollRef = useRef<RNScrollView | null>(null);
  useEffect(() => {
    if (showAbout) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [showAbout]);
  const handleContentSizeChange = () => {
    if (showAbout) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  };
  // ---------------------------------------------------------

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const profileData = await UserService.getUserProfile(user?.id!);
      if (profileData) {
        setProfile((prev) => ({
          ...prev,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          address1: profileData.address1 || '',
          address2: profileData.address2 || '',
          city: profileData.city || '',
          state: profileData.state || '',
          zip: profileData.zip || '',
          phone: profileData.phone ? formatPhoneNumber(profileData.phone) : '',
        }));
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    if (profile.phone && !isValidPhoneNumber(profile.phone)) {
      openModal({
        title: 'Invalid Phone Number',
        subtitle: 'Please enter a valid 10-digit phone number.',
        emoji: '📞',
      });
      return;
    }

    setLoading(true);

    try {
      await UserService.upsertUserProfile({
        userId: user.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        address1: profile.address1,
        address2: profile.address2,
        city: profile.city,
        state: profile.state,
        zip: profile.zip,
        phone: profile.phone.replace(/\D/g, ''),
      });

      openModal({
        title: 'Profile Updated!',
        subtitle: 'Your changes have been saved successfully.',
        emoji: '✅',
      });
    } catch (err: any) {
      openModal({
        title: 'Update Failed',
        subtitle:
          err?.message || 'Failed to update profile. Please try again later.',
        emoji: '❌',
      });
      console.error('Save profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Success/Error Modal */}
      {modalInfo.visible && (
        <Modal
          transparent
          animationType="fade"
          visible={modalInfo.visible}
          onRequestClose={closeModal}
        >
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                {modalInfo.emoji && (
                  <Text style={styles.modalEmoji}>{modalInfo.emoji}</Text>
                )}
                <Text style={styles.modalTitle}>{modalInfo.title}</Text>
                {!!modalInfo.subtitle && (
                  <Text style={styles.modalSubtitle}>{modalInfo.subtitle}</Text>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* White header matching other tabs */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>User preferences</Text>
        </View>
        <Image
          source={require('@/assets/images/smart-bites-logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      {/* NEW: State picker modal (portal) */}
      <Modal
        transparent
        visible={showStates}
        animationType="fade"
        onRequestClose={() => setShowStates(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowStates(false)}>
          <View style={styles.dropdownOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.dropdownSheet}>
          <Text style={styles.dropdownTitle}>Select a state</Text>
          <ScrollView
            style={styles.dropdownList}
            keyboardShouldPersistTaps="handled"
          >
            {US_STATES.map((stateItem) => (
              <TouchableOpacity
                key={stateItem.code}
                style={styles.dropdownItem}
                onPress={() => {
                  setProfile((prev) => ({ ...prev, state: stateItem.code }));
                  setShowStates(false);
                }}
              >
                <Text style={styles.dropdownItemText}>
                  {stateItem.code} — {stateItem.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.dropdownCancel}
            onPress={() => setShowStates(false)}
          >
            <Text style={styles.dropdownCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={handleContentSizeChange}
        contentContainerStyle={{ paddingBottom: 5 }}
      >
        <View style={styles.contentContainer}>
          <View style={styles.formCard}>
            <View style={styles.form}>
              {/* Names */}
              <TextInput
                style={styles.input}
                value={profile.firstName}
                onChangeText={(text) =>
                  setProfile((prev) => ({ ...prev, firstName: text }))
                }
                placeholder="First name"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                value={profile.lastName}
                onChangeText={(text) =>
                  setProfile((prev) => ({ ...prev, lastName: text }))
                }
                placeholder="Last name"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
              />

              {/* Address */}
              <TextInput
                style={styles.input}
                value={profile.address1}
                onChangeText={(text) =>
                  setProfile((prev) => ({ ...prev, address1: text }))
                }
                placeholder="Address line 1"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                value={profile.address2}
                onChangeText={(text) =>
                  setProfile((prev) => ({ ...prev, address2: text }))
                }
                placeholder="Address line 2 (optional)"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
              />

              <View className="city-state-row" style={styles.row}>
                <TextInput
                  style={[styles.input, styles.flex2]}
                  value={profile.city}
                  onChangeText={(text) =>
                    setProfile((prev) => ({ ...prev, city: text }))
                  }
                  placeholder="City"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />

                {/* NEW: State selector as modal trigger (no inline dropdown) */}
                <TouchableOpacity
                  style={[styles.input, styles.stateSelectButton, styles.flex1]}
                  onPress={() => setShowStates(true)}
                >
                  <Text
                    style={[
                      styles.stateButtonText,
                      {
                        color: profile.state
                          ? colors.text
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {profile.state || 'State'}
                  </Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <View style={styles.zipContainer}>
                  <TextInput
                    style={styles.input}
                    value={profile.zip}
                    onChangeText={(text) =>
                      setProfile((prev) => ({ ...prev, zip: text }))
                    }
                    placeholder="ZIP"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                </View>
                <View style={styles.phoneContainer}>
                  <TextInput
                    style={styles.input}
                    value={profile.phone}
                    onChangeText={(text) => {
                      const formatted = formatPhoneNumber(text);
                      setProfile((prev) => ({ ...prev, phone: formatted }));
                    }}
                    placeholder="Phone"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                    maxLength={14}
                  />
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Allergens</Text>
          {allergensLoading ? (
            <View style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.chipGrid}>
              {ALLERGENS.map((allergen) => {
                const selected = userAllergens.some(
                  (a) => a.$id === allergen.$id
                );
                return (
                  <TouchableOpacity
                    key={allergen.$id}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => toggleAllergen(allergen)}
                    disabled={allergensLoading}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {allergen.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.sectionTitleDiet}>Dietary Preferences</Text>
          {dietaryLoading ? (
            <View style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
              <ActivityIndicator size="small" color={colors.dietary} />
            </View>
          ) : (
            <View style={styles.chipGrid}>
              {DIETARY_PREFERENCES.map((pref) => {
                const selected = userDietaryPrefs.some(
                  (p) => p.$id === pref.$id
                );
                return (
                  <TouchableOpacity
                    key={pref.$id}
                    style={[
                      styles.chip,
                      selected && styles.chipSelectedDietary,
                    ]}
                    onPress={() => toggleDietaryPref(pref)}
                    disabled={dietaryLoading}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {pref.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.themeContainer}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              {isDark ? (
                <Moon size={20} color={colors.text} />
              ) : (
                <Sun size={20} color={colors.text} />
              )}
              <Text style={styles.themeText}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#e6e2d6', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                styles.halfButton,
                loading && { opacity: 0.6 },
              ]}
              onPress={saveProfile}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.signOutButton, styles.halfButton]}
              onPress={handleSignOut}
            >
              <Text style={[styles.buttonText, styles.signOutButtonText]}>
                Log Out
              </Text>
            </TouchableOpacity>
          </View>

          {/* About / Legal Section (collapsible) */}
          <View>
            <TouchableOpacity
              onPress={() => setShowAbout((v) => !v)}
              style={styles.aboutToggle}
            >
              <Text style={styles.aboutToggleText}>
                {showAbout ? 'Hide About ▲' : 'Show About ▼'}
              </Text>
            </TouchableOpacity>

            {showAbout && (
              <View style={styles.legalSection}>
                <View style={styles.disclaimerBox}>
                  <AlertCircle
                    size={20}
                    color="#f59e0b"
                    style={styles.disclaimerIcon}
                  />
                  <Text style={styles.disclaimerText}>
                    This app helps avoid allergens in recipes but is not a
                    substitute for professional advice. Always verify
                    ingredients if you have severe allergies.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.link}
                  onPress={() =>
                    Linking.openURL(
                      'https://www.privacypolicies.com/live/53f5c56f-677a-469f-aad9-1253eb6b75e4'
                    )
                  }
                >
                  <Text style={styles.linkText}>Terms of Service</Text>
                  <ExternalLink size={16} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.link}
                  onPress={() =>
                    Linking.openURL(
                      'https://www.privacypolicies.com/live/1a6f589d-84cc-4f85-82b9-802b08c501b2'
                    )
                  }
                >
                  <Text style={styles.linkText}>Privacy Policy</Text>
                  <ExternalLink size={16} color={colors.primary} />
                </TouchableOpacity>

                <Text style={styles.versionText}>Version {APP_VERSION}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      width: '100%',
      maxWidth: 1024,
      alignSelf: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 6,
      paddingBottom: 6,
      backgroundColor: colors.surface,
      marginBottom: 12,
    },
    headerContent: { flex: 1 },
    headerLogo: { width: 72, height: 72, marginLeft: 16 },
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

    // Form styling
    form: { gap: 12 },
    row: { flexDirection: 'row', gap: 8 },
    flex1: { flex: 1 },
    flex2: { flex: 2 },
    zipContainer: { width: 80 },
    phoneContainer: { width: 140 },

    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 9,
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 15,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      backgroundColor: colors.background,
    },

    // NEW: state select button (looks like input)
    stateSelectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    stateButtonText: {
      fontSize: 15,
      fontFamily: 'Inter-Regular',
      color: colors.text,
    },

    // Card wrapper
    formCard: {
      backgroundColor: colors.surface,
      marginHorizontal: 24,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },

    // Sections
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
      marginTop: 0,
      marginBottom: 6,
      paddingHorizontal: 24,
    },
    sectionTitleDiet: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.dietary,
      marginTop: 0,
      marginBottom: 6,
      paddingHorizontal: 24,
    },

    // Chips
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    chip: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipSelectedDietary: {
      backgroundColor: colors.dietary,
      borderColor: colors.dietary,
    },
    chipText: { fontSize: 12, fontFamily: 'Inter-Medium', color: colors.text },
    chipTextSelected: { color: '#fff' },

    // Theme toggle
    themeContainer: {
      paddingHorizontal: 24,
      paddingVertical: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.backgroundLight,
      marginHorizontal: 24,
      borderRadius: 12,
      marginBottom: 8,
      marginTop: 4,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    themeText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.accentDark,
    },

    // Buttons
    button: {
      paddingVertical: 8,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    buttonRow: {
      flexDirection: 'row',
      paddingHorizontal: 24,
      gap: 12,
      marginTop: 8,
      marginBottom: 12,
    },
    halfButton: { flex: 1 },
    saveButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    buttonText: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
    saveButtonText: { color: '#FFFFFF' },
    signOutButton: { backgroundColor: colors.backgroundLight, borderColor: colors.error },
    signOutButtonText: { color: colors.error },

    aboutToggle: { alignItems: 'center', paddingVertical: 6, marginBottom: 4 },
    aboutToggleText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },

    // Legal section
    legalSection: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
    disclaimerBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.surface,
      padding: 10,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#f59e0b',
    },
    disclaimerIcon: { marginRight: 10, marginTop: 2 },
    disclaimerText: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      lineHeight: 20,
    },

    link: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      marginBottom: 0,
      paddingBottom: 0,
    },
    linkText: {
      fontSize: 13,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
      marginRight: 6,
    },
    versionText: {
      fontSize: 14,
      fontWeight: '700',
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 10,
    },

    // Modal (success/error)
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      padding: 24,
      borderRadius: 12,
      width: '80%',
      maxWidth: 420,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    modalEmoji: { fontSize: 40, marginBottom: 12 },

    // NEW: Dropdown modal (portal) styles
    dropdownOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    dropdownSheet: {
      position: 'absolute',
      left: 16,
      right: 16,
      top: Platform.select({ ios: 120, android: 120, default: 120 }),
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      elevation: 50,
      zIndex: 99999,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
    },
    dropdownTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    dropdownList: { maxHeight: 300, borderRadius: 8 },
    dropdownItem: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownItemText: {
      fontSize: 15,
      fontFamily: 'Inter-Regular',
      color: colors.text,
    },
    dropdownCancel: {
      marginTop: 8,
      alignSelf: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    dropdownCancelText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },
  });
