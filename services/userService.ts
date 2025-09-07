import { supabase } from '@/lib/supabase';

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

export interface CreateUserProfileData {
  userId: string;
  firstName: string;
  lastName: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
}

export interface UpdateUserProfileData {
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
}

export class UserService {
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01') {
          console.warn('Database tables not created yet. Please run the migration.');
          return null;
        }
        throw error;
      }

      if (!data) return null;

      return {
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
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  static async createUserProfile(profileData: CreateUserProfileData): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: profileData.userId,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          address1: profileData.address1,
          address2: profileData.address2,
          city: profileData.city,
          state: profileData.state,
          zip: profileData.zip,
          phone: profileData.phone,
        })
        .select()
        .single();

      if (error) throw error;

      return {
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
      };
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  static async updateUserProfile(userId: string, updates: UpdateUserProfileData): Promise<void> {
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
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  static async upsertUserProfile(profileData: CreateUserProfileData): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: profileData.userId,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          address1: profileData.address1,
          address2: profileData.address2,
          city: profileData.city,
          state: profileData.state,
          zip: profileData.zip,
          phone: profileData.phone,
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error upserting user profile:', error);
      throw error;
    }
  }
}