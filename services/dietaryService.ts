import { supabase } from '@/lib/supabase';

export interface DietaryPref {
  $id: string;
  name: string;
}

export class DietaryService {
  static async getUserDietaryPrefs(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_dietary_prefs')
        .select('dietary_pref')
        .eq('user_id', userId);

      if (error) {
        if (error.code === '42P01') {
          console.warn('Database tables not created yet. Please run the migration.');
          return [];
        }
        throw error;
      }

      return data?.map(item => item.dietary_pref) || [];
    } catch (error) {
      console.error('Error fetching user dietary preferences:', error);
      return [];
    }
  }

  static async setUserDietaryPrefs(userId: string, prefs: DietaryPref[]): Promise<void> {
    try {
      // Remove all existing preferences
      await supabase
        .from('user_dietary_prefs')
        .delete()
        .eq('user_id', userId);

      // Add new preferences
      if (prefs.length > 0) {
        const prefsData = prefs.map(pref => ({
          user_id: userId,
          dietary_pref: pref.name,
        }));

        const { error } = await supabase
          .from('user_dietary_prefs')
          .insert(prefsData);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating user dietary preferences:', error);
      throw error;
    }
  }

  static async addUserDietaryPref(userId: string, pref: DietaryPref): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_dietary_prefs')
        .insert({
          user_id: userId,
          dietary_pref: pref.name,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding user dietary preference:', error);
      throw error;
    }
  }

  static async removeUserDietaryPref(userId: string, prefName: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_dietary_prefs')
        .delete()
        .eq('user_id', userId)
        .eq('dietary_pref', prefName);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing user dietary preference:', error);
      throw error;
    }
  }
}