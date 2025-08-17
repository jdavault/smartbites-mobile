import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAllergens, ALLERGENS } from '@/contexts/AllergensContext';
import { useDietary, DIETARY_PREFERENCES } from '@/contexts/DietaryContext';
import { supabase } from '@/lib/supabase';
import { LogOut, Moon, Sun, Save, ChevronDown } from 'lucide-react-native';

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

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { colors, toggleTheme, isDark } = useTheme();
  const { userAllergens, toggleAllergen } = useAllergens();
  const { userDietaryPrefs, toggleDietaryPref } = useDietary();
  const { loading: allergensLoading } = useAllergens();
  const { loading: dietaryLoading } = useDietary();

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [showStates, setShowStates] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01') {
          console.warn('Database tables not created yet. Please run the migration.');
          return;
        }
        throw error;
      }

      if (data) {
        setProfile({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          address1: data.address1 || '',
          address2: data.address2 || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          phone: data.phone || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          first_name: profile.firstName,
          last_name: profile.lastName,
          address1: profile.address1,
          address2: profile.address2,
          city: profile.city,
          state: profile.state,
          zip: profile.zip,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      console.error('Save profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            await signOut();
          }
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 12,
    },
    title: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: '#FF8866',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
    },
    
    // Form styling matching registration
    form: { 
      gap: 12,
    },
    row: { 
      flexDirection: 'row', 
      gap: 8 
    },
    flex1: { 
      flex: 1 
    },
    flex2: { 
      flex: 2 
    },
    zipContainer: {
      width: 80,
    },
    phoneContainer: {
      flex: 1,
    },
    
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

    // State dropdown matching registration
    stateDropdown: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 9,
      backgroundColor: colors.background,
      position: 'relative',
    },
    stateButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    stateButtonText: {
      fontSize: 15,
      fontFamily: 'Inter-Regular',
      color: profile.state ? colors.text : colors.textSecondary,
    },
    stateList: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 9,
      maxHeight: 200,
      zIndex: 1000,
    },
    stateItem: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    stateItemLast: {
      borderBottomWidth: 0,
    },
    stateItemText: {
      fontSize: 15,
      fontFamily: 'Inter-Regular',
      color: colors.text,
    },

    // Form card wrapper
    formCard: {
      backgroundColor: colors.surface,
      marginHorizontal: 24,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },

    // Section styling
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
      marginTop: 6,
      marginBottom: 6,
      paddingHorizontal: 24,
    },

    // Chip grid styling matching registration
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      paddingHorizontal: 24,
      marginBottom: 12,
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
    chipText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    chipTextSelected: { 
      color: '#fff' 
    },

    // Theme toggle
    themeContainer: {
      paddingHorizontal: 24,
      paddingVertical: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      marginHorizontal: 24,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    themeText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.accent,
    },

    // Buttons
    button: {
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    buttonRow: {
      flexDirection: 'row',
      paddingHorizontal: 24,
      gap: 12,
      marginBottom: 16,
    },
    halfButton: {
      flex: 1,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    buttonText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
    },
    saveButtonText: {
      color: '#FFFFFF',
    },
    signOutButton: {
      backgroundColor: '#FFFFFF',
      borderColor: colors.error,
    },
    signOutButtonText: {
      color: colors.error,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account and preferences</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <View style={styles.form}>
          {/* Names */}
          <TextInput
            style={styles.input}
            value={profile.firstName}
            onChangeText={(text) => setProfile(prev => ({ ...prev, firstName: text }))}
            placeholder="First name"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            value={profile.lastName}
            onChangeText={(text) => setProfile(prev => ({ ...prev, lastName: text }))}
            placeholder="Last name"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />

          {/* Address */}
          <TextInput
            style={styles.input}
            value={profile.address1}
            onChangeText={(text) => setProfile(prev => ({ ...prev, address1: text }))}
            placeholder="Address line 1"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            value={profile.address2}
            onChangeText={(text) => setProfile(prev => ({ ...prev, address2: text }))}
            placeholder="Address line 2 (optional)"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />
          
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flex2]}
              value={profile.city}
              onChangeText={(text) => setProfile(prev => ({ ...prev, city: text }))}
              placeholder="City"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />
            <View style={[styles.stateDropdown, styles.flex1]}>
              <TouchableOpacity
                style={styles.stateButton}
                onPress={() => setShowStates(!showStates)}
              >
                <Text style={styles.stateButtonText}>
                  {profile.state || 'State'}
                </Text>
                <ChevronDown size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              
              {showStates && (
                <ScrollView style={styles.stateList} nestedScrollEnabled>
                  {US_STATES.map((stateItem, index) => (
                    <TouchableOpacity
                      key={stateItem.code}
                      style={[
                        styles.stateItem,
                        index === US_STATES.length - 1 && styles.stateItemLast
                      ]}
                      onPress={() => {
                        setProfile(prev => ({ ...prev, state: stateItem.code }));
                        setShowStates(false);
                      }}
                    >
                      <Text style={styles.stateItemText}>
                        {stateItem.code} - {stateItem.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={styles.zipContainer}>
              <TextInput
                style={styles.input}
                value={profile.zip}
                onChangeText={(text) => setProfile(prev => ({ ...prev, zip: text }))}
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
                onChangeText={(text) => setProfile(prev => ({ ...prev, phone: text }))}
                placeholder="Phone"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
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
              const selected = userAllergens.some(a => a.$id === allergen.$id);
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

        <Text style={styles.sectionTitle}>Dietary Preferences</Text>
        {dietaryLoading ? (
          <View style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
            <ActivityIndicator size="small" color={colors.dietary} />
          </View>
        ) : (
          <View style={styles.chipGrid}>
            {DIETARY_PREFERENCES.map((pref) => {
              const selected = userDietaryPrefs.some(p => p.$id === pref.$id);
              return (
                <TouchableOpacity
                  key={pref.$id}
                  style={[styles.chip, selected && styles.chipSelectedDietary]}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
            style={[styles.button, styles.saveButton, styles.halfButton, loading && { opacity: 0.6 }]}
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
            <Text style={[styles.buttonText, styles.signOutButtonText]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}