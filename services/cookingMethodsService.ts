import { supabase } from '@/lib/supabase';

export interface CookingMethod {
  $id: string;
  name: string;
  description?: string;
}

export class CookingMethodsService {
  static async getAllCookingMethods(): Promise<CookingMethod[]> {
    try {
      const { data, error } = await supabase
        .from('cooking_methods')
        .select('*')
        .order('name');

      if (error) {
        if (error.code === '42P01') {
          console.warn('Cooking methods table not created yet. Please run the migration.');
          return [];
        }
        throw error;
      }

      return data?.map(method => ({
        $id: method.id,
        name: method.name,
        description: method.description,
      })) || [];
    } catch (error) {
      console.error('Error fetching cooking methods:', error);
      return [];
    }
  }

  static async getRecipeCookingMethods(recipeId: string): Promise<CookingMethod[]> {
    try {
      const { data, error } = await supabase
        .from('recipe_cooking_methods')
        .select(`
          cooking_methods (
            id,
            name,
            description
          )
        `)
        .eq('recipe_id', recipeId);

      if (error) throw error;

      return data?.map(item => ({
        $id: item.cooking_methods.id,
        name: item.cooking_methods.name,
        description: item.cooking_methods.description,
      })) || [];
    } catch (error) {
      console.error('Error fetching recipe cooking methods:', error);
      return [];
    }
  }

  static async setRecipeCookingMethods(recipeId: string, methods: CookingMethod[]): Promise<void> {
    try {
      // Remove existing cooking methods for this recipe
      await supabase
        .from('recipe_cooking_methods')
        .delete()
        .eq('recipe_id', recipeId);

      // Add new cooking methods
      if (methods.length > 0) {
        const methodsData = methods.map(method => ({
          recipe_id: recipeId,
          cooking_method_id: method.$id,
        }));

        const { error } = await supabase
          .from('recipe_cooking_methods')
          .insert(methodsData);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating recipe cooking methods:', error);
      throw error;
    }
  }
}