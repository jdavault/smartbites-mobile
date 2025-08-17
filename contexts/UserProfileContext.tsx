import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01') {
          console.warn('Database tables not created yet. Please run the migration.');
          setProfile(null);
          return;
        }
        throw error;
      }

      if (data) {
        setProfile({
          id: data.id,
          userId: data.user_id,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          address1: data.address1 || '',
          address2: data.address2 || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          phone: data.phone || '',
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          address1: updates.address1,
          address2: updates.address2,
          city: updates.city,
          state: updates.state,
          zip: updates.zip,
          phone: updates.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        loading,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}