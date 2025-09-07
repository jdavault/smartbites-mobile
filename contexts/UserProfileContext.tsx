import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserService, type UserProfile, type UpdateUserProfileData } from '@/services/userService';
import { useAuth } from './AuthContext';

export type { UserProfile };

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
      const profileData = await UserService.getUserProfile(user.id);
      setProfile(profileData);
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
      const updateData: UpdateUserProfileData = {
        firstName: updates.firstName,
        lastName: updates.lastName,
        address1: updates.address1,
        address2: updates.address2,
        city: updates.city,
        state: updates.state,
        zip: updates.zip,
        phone: updates.phone,
      };

      await UserService.updateUserProfile(user.id, updateData);

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