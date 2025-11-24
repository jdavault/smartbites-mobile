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
  Pressable,
  type ScrollView as RNScrollView,
} from 'react-native';
import Header from '@/components/Header';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  useTheme,
  ThemeColors,
  SPACING,
  RADIUS,
  SHADOWS,
  FONT_SIZES,
} from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useAllergens, ALLERGENS } from '@/contexts/AllergensContext';
import { useDietary, DIETARY_PREFERENCES } from '@/contexts/DietaryContext';
import { UserService } from '@/services/userService';
import {
  Moon,
  Sun,
  ChevronDown,
  CircleAlert as AlertCircle,
  ExternalLink,
  User,
  Shield,
  Utensils,
  Settings,
} from 'lucide-react-native';
import { US_STATES } from '@/constants/States';
import { formatPhoneNumber, isValidPhoneNumber } from '@/utils/phone';
import packageJson from '../../package.json';
import BetaFooter from '@/components/BetaFooter';

const APP_VERSION = packageJson.version;

type ModalInfo = {
  visible: boolean;
  title: string;
  subtitle?: string;
  emoji?: string;
  primary?: { label: string; onPress?: () => void };
  secondary?: { label: string; onPress?: () => void };
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

  const scrollRef = useRef<RNScrollView | null>(null);
  useEffect(() => {
    if (showAbout)
      requestAnimationFrame(() =>
        scrollRef.current?.scrollToEnd({ animated: true })
      );
  }, [showAbout]);
  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const data = await UserService.getUserProfile(user?.id!);
      if (data)
        setProfile((p) => ({
          ...p,
          email: user?.email || '',
          firstName: data.firstName,
          lastName: data.lastName,
          address1: data.address1 || '',
          address2: data.address2 || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          phone: data.phone ? formatPhoneNumber(data.phone) : '',
        }));
      else if (user) setProfile((p) => ({ ...p, email: user.email || '' }));
    } catch (e) {
      console.error('Error loading profile:', e);
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
        subtitle: 'Your changes have been saved.',
        emoji: '✅',
      });
    } catch (e: any) {
      openModal({
        title: 'Update Failed',
        subtitle: e?.message || 'Failed to update profile.',
        emoji: '❌',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setLoading(true);
    closeModal();
    try {
      const { data, error } = await supabase.functions.invoke(
        'deleteUserAccount',
        { method: 'POST', body: {} }
      );
      if (error) throw new Error(error.message || 'Failed to delete account');
      if (!data?.success)
        throw new Error(data?.error || 'Account deletion failed');
      await signOut();
      router.replace('/(auth)');
    } catch (e: any) {
      openModal({
        title: 'Delete Failed',
        subtitle: e?.message || 'Failed to delete account.',
        emoji: '❌',
      });
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(colors, isDark);

  return (
    <SafeAreaView style={styles.container}>
      {/* Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={modalInfo.visible}
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Pressable>
            <View style={styles.modalContent}>
              {modalInfo.emoji && (
                <Text style={styles.modalEmoji}>{modalInfo.emoji}</Text>
              )}
              <Text style={styles.modalTitle}>{modalInfo.title}</Text>
              {!!modalInfo.subtitle && (
                <Text style={styles.modalSubtitle}>{modalInfo.subtitle}</Text>
              )}
              {(modalInfo.primary || modalInfo.secondary) && (
                <View style={styles.modalButtons}>
                  {modalInfo.secondary && (
                    <TouchableOpacity
                      style={styles.modalButtonSecondary}
                      onPress={() =>
                        modalInfo.secondary?.onPress
                          ? modalInfo.secondary.onPress()
                          : closeModal()
                      }
                    >
                      <Text style={styles.modalButtonSecondaryText}>
                        {modalInfo.secondary.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {modalInfo.primary && (
                    <TouchableOpacity
                      style={styles.modalButtonPrimary}
                      onPress={() =>
                        modalInfo.primary?.onPress
                          ? modalInfo.primary.onPress()
                          : closeModal()
                      }
                    >
                      <Text style={styles.modalButtonPrimaryText}>
                        {modalInfo.primary.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* State Picker */}
      <Modal
        transparent
        visible={showStates}
        animationType="fade"
        onRequestClose={() => setShowStates(false)}
      >
        <Pressable
          style={styles.pickerOverlay}
          onPress={() => setShowStates(false)}
        >
          <Pressable>
            <View style={styles.pickerContent}>
              <Text style={styles.pickerTitle}>Select State</Text>
              <ScrollView
                style={styles.pickerList}
                showsVerticalScrollIndicator={false}
              >
                {US_STATES.map((s) => (
                  <TouchableOpacity
                    key={s.code}
                    style={styles.pickerOption}
                    onPress={() => {
                      setProfile((p) => ({ ...p, state: s.code }));
                      setShowStates(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>
                      {s.code} — {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.pickerCancel}
                onPress={() => setShowStates(false)}
              >
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Header title="Your Profile" subtitle="Manage your preferences" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentContainer}>
          {/* Profile Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <User size={18} color={colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Personal Info</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={profile.email}
                editable={false}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={profile.firstName}
                  onChangeText={(t) =>
                    setProfile((p) => ({ ...p, firstName: t }))
                  }
                  placeholder="First name"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={profile.lastName}
                  onChangeText={(t) =>
                    setProfile((p) => ({ ...p, lastName: t }))
                  }
                  placeholder="Last name"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>

          {/* Allergens Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.cardIconContainer,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <Shield size={18} color={colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Allergens to Avoid</Text>
            </View>
            {allergensLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ padding: SPACING.lg }}
              />
            ) : (
              <View style={styles.chipGrid}>
                {ALLERGENS.map((a) => {
                  const sel = userAllergens.some((x) => x.$id === a.$id);
                  return (
                    <TouchableOpacity
                      key={a.$id}
                      style={[styles.chip, sel && styles.chipSelected]}
                      onPress={() => toggleAllergen(a)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          sel && styles.chipTextSelected,
                        ]}
                      >
                        {a.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Dietary Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.cardIconContainer,
                  { backgroundColor: `${colors.dietary}15` },
                ]}
              >
                <Utensils size={18} color={colors.dietary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.dietary }]}>
                Dietary Preferences
              </Text>
            </View>
            {dietaryLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.dietary}
                style={{ padding: SPACING.lg }}
              />
            ) : (
              <View style={styles.chipGrid}>
                {DIETARY_PREFERENCES.map((d) => {
                  const sel = userDietaryPrefs.some((x) => x.$id === d.$id);
                  return (
                    <TouchableOpacity
                      key={d.$id}
                      style={[styles.chip, sel && styles.chipSelectedDietary]}
                      onPress={() => toggleDietaryPref(d)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          sel && styles.chipTextSelected,
                        ]}
                      >
                        {d.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Settings Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.cardIconContainer,
                  { backgroundColor: `${colors.accent}15` },
                ]}
              >
                <Settings size={18} color={colors.accent} />
              </View>
              <Text style={styles.cardTitle}>Settings</Text>
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                {isDark ? (
                  <Moon size={20} color={colors.text} />
                ) : (
                  <Sun size={20} color={colors.text} />
                )}
                <Text style={styles.settingLabel}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() =>
                openModal({
                  title: 'Delete Account',
                  subtitle: 'Are you sure? This action cannot be undone.',
                  emoji: '⚠️',
                  primary: { label: 'Delete', onPress: handleDeleteAccount },
                  secondary: { label: 'Cancel' },
                })
              }
            >
              <Text style={styles.dangerButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.primaryButton, loading && { opacity: 0.6 }]}
              onPress={saveProfile}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Log Out</Text>
            </TouchableOpacity>
          </View>

          {/* About */}
          <TouchableOpacity
            style={styles.aboutToggle}
            onPress={() => setShowAbout((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.aboutToggleText}>
              {showAbout ? 'Hide About' : 'About & Legal'}
            </Text>
            <ChevronDown
              size={18}
              color={colors.primary}
              style={{ transform: [{ rotate: showAbout ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {showAbout && (
            <View style={styles.aboutSection}>
              <View style={styles.disclaimerBox}>
                <AlertCircle
                  size={20}
                  color="#f59e0b"
                  style={{ marginRight: SPACING.md }}
                />
                <Text style={styles.disclaimerText}>
                  This app helps avoid allergens in recipes but is not a
                  substitute for professional advice.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.linkRow}
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
                style={styles.linkRow}
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
      </ScrollView>
      <BetaFooter enabled={true} />
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: SPACING.xxl },
    contentContainer: {
      width: '100%',
      maxWidth: 600,
      alignSelf: 'center',
      paddingHorizontal: SPACING.lg,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      marginTop: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...SHADOWS.sm,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    cardIconContainer: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.sm,
      backgroundColor: `${colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: SPACING.md,
    },
    cardTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
      letterSpacing: -0.3,
    },
    inputGroup: { marginBottom: SPACING.md },
    inputRow: { flexDirection: 'row', gap: SPACING.md },
    inputLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      marginBottom: SPACING.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: Platform.OS === 'android' ? SPACING.sm : SPACING.md,
      fontSize: FONT_SIZES.md,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      backgroundColor: colors.backgroundLight,
    },
    inputDisabled: { opacity: 0.6 },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    chip: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.full,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.backgroundLight,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipSelectedDietary: {
      backgroundColor: colors.dietary,
      borderColor: colors.dietary,
    },
    chipText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    chipTextSelected: { color: '#FFFFFF' },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    settingLabel: {
      fontSize: FONT_SIZES.md,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    dangerButton: {
      marginTop: SPACING.lg,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.md,
      backgroundColor: `${colors.error}15`,
      alignItems: 'center',
    },
    dangerButtonText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: 'Inter-SemiBold',
      color: colors.error,
    },
    buttonRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.xl },
    primaryButton: {
      flex: 1,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      ...SHADOWS.sm,
    },
    primaryButtonText: {
      fontSize: FONT_SIZES.md,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    secondaryButton: {
      flex: 1,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.md,
      backgroundColor: colors.backgroundLight,
      borderWidth: 1.5,
      borderColor: colors.error,
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: FONT_SIZES.md,
      fontFamily: 'Inter-SemiBold',
      color: colors.error,
    },
    aboutToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.lg,
      marginTop: SPACING.md,
      gap: SPACING.sm,
    },
    aboutToggleText: {
      fontSize: FONT_SIZES.md,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },
    aboutSection: { paddingBottom: SPACING.lg },
    disclaimerBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#fef3c7',
      padding: SPACING.md,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.md,
    },
    disclaimerText: {
      flex: 1,
      fontSize: FONT_SIZES.sm,
      fontFamily: 'Inter-Regular',
      color: '#92400e',
      lineHeight: 20,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.md,
      gap: SPACING.sm,
    },
    linkText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
    },
    versionText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: 'Inter-Bold',
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: SPACING.md,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xxl,
    },
    modalContent: {
      backgroundColor: colors.surface,
      padding: SPACING.xxl,
      borderRadius: RADIUS.xl,
      width: '100%',
      maxWidth: 380,
      alignItems: 'center',
      ...SHADOWS.lg,
    },
    modalEmoji: { fontSize: 48, marginBottom: SPACING.lg },
    modalTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: SPACING.sm,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: SPACING.md,
      marginTop: SPACING.xl,
      width: '100%',
    },
    modalButtonSecondary: {
      flex: 1,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.md,
      backgroundColor: colors.backgroundLight,
      alignItems: 'center',
    },
    modalButtonSecondaryText: {
      fontSize: FONT_SIZES.md,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    modalButtonPrimary: {
      flex: 1,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.md,
      backgroundColor: colors.error,
      alignItems: 'center',
    },
    modalButtonPrimaryText: {
      fontSize: FONT_SIZES.md,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    pickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xxl,
    },
    pickerContent: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      width: '100%',
      maxWidth: 340,
      maxHeight: 400,
      ...SHADOWS.lg,
    },
    pickerTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: SPACING.md,
    },
    pickerList: { maxHeight: 280 },
    pickerOption: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerOptionText: {
      fontSize: FONT_SIZES.md,
      fontFamily: 'Inter-Regular',
      color: colors.text,
    },
    pickerCancel: {
      marginTop: SPACING.md,
      paddingVertical: SPACING.md,
      alignItems: 'center',
    },
    pickerCancelText: {
      fontSize: FONT_SIZES.md,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },
  });
