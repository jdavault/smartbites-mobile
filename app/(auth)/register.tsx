// app/(auth)/register.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import ThemedText from '@/components/ThemedText';

type ModalInfo = {
  visible: boolean;
  title: string;
  subtitle?: string;
  emoji?: string;
  primary?: { label: string; onPress?: () => void };
  secondary?: { label: string; onPress?: () => void };
};

type Row = { id: string | number; name: string };

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');

  // ui
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // modal
  const [modal, setModal] = useState<ModalInfo>({ visible: false, title: '' });
  const openModal = (m: Omit<ModalInfo, 'visible'>) =>
    setModal({ ...m, visible: true });
  const closeModal = () => setModal((prev) => ({ ...prev, visible: false }));

  // taxonomy lists
  const [allergens, setAllergens] = useState<Row[]>([]);
  const [dietPrefs, setDietPrefs] = useState<Row[]>([]);
  const [loadingTaxonomies, setLoadingTaxonomies] = useState(true);

  // selections
  const [showAllergens, setShowAllergens] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<
    Set<string | number>
  >(new Set());
  const [selectedPrefIds, setSelectedPrefIds] = useState<Set<string | number>>(
    new Set()
  );

  useEffect(() => {
    (async () => {
      setLoadingTaxonomies(true);
      const [{ data: aData }, { data: dData }] = await Promise.all([
        supabase.from('allergens').select('id, name').order('name'),
        supabase.from('dietary_prefs').select('id, name').order('name'),
      ]);
      setAllergens(aData ?? []);
      setDietPrefs(dData ?? []);
      setLoadingTaxonomies(false);
    })();
  }, []);

  const toggle = (
    set: Set<string | number>,
    id: string | number,
    setter: (s: Set<string | number>) => void
  ) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
  };

  const normalizePhone = (raw: string) => raw.replace(/[^\d+]/g, '');
  const zipOk = (z: string) => /^(\d{5})(-?\d{4})?$/.test(z.trim());
  const phoneOk = (p: string) =>
    normalizePhone(p).replace(/\D/g, '').length >= 10;

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      openModal({
        title: 'Missing Information',
        subtitle:
          'Please fill in First name, Last name, Email, and both password fields.',
        emoji: '⚠️',
        primary: { label: 'OK' },
      });
      return;
    }
    if (password !== confirmPassword) {
      openModal({
        title: 'Passwords Do Not Match',
        subtitle: 'Please make sure both passwords are identical.',
        emoji: '🔐',
        primary: { label: 'OK' },
      });
      return;
    }
    if (password.length < 6) {
      openModal({
        title: 'Weak Password',
        subtitle: 'Password must be at least 6 characters long.',
        emoji: '🛡️',
        primary: { label: 'OK' },
      });
      return;
    }
    if (zip && !zipOk(zip)) {
      openModal({
        title: 'Invalid ZIP',
        subtitle: 'Please enter a valid 5-digit or 9-digit ZIP code.',
        emoji: '📮',
        primary: { label: 'OK' },
      });
      return;
    }
    if (phone && !phoneOk(phone)) {
      openModal({
        title: 'Invalid Phone',
        subtitle: 'Please enter a valid phone number.',
        emoji: '📞',
        primary: { label: 'OK' },
      });
      return;
    }

    setLoading(true);

    // 1) Create auth user
    const { error: signErr } = await signUp(email, password, {
      first_name: firstName,
      last_name: lastName,
      address1,
      address2,
      city,
      zip: zip.trim(),
      phone: normalizePhone(phone),
      //meta_allergens: Array.from(selectedAllergenIds),
      //meta_dietary_prefs: Array.from(selectedPrefIds),
    });
    if (signErr) {
      setLoading(false);
      openModal({
        title: signErr.message?.includes('already')
          ? 'Email Already Registered'
          : 'Registration Error',
        subtitle: signErr.message ?? 'Something went wrong.',
        emoji: signErr.message?.includes('already') ? '📧' : '❌',
        primary: signErr.message?.includes('already')
          ? {
              label: 'Sign In',
              onPress: () => {
                closeModal();
                router.replace('/(auth)/login');
              },
            }
          : { label: 'OK' },
        secondary: signErr.message?.includes('already')
          ? { label: 'Cancel' }
          : undefined,
      });
      return;
    }

    // 2) Persist selections into relation tables
    let userId = user?.id as string | undefined;
    if (!userId) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
    }
    if (userId) {
      try {
        if (selectedAllergenIds.size) {
          const ua = Array.from(selectedAllergenIds).map((allergen_id) => ({
            user_id: userId!,
            allergen_id,
          }));
          await supabase.from('user_allergens').upsert(ua, {
            onConflict: 'user_id,allergen_id',
          });
        }
        if (selectedPrefIds.size) {
          const udp = Array.from(selectedPrefIds).map((pref_id) => ({
            user_id: userId!,
            // change to dietary_pref_id if that’s your schema
            pref_id,
          }));
          await supabase.from('user_dietary_prefs').upsert(udp, {
            onConflict: 'user_id,pref_id',
          });
        }
      } catch {
        // continue; user can add later
      }
    }

    setLoading(false);
    openModal({
      title: 'Account Created!',
      subtitle: 'You can now sign in to SmartBites.',
      emoji: '🎉',
      primary: {
        label: 'Go to Sign In',
        onPress: () => {
          closeModal();
          router.replace('/(auth)/login');
        },
      },
    });
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        // tighter page padding to fit more content
        content: { flex: 1, paddingHorizontal: 16 },

        // tighter header (keeps back button but removes extra space above title)
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 8, // ↓ was 12–16
          paddingBottom: 8, // ↓ was ~20–32
        },
        backButton: { padding: 6 },

        // title with NO extra top padding/margin above it
        title: {
          fontSize: 24, // ↓ a touch smaller
          fontFamily: 'Inter-Bold',
          color: '#FF8866',
          textAlign: 'center',
          marginTop: 0, // ← ensure no top margin
          marginBottom: 8, // small breathing room
        },

        // form spacing + input sizing (compact)
        form: { gap: 10 }, // ↓ was 12–20
        row: { flexDirection: 'row', gap: 8 },
        flex1: { flex: 1 },
        flex2: { flex: 2 },

        input: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 9,
          paddingHorizontal: 12,
          paddingVertical: 9, // ↓ was 11–12
          fontSize: 15, // ↓ was 16
          fontFamily: 'Inter-Regular',
          color: colors.text,
          backgroundColor: colors.surface,
        },

        // password with eye (compact)
        pwWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 9,
          backgroundColor: colors.surface,
        },
        pwInput: {
          flex: 1,
          paddingHorizontal: 12,
          paddingVertical: 9, // ↓
          fontSize: 15, // ↓
          fontFamily: 'Inter-Regular',
          color: colors.text,
        },
        eyeButton: { padding: 8 }, // ↓

        // collapsible section toggles (compact)
        sectionToggle: {
          alignItems: 'center',
          paddingVertical: 4, // ↓
          marginTop: 6, // small
        },
        sectionToggleText: {
          fontSize: 16, // ↓
          fontFamily: 'Inter-SemiBold',
          color: colors.primary,
        },

        // chips (compact grid + reduced margins to fit screen)
        chipGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6, // ↓
          marginTop: 4, // ↓
          marginBottom: 6, // ↓ keep very small bottom space
        },
        chip: {
          paddingVertical: 6, // ↓
          paddingHorizontal: 10, // ↓
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        chipSelected: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        chipText: {
          fontSize: 12, // ↓
          fontFamily: 'Inter-Medium',
          color: colors.text,
        },
        chipTextSelected: { color: '#fff' },

        // terms text (kept small)
        tosText: {
          fontSize: 11,
          textAlign: 'center',
          color: colors.textSecondary,
          marginTop: 6, // ↓
          lineHeight: 16, // ↓
        },
        tosLink: {
          textDecorationLine: 'underline',
          color: colors.accentDark,
          fontFamily: 'Inter-SemiBold',
        },

        // button (compact height)
        button: {
          backgroundColor: colors.primary,
          paddingVertical: 12, // ↓
          borderRadius: 10,
          alignItems: 'center',
          marginTop: 6, // ↓
        },
        buttonDisabled: { opacity: 0.6 },
        buttonText: {
          fontSize: 15, // ↓
          fontFamily: 'Inter-SemiBold',
          color: '#FFFFFF',
        },

        // footer (compact)
        footer: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 14, // ↓
          marginBottom: Math.max(insets.bottom, 8),
        },
        footerText: {
          fontSize: 13,
          fontFamily: 'Inter-Regular',
          color: colors.textSecondary,
        },
        footerLink: {
          fontSize: 13,
          fontFamily: 'Inter-SemiBold',
          color: colors.primary,
        },

        // modal
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        },
        modalCard: {
          width: '100%',
          maxWidth: 420,
          backgroundColor: colors.surface,
          borderRadius: 14,
          padding: 18,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
        },
        modalEmoji: { fontSize: 40, marginBottom: 6 },
        modalTitle: {
          fontSize: 17,
          fontFamily: 'Inter-SemiBold',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 4,
        },
        modalSubtitle: {
          fontSize: 13,
          fontFamily: 'Inter-Regular',
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 14,
        },
        modalButtons: {
          flexDirection: 'row',
          gap: 10,
          alignSelf: 'stretch',
          justifyContent: 'center',
        },
        modalBtn: {
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 9,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.backgroundLight,
          minWidth: 112,
          alignItems: 'center',
        },
        modalBtnPrimary: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        modalBtnText: {
          fontSize: 13,
          fontFamily: 'Inter-SemiBold',
          color: colors.text,
        },
        modalBtnTextPrimary: { color: '#fff' },
        bottom: {
          paddingHorizontal: 24,
          paddingTop: 6,
          paddingBottom: insets.bottom + 12, // keeps it above the iPhone home indicator
        },
        copyright: {
          fontSize: 14,
          textAlign: 'center',
          color: colors.textSecondary,
        },
      }),
    [colors, insets.bottom]
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Gradient fills the screen */}
      <LinearGradient
        colors={[colors.background, colors.textRice]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Link href="/(auth)" asChild>
              <TouchableOpacity style={styles.backButton}>
                <ArrowLeft size={22} color={colors.text} />
              </TouchableOpacity>
            </Link>
          </View>

          {/* Body */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Create Account</Text>
            {/* subtitle removed on purpose */}

            <View style={styles.form}>
              {/* Email + Passwords first (compact, no labels) */}
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="next"
              />

              <View style={styles.pwWrap}>
                <TextInput
                  style={styles.pwInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  textContentType="newPassword"
                  autoComplete="new-password"
                  returnKeyType="next"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={colors.textSecondary} />
                  ) : (
                    <Eye size={18} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.pwWrap}>
                <TextInput
                  style={styles.pwInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  textContentType="password"
                  autoComplete="off"
                  returnKeyType="next"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color={colors.textSecondary} />
                  ) : (
                    <Eye size={18} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Names */}
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.flex1]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  textContentType="givenName"
                />
                <TextInput
                  style={[styles.input, styles.flex1]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  textContentType="familyName"
                />
              </View>

              {/* Address */}
              <TextInput
                style={styles.input}
                value={address1}
                onChangeText={setAddress1}
                placeholder="Address line 1"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
                textContentType="fullStreetAddress"
                autoComplete="street-address"
              />
              <TextInput
                style={styles.input}
                value={address2}
                onChangeText={setAddress2}
                placeholder="Address line 2 (optional)"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.flex2]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  textContentType="addressCity"
                />
                <TextInput
                  style={[styles.input, styles.flex1]}
                  value={zip}
                  onChangeText={setZip}
                  placeholder="ZIP"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  maxLength={10}
                  textContentType="postalCode"
                />
              </View>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                autoCapitalize="none"
                textContentType="telephoneNumber"
                autoComplete="tel"
              />

              {/* Allergens */}
              <TouchableOpacity
                onPress={() => setShowAllergens((v) => !v)}
                style={styles.sectionToggle}
                disabled={loadingTaxonomies}
              >
                <Text style={styles.sectionToggleText}>
                  {showAllergens ? 'Hide Allergens' : 'Select Allergens'}
                </Text>
                {loadingTaxonomies ? (
                  <ActivityIndicator style={{ marginTop: 2 }} />
                ) : showAllergens ? (
                  <ChevronUp size={16} color={colors.primary} />
                ) : (
                  <ChevronDown size={16} color={colors.primary} />
                )}
              </TouchableOpacity>

              {showAllergens && !loadingTaxonomies && (
                <View style={styles.chipGrid}>
                  {allergens.map((a) => {
                    const selected = selectedAllergenIds.has(a.id);
                    return (
                      <TouchableOpacity
                        key={String(a.id)}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() =>
                          toggle(
                            selectedAllergenIds,
                            a.id,
                            setSelectedAllergenIds
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selected && styles.chipTextSelected,
                          ]}
                        >
                          {a.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Dietary Preferences */}
              <TouchableOpacity
                onPress={() => setShowPrefs((v) => !v)}
                style={styles.sectionToggle}
                disabled={loadingTaxonomies}
              >
                <Text style={styles.sectionToggleText}>
                  {showPrefs
                    ? 'Hide Dietary Preferences'
                    : 'Select Dietary Preferences'}
                </Text>
                {loadingTaxonomies ? (
                  <ActivityIndicator style={{ marginTop: 2 }} />
                ) : showPrefs ? (
                  <ChevronUp size={16} color={colors.primary} />
                ) : (
                  <ChevronDown size={16} color={colors.primary} />
                )}
              </TouchableOpacity>

              {showPrefs && !loadingTaxonomies && (
                <View style={styles.chipGrid}>
                  {dietPrefs.map((d) => {
                    const selected = selectedPrefIds.has(d.id);
                    return (
                      <TouchableOpacity
                        key={String(d.id)}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() =>
                          toggle(selectedPrefIds, d.id, setSelectedPrefIds)
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selected && styles.chipTextSelected,
                          ]}
                        >
                          {d.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Terms of Service (compact) */}
              <Text style={styles.tosText}>
                By tapping “Create Account”, I acknowledge that I have read and
                agree to the{' '}
                <Text
                  style={styles.tosLink}
                  onPress={() =>
                    Linking.openURL(
                      'https://www.privacypolicies.com/live/1a6f589d-84cc-4f85-82b9-802b08c501b2'
                    )
                  }
                >
                  Privacy Policy
                </Text>{' '}
                and{' '}
                <Text
                  style={styles.tosLink}
                  onPress={() =>
                    Linking.openURL(
                      'https://www.privacypolicies.com/live/53f5c56f-677a-469f-aad9-1253eb6b75e4'
                    )
                  }
                >
                  Terms of Service
                </Text>
                . I also consent to being contacted by SmartBites™ for
                account-related communications using the information I provide.
              </Text>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              {/* Inline auth footer (compact) */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text style={styles.footerLink}>Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </ScrollView>
          {/* <-- pinned bottom */}
          <View style={styles.bottom}>
            <ThemedText style={styles.copyright}>
              <Text style={{ fontWeight: 'bold' }}>SmartBites</Text>
              <Text>™ © 2025</Text>
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>

      {/* Feedback Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={modal.visible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {!!modal.emoji && (
              <Text style={styles.modalEmoji}>{modal.emoji}</Text>
            )}
            <Text style={styles.modalTitle}>{modal.title}</Text>
            {!!modal.subtitle && (
              <Text style={styles.modalSubtitle}>{modal.subtitle}</Text>
            )}

            <View style={styles.modalButtons}>
              {modal.secondary && (
                <TouchableOpacity style={styles.modalBtn} onPress={closeModal}>
                  <Text style={styles.modalBtnText}>
                    {modal.secondary.label}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={() => {
                  if (modal.primary?.onPress) modal.primary.onPress();
                  else closeModal();
                }}
              >
                <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>
                  {modal.primary?.label ?? 'OK'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
