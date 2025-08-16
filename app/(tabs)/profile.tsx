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
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAllergens, ALLERGENS } from '@/contexts/AllergensContext';
import { useDietary, DIETARY_PREFERENCES } from '@/contexts/DietaryContext';
import { supabase } from '@/lib/supabase';
import { LogOut, Moon, Sun, Save } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
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
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile exists yet - this is expected for new users
          return;
        }
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
            try {
             setLoading(true);
              await signOut();
             // Navigation will be handled automatically by the auth context
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
           } finally {
             setLoading(false);
            }
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
      paddingBottom: 24,
    },
    title: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 16,
      paddingHorizontal: 24,
    },
    form: {
      paddingHorizontal: 24,
      gap: 16,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    flex1: {
      flex: 1,
    },
    inputContainer: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      backgroundColor: colors.surface,
    },
    allergenContainer: {
      paddingHorizontal: 24,
      gap: 12,
    },
    allergenItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      opacity: 1,
    },
    allergenItemLoading: {
      opacity: 0.6,
    },
    allergenText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
    },
    themeContainer: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      marginHorizontal: 24,
      borderRadius: 12,
    },
    themeText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginHorizontal: 24,
      marginBottom: 16,
    },
    buttonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    signOutButton: {
      backgroundColor: colors.error,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account and preferences</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.flex1]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={profile.firstName}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, firstName: text }))}
                  placeholder="First name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={[styles.inputContainer, styles.flex1]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={profile.lastName}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, lastName: text }))}
                  placeholder="Last name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={profile.address1}
                onChangeText={(text) => setProfile(prev => ({ ...prev, address1: text }))}
                placeholder="Street address"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address Line 2</Text>
              <TextInput
                style={styles.input}
                value={profile.address2}
                onChangeText={(text) => setProfile(prev => ({ ...prev, address2: text }))}
                placeholder="Apartment, suite, etc. (optional)"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.flex1]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  value={profile.city}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, city: text }))}
                  placeholder="City"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={[styles.inputContainer, { flex: 0.6 }]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  value={profile.state}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, state: text }))}
                  placeholder="State"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={[styles.inputContainer, { flex: 0.6 }]}>
                <Text style={styles.label}>ZIP</Text>
                <TextInput
                  style={styles.input}
                  value={profile.zip}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, zip: text }))}
                  placeholder="ZIP"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={profile.phone}
                onChangeText={(text) => setProfile(prev => ({ ...prev, phone: text }))}
                placeholder="Phone number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergens</Text>
          <View style={styles.allergenContainer}>
            {ALLERGENS.map((allergen) => (
              <View key={allergen.$id} style={[
                styles.allergenItem,
                allergensLoading && styles.allergenItemLoading
              ]}>
                <Text style={styles.allergenText}>{allergen.name}</Text>
                <Switch
                  value={userAllergens.some(a => a.$id === allergen.$id)}
                  onValueChange={() => !allergensLoading && toggleAllergen(allergen)}
                  disabled={allergensLoading}
                  trackColor={{ false: '#e6e2d6', true: '#FF8866' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Preferences</Text>
          <View style={styles.allergenContainer}>
            {DIETARY_PREFERENCES.map((pref) => (
              <View key={pref.$id} style={[
                styles.allergenItem,
                dietaryLoading && styles.allergenItemLoading
              ]}>
                <Text style={styles.allergenText}>{pref.name}</Text>
                <Switch
                  value={userDietaryPrefs.some(p => p.$id === pref.$id)}
                  onValueChange={() => !dietaryLoading && toggleDietaryPref(pref)}
                  disabled={dietaryLoading}
                  trackColor={{ false: '#e6e2d6', true: '#073c51' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
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
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={saveProfile}
          disabled={loading}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {loading ? 'Saving...' : 'Save Profile'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.signOutButton]}
          onPress={handleSignOut}
        >
          <LogOut size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}