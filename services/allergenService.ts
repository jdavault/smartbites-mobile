import { supabase } from '@/lib/supabase';

export interface Allergen {
  $id: string;
  name: string;
}

export interface UserAllergenData {
  userId: string;
  allergenId: string;
  allergenName: string;
}

export class AllergenService {
  static async getUserAllergens(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_allergens')
        .select('allergen')
        .eq('user_id', userId);

      if (error) {
        if (error.code === '42P01') {
          console.warn('Database tables not created yet. Please run the migration.');
          return [];
        }
        throw error;
      }

      return data?.map(item => item.allergen) || [];
    } catch (error) {
      console.error('Error fetching user allergens:', error);
      return [];
    }
  }

  static async setUserAllergens(userId: string, allergens: Allergen[]): Promise<void> {
    try {
      // Remove all existing allergens
      await supabase
        .from('user_allergens')
        .delete()
        .eq('user_id', userId);

      // Add new allergens
      if (allergens.length > 0) {
        const allergensData = allergens.map(allergen => ({
          user_id: userId,
          allergen: allergen.name,
        }));

        const { error } = await supabase
          .from('user_allergens')
          .insert(allergensData);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating user allergens:', error);
      throw error;
    }
  }

  static async addUserAllergen(userId: string, allergen: Allergen): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_allergens')
        .insert({
          user_id: userId,
          allergen: allergen.name,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding user allergen:', error);
      throw error;
    }
  }

  static async removeUserAllergen(userId: string, allergenName: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_allergens')
        .delete()
        .eq('user_id', userId)
        .eq('allergen', allergenName);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing user allergen:', error);
      throw error;
    }
  }
}