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
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import ThemedText from '@/components/ThemedText';
import { ALLERGENS } from '@/contexts/AllergensContext';
import { DIETARY_PREFERENCES } from '@/contexts/DietaryContext';
import SmartBitesLogo from '@/assets/images/smart-bites-logo.png'; // 72x72

const DismissWrapper = Platform.OS === 'web' ? React.Fragment : TouchableWithoutFeedback;

// Phone number formatting helper
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return digits;
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
};

// Phone number validation helper
const isValidPhoneNumber = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
};

// US States list
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];

interface AllergenRow {
  id: string;
  name: string;
}

interface DietaryPrefRow {
  id: string;
  name: string;
}

type ModalInfo = {
  visible: boolean;
  title: string;
  subtitle?: string;
  emoji?: string;
  primary?: { label: string; onPress?: () => void };
  secondary?: { label: string; onPress?: () => void };
};

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
  const [state, setState] = useState('');
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

  // Fetch from lookup tables
  const [allergens, setAllergens] = useState<AllergenRow[]>([]);
  const [dietPrefs, setDietPrefs] = useState<DietaryPrefRow[]>([]);
  const [loadingTaxonomies, setLoadingTaxonomies] = useState(true);

  useEffect(() => {
    const fetchTaxonomies = async () => {
      try {
        setLoadingTaxonomies(true);

        const { data: allergensData, error: allergensError } = await supabase
          .from('allergens')
          .select('id, name')
          .order('name');

        if (allergensError) {
          console.error('Error fetching allergens:', allergensError);
          setAllergens(ALLERGENS.map((a) => ({ id: a.$id, name: a.name })));
        } else {
          setAllergens(allergensData || []);
        }

        const { data: dietPrefsData, error: dietPrefsError } = await supabase
          .from('dietary_prefs')
          .select('id, name')
          .order('name');

        if (dietPrefsError) {
          console.error('Error fetching dietary preferences:', dietPrefsError);
          setDietPrefs(
            DIETARY_PREFERENCES.map((d) => ({ id: d.$id, name: d.name }))
          );
        } else {
          setDietPrefs(dietPrefsData || []);
        }
      } catch (error) {
        console.error('Error in fetchTaxonomies:', error);
        setAllergens(ALLERGENS.map((a) => ({ id: a.$id, name: a.name })));
        setDietPrefs(
          DIETARY_PREFERENCES.map((d) => ({ id: d.$id, name: d.name }))
        );
      } finally {
        setLoadingTaxonomies(false);
      }
    };

    fetchTaxonomies();
  }, []);

  // selections
  const [showAllergens, setShowAllergens] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [showStates, setShowStates] = useState(false);
  const [stateSearchText, setStateSearchText] = useState('');
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedPrefIds, setSelectedPrefIds] = useState<Set<string>>(
    new Set()
  );
  const [showConsent, setShowConsent] = useState(false);

  const toggle = (
    set: Set<string>,
    id: string,
    setter: (s: Set<string>) => void
  ) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
  };

  // Filter states based on search text

  const normalizePhone = (raw: string) => raw.replace(/[^\d+]/g, '');
  const zipOk = (z: string) => /^(\d{5})(-?\d{4})?$/.test(z.trim());
  const phoneOk = (p: string) => isValidPhoneNumber(p);

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
        subtitle: 'Please enter a valid 10-digit phone number.',
        emoji: '📞',
        primary: { label: 'OK' },
      });
      return;
    }

    setLoading(true);

    const { error: signErr } = await signUp(email, password, {
      first_name: firstName,
      last_name: lastName,
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

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      await supabase
        .from('user_profiles')
        .upsert(
          {
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            address1: address1.trim() || null,
            address2: address2.trim() || null,
            city: city.trim() || null,
            state: state.trim() || null,
            zip: zip.trim() || null,
            phone: phone.replace(/\D/g, '') || null,
          },
          { onConflict: 'user_id' }
        );

      if (selectedAllergenIds.size) {
        const ua = Array.from(selectedAllergenIds).map((allergenId) => {
          const allergen = allergens.find((a) => a.id === allergenId);
          return {
            user_id: userId,
            allergen_id: allergenId,
            allergen: allergen?.name || '',
          };
        });
        await supabase.from('user_allergens').insert(ua);
      }

      if (selectedPrefIds.size) {
        const udp = Array.from(selectedPrefIds).map((prefId) => {
          const dietPref = dietPrefs.find((d) => d.id === prefId);
          return {
            user_id: userId,
            dietary_pref_id: prefId,
            dietary_pref: dietPref?.name || '',
          };
        });
        await supabase.from('user_dietary_prefs').insert(udp);
      }
    } catch (error) {
      console.error('Error saving user data:', error);
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
        content: { flex: 1, paddingHorizontal: 16 },

        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
          paddingBottom: 8,
        },
        headerContent: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
        backButton: { padding: 6 },
        headerTitle: {
          fontSize: 28,
          fontFamily: 'Inter-Bold',
          color: '#FF8866',
          marginLeft: 12,
        },
        headerLogo: {
          width: 72,
          height: 72,
        },


        form: { gap: 8 },
        row: { flexDirection: 'row', gap: 8 },
        flex1: { flex: 1 },
        flex2: { flex: 2 },

       zipContainer: { width: 80 },
       phoneContainer: { width: 140 },

        // Platform-specific vertical padding (web-safe)
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 9,
          paddingHorizontal: 12,
          paddingVertical: Platform.select({ android: 10, ios: 8, default: 10 }),
          fontSize: 15,
          fontFamily: 'Inter-Regular',
          color: colors.text,
          backgroundColor: colors.surface,
        },

        // password with eye
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
          paddingVertical: Platform.select({ android: 10, ios: 8, default: 10 }),
          fontSize: 15,
          fontFamily: 'Inter-Regular',
          color: colors.text,
        },
        eyeButton: { padding: 6 },

        stateDropdown: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 9,
          backgroundColor: colors.surface,
          position: 'relative',
        },
        stateButton: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: Platform.select({ android: 10, ios: 8, default: 10 }),
        },
        stateButtonText: {
          fontSize: 15,
          fontFamily: 'Inter-Regular',
          color: state ? colors.text : colors.textSecondary,
        },

        sectionToggle: { alignItems: 'center', paddingVertical: 2, marginTop: 4 },
        sectionToggleText: {
          fontSize: 16,
          fontFamily: 'Inter-SemiBold',
          color: colors.primary,
        },

        sectionTitle: {
          fontSize: 18,
          fontFamily: 'Inter-SemiBold',
          color: colors.primary,
          marginTop: 0,
          marginBottom: 2,
          paddingHorizontal: 16,
        },
        sectionTitleDietary: {
          fontSize: 18,
          fontFamily: 'Inter-SemiBold',
          color: colors.dietary,
          marginTop: 0,
          marginBottom: 2,
          paddingHorizontal: 16,
        },

        chipGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 4,
          marginTop: 2,
          marginBottom: 4,
          paddingHorizontal: 16,
        },
        chip: {
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
        chipSelectedDietary: { backgroundColor: colors.dietary, borderColor: colors.dietary },
        chipText: { fontSize: 12, fontFamily: 'Inter-Medium', color: colors.text },
        chipTextSelected: { color: '#fff' },

        loadingContainer: {
          paddingHorizontal: 16,
          paddingVertical: 12,
          alignItems: 'center',
        },

        consentToggle: {
          alignItems: 'center',
          paddingVertical: 3,
          marginTop: 2,
        },
        consentToggleText: {
          fontSize: 14,
          fontFamily: 'Inter-SemiBold',
          color: colors.primary,
        },

        tosText: {
          fontSize: 10,
          textAlign: 'center',
          color: colors.textSecondary,
          marginTop: 4,
          lineHeight: 14,
        },
        tosLink: {
          textDecorationLine: 'underline',
          color: colors.accentDark,
          fontFamily: 'Inter-SemiBold',
        },

        button: {
          backgroundColor: colors.primary,
          paddingVertical: 10,
          borderRadius: 10,
          alignItems: 'center',
          marginTop: 2,
        },
        buttonDisabled: { opacity: 0.6 },
        buttonText: {
          fontSize: 15,
          fontFamily: 'Inter-SemiBold',
          color: '#FFFFFF',
        },

        footer: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 8,
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
        modalBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
        modalBtnText: { fontSize: 13, fontFamily: 'Inter-SemiBold', color: colors.text },
        modalBtnTextPrimary: { color: '#fff' },

        // State picker modal styles
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
        dropdownItemText: { fontSize: 15, fontFamily: 'Inter-Regular', color: colors.text },
        dropdownCancel: { marginTop: 8, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 14 },
        dropdownCancelText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: colors.primary },

        bottom: {
          paddingHorizontal: 24,
          paddingTop: 6,
          paddingBottom: insets.bottom + 12,
        },
        copyright: {
          fontSize: 14,
          textAlign: 'center',
          color: colors.textSecondary,
        },
      }),
    [colors, insets.bottom, state]
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
          {/* State picker modal */}
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
              <ScrollView style={styles.dropdownList} keyboardShouldPersistTaps="handled">
                {US_STATES.map((stateItem) => (
                  <TouchableOpacity
                    key={stateItem.code}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setState(stateItem.code);
                      setShowStates(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>
                      {stateItem.code} — {stateItem.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.dropdownCancel} onPress={() => setShowStates(false)}>
                <Text style={styles.dropdownCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Modal>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Link href="/(auth)" asChild>
                <TouchableOpacity style={styles.backButton}>
                  <ArrowLeft size={22} color={colors.text} />
                </TouchableOpacity>
              </Link>
              <Text style={styles.headerTitle}>Create Account</Text>
            </View>
            <Image
              source={SmartBitesLogo}
              style={styles.headerLogo}
              resizeMode="contain"
              accessible
              accessibilityLabel="SmartBites logo"
            />
          </View>

          {/* Body */}
          <DismissWrapper
            {...(Platform.OS !== 'web'
              ? { onPress: Keyboard.dismiss, accessible: false }
              : {})}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

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
                  autoCorrect={false}
                  textContentType="emailAddress"
                  autoComplete="email"
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
                    autoCorrect={false}
                    textContentType="newPassword"
                    autoComplete="new-password"
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
                    autoCorrect={false}
                    textContentType="password"
                    autoComplete="off"
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
  <View style={styles.flex2}>
    <TextInput
      style={styles.input}
      value={firstName}
      onChangeText={setFirstName}
      placeholder="First name"
      placeholderTextColor={colors.textSecondary}
      autoCapitalize="words"
      autoCorrect={false}
      textContentType="givenName"
      autoComplete="given-name"
    />
  </View>

  <View style={styles.flex1}>
    <TextInput
      style={styles.input}
      value={lastName}
      onChangeText={setLastName}
      placeholder="Last name"
      placeholderTextColor={colors.textSecondary}
      autoCapitalize="words"
      autoCorrect={false}
      textContentType="familyName"
      autoComplete="family-name"
    />
  </View>
</View>
                {/* Address */}
                <TextInput
                  style={styles.input}
                  value={address1}
                  onChangeText={setAddress1}
                  placeholder="Address line 1"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  autoCorrect={false}
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
                  autoCorrect={false}
                />
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.flex2]}
                    value={city}
                    onChangeText={setCity}
                    placeholder="City"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="words"
                    autoCorrect={false}
                    textContentType="addressCity"
                    returnKeyType="next"
                    onSubmitEditing={() => setShowStates(true)}
                  />
                  <TouchableOpacity
                    style={[styles.input, styles.flex1, styles.stateButton]}
                    onPress={() => setShowStates(true)}
                  >
                    <Text style={styles.stateButtonText}>
                      {state || 'State'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                 <View style={styles.zipContainer}>
                   <TextInput
                     style={styles.input}
                     value={zip}
                     onChangeText={setZip}
                     placeholder="ZIP"
                     placeholderTextColor={colors.textSecondary}
                     keyboardType="number-pad"
                     autoCapitalize="none"
                     autoCorrect={false}
                     maxLength={10}
                     textContentType="postalCode"
                     returnKeyType="next"
                   />
                 </View>
                 <View style={styles.phoneContainer}>
                   <TextInput
                     style={styles.input}
                     value={phone}
                     onChangeText={(text) => {
                       const formatted = formatPhoneNumber(text);
                       setPhone(formatted);
                     }}
                     placeholder="Phone"
                     placeholderTextColor={colors.textSecondary}
                     keyboardType="phone-pad"
                     autoCapitalize="none"
                     autoCorrect={false}
                     maxLength={14}
                     textContentType="telephoneNumber"
                     autoComplete="tel"
                     returnKeyType="done"
                   />
                 </View>
                </View>

                {/* Allergens */}
                <Text style={styles.sectionTitle}>Allergens</Text>
                {loadingTaxonomies ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : (
                  <View style={styles.chipGrid}>
                    {allergens.map((a) => {
                      const selected = selectedAllergenIds.has(a.id);
                      return (
                        <TouchableOpacity
                          key={a.id}
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
                <Text style={styles.sectionTitleDietary}>
                  Dietary Preferences
                </Text>
                {loadingTaxonomies ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.dietary} />
                  </View>
                ) : (
                  <View style={styles.chipGrid}>
                    {dietPrefs.map((d) => {
                      const selected = selectedPrefIds.has(d.id);
                      return (
                        <TouchableOpacity
                          key={d.id}
                          style={[
                            styles.chip,
                            selected && styles.chipSelectedDietary,
                          ]}
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

                {/* Collapsible Consent Section */}
                <TouchableOpacity
                  style={styles.consentToggle}
                  onPress={() => setShowConsent(!showConsent)}
                >
                  <Text style={styles.consentToggleText}>
                    Consent {showConsent ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {showConsent && (
                  <Text style={styles.tosText}>
                    By tapping "Create Account", I acknowledge that I have read
                    and agree to the{' '}
                    <Text
                      style={styles.tosLink}
                      onPress={() =>
                        Linking.openURL(
                          'https://www.privacypolicies.com/live/53f5c56f-677a-469f-aad9-1253eb6b75e4'
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
                    account-related communications using the information I
                    provide.
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Already have an account?{' '}
                  </Text>
                  <Link href="/(auth)/login" asChild>
                    <TouchableOpacity>
                      <Text style={styles.footerLink}>Sign In</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            </ScrollView>
          </DismissWrapper>

          {/* pinned bottom */}
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
                <Text
                  style={[styles.modalBtnText, styles.modalBtnTextPrimary]}
                >
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