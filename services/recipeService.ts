import { supabase } from '@/lib/supabase';
import { generateAndUploadImage } from '@/utils/generateAndUploadImage';
import { formatImageName } from '@/utils/filenames';
import { buildSearchKey } from '@/utils/recipeKeys';
import type { Recipe } from '@/contexts/RecipesContext';

export interface SaveRecipeData {
  recipe: Recipe;
  userId: string;
  userAllergens: string[];
  userDietaryPrefs: string[];
  isFavorite?: boolean;
}

export interface UserRecipeData {
  id: string;
  title: string;
  headNote: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  searchQuery: string;
  searchKey: string;
  allergens: string[];
  dietaryPrefs: string[];
  notes: string;
  nutritionInfo: string;
  image?: string;
  allergensIncluded: string;
  isFavorite: boolean;
  actions: string[];
  createdAt: string;
}

const DEFAULT_RECIPE_IMAGE = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';

export class RecipeService {
  static async getUserRecipes(userId: string): Promise<UserRecipeData[]> {
    try {
      const { data, error } = await supabase
        .from('user_recipes')
        .select(`
          *,
          recipes (
            *,
            recipe_allergens (
              allergen_id,
              allergens (name)
            ),
            recipe_dietary_prefs (
              dietary_pref_id,
              dietary_prefs (name)
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false, foreignTable: 'recipes' });

      if (error) {
        if (error.code === '42P01') {
          console.warn('Database tables not created yet. Please run the migration.');
          return [];
        }
        throw error;
      }

      return data?.map(item => ({
        id: item.recipes.id,
        title: item.recipes.title,
        headNote: item.recipes.head_note || '',
        description: item.recipes.description || '',
        ingredients: item.recipes.ingredients || [],
        instructions: item.recipes.instructions || [],
        prepTime: item.recipes.prep_time || '',
        cookTime: item.recipes.cook_time || '',
        servings: item.recipes.servings || 4,
        difficulty: item.recipes.difficulty || 'easy',
        tags: item.recipes.tags || [],
        searchQuery: item.recipes.search_query || '',
        searchKey: item.recipes.search_key || '',
        allergens: item.recipes.recipe_allergens?.map((ra: any) => ra.allergens?.name).filter(Boolean) || [],
        dietaryPrefs: item.recipes.recipe_dietary_prefs?.map((rd: any) => rd.dietary_prefs?.name).filter(Boolean) || [],
        notes: item.recipes.notes || '',
        nutritionInfo: item.recipes.nutrition_info || '',
        image: item.recipes.image,
        allergensIncluded: item.recipes.allergens_included || '',
        isFavorite: item.actions?.includes('favorite') || false,
        actions: item.actions || [],
        createdAt: item.recipes.created_at,
      })) || [];
    } catch (error) {
      console.error('Error fetching user recipes:', error);
      throw error;
    }
  }

  static async getFeaturedRecipes(userId: string, userAllergens: string[], userDietaryPrefs: string[]): Promise<UserRecipeData[]> {
    try {
      // Get user's saved recipe IDs to exclude them
      const { data: userRecipeData, error: userRecipeError } = await supabase
        .from('user_recipes')
        .select('recipe_id')
        .eq('user_id', userId);

      if (userRecipeError) throw userRecipeError;
      
      const savedRecipeIds = userRecipeData?.map(ur => ur.recipe_id) || [];

      // Get allergen and dietary preference IDs from lookup tables
      let allergenIds: string[] = [];
      let dietaryIds: string[] = [];
      
      if (userAllergens.length > 0) {
        const { data: allergenData, error: allergenError } = await supabase
          .from('allergens')
          .select('id')
          .in('name', userAllergens);
        
        if (allergenError) throw allergenError;
        allergenIds = allergenData?.map(a => a.id) || [];
      }
      
      if (userDietaryPrefs.length > 0) {
        const { data: dietaryData, error: dietaryError } = await supabase
          .from('dietary_prefs')
          .select('id')
          .in('name', userDietaryPrefs);
        
        if (dietaryError) throw dietaryError;
        dietaryIds = dietaryData?.map(d => d.id) || [];
      }

      // Get recipes with relationships, excluding user's saved recipes
      let query = supabase
        .from('recipes')
        .select(`
          *,
          recipe_allergens (
            allergen_id
          ),
          recipe_dietary_prefs (
            dietary_pref_id
          )
        `)
        .limit(20)
        .order('created_at', { ascending: false });

      if (savedRecipeIds.length > 0) {
        query = query.not('id', 'in', `(${savedRecipeIds.join(',')})`);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [];

      console.log('🔍 Raw recipes from DB:', data?.length || 0);
      
      // Debug: Log what allergen/dietary IDs we're looking for
      console.log('🔍 User allergen names:', userAllergens);
      console.log('🔍 User allergen IDs we need recipes to avoid:', allergenIds);
      console.log('🔍 User dietary names:', userDietaryPrefs);
      console.log('🔍 User dietary IDs we need recipes to support:', dietaryIds);
      
      // Debug: Log first few recipes and their relationships
      if (data && data.length > 0) {
        console.log('🔍 Sample recipe relationships:');
        data.slice(0, 2).forEach((recipe, idx) => {
          console.log(`  Recipe ${idx + 1}: "${recipe.title}"`);
          console.log(`    Avoids allergen IDs:`, recipe.recipe_allergens?.map((ra: any) => ra.allergen_id) || []);
          console.log(`    Supports dietary IDs:`, recipe.recipe_dietary_prefs?.map((rd: any) => rd.dietary_pref_id) || []);
        });
      }
      
      let filteredRecipes = data;
      console.log('🔍 After initial filter:', filteredRecipes.length);

      // Filter out recipes that contain user's allergens
      if (allergenIds.length > 0) {
        const beforeAllergenFilter = filteredRecipes.length;
        filteredRecipes = filteredRecipes.filter(recipe => {
          const recipeAllergenIds = recipe.recipe_allergens?.map((ra: any) => ra.allergen_id) || [];
          // Show recipes that DON'T contain ANY of the user's allergens
          // If user is allergic to Eggs, recipe must not contain Eggs
          const recipeContainsUserAllergen = allergenIds.some(userAllergenId => 
            recipeAllergenIds.includes(userAllergenId)
          );
          
          if (recipeContainsUserAllergen) {
            const containedAllergens = allergenIds.filter(id => recipeAllergenIds.includes(id));
            console.log(`🔍 Filtering out recipe "${recipe.title}" - contains user allergens:`, containedAllergens);
          }
          
          return !recipeContainsUserAllergen;
        });
        console.log(`🔍 After allergen filter: ${filteredRecipes.length} (filtered out ${beforeAllergenFilter - filteredRecipes.length})`);
      }

      // Filter by dietary preferences - show recipes that support ALL user preferences
      if (dietaryIds.length > 0) {
        const beforeDietaryFilter = filteredRecipes.length;
        filteredRecipes = filteredRecipes.filter(recipe => {
          const recipeDietaryIds = recipe.recipe_dietary_prefs?.map((rd: any) => rd.dietary_pref_id) || [];
          // Show recipes where ALL user dietary preferences are supported
          // User's dietary prefs must be a subset of recipe's supported prefs
          const allUserPrefsSupported = dietaryIds.every(userPrefId => 
            recipeDietaryIds.includes(userPrefId)
          );
          
          if (!allUserPrefsSupported) {
            const missingPrefs = dietaryIds.filter(id => !recipeDietaryIds.includes(id));
            console.log(`🔍 Filtering out recipe "${recipe.title}" - doesn't support all user prefs. Missing:`, missingPrefs);
          }
          
          return allUserPrefsSupported;
        });
        console.log(`🔍 After dietary filter: ${filteredRecipes.length} (filtered out ${beforeDietaryFilter - filteredRecipes.length})`);
      } else {
        console.log('🔍 No dietary preferences - showing all recipes after allergen filter');
      }

      if (filteredRecipes.length === 0) return [];

      // Randomize and take 5
      const shuffled = filteredRecipes.sort(() => 0.5 - Math.random());
      const selectedRecipes = shuffled.slice(0, 5);

      // Get allergen and dietary preference names for display
      const { data: allAllergens } = await supabase
        .from('allergens')
        .select('id, name');
      
      const { data: allDietaryPrefs } = await supabase
        .from('dietary_prefs')
        .select('id, name');
      
      if (!allAllergens || !allDietaryPrefs) return [];

      const allergenMap = new Map(allAllergens?.map(a => [a.id, a.name]) || []);
      const dietaryMap = new Map(allDietaryPrefs?.map(d => [d.id, d.name]) || []);

      return selectedRecipes.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        headNote: recipe.head_note || '',
        description: recipe.description || '',
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        prepTime: recipe.prep_time || '',
        cookTime: recipe.cook_time || '',
        servings: recipe.servings || 4,
        difficulty: recipe.difficulty || 'easy',
        tags: recipe.tags || [],
        searchQuery: recipe.search_query || '',
        searchKey: recipe.search_key || '',
        allergens: recipe.recipe_allergens?.map((ra: any) => allergenMap.get(ra.allergen_id)).filter(Boolean) || [],
        dietaryPrefs: recipe.recipe_dietary_prefs?.map((rd: any) => dietaryMap.get(rd.dietary_pref_id)).filter(Boolean) || [],
        notes: recipe.notes || '',
        nutritionInfo: recipe.nutrition_info || '',
        image: recipe.image,
        allergensIncluded: recipe.allergens_included || '',
        isFavorite: false,
        actions: [],
        createdAt: recipe.created_at,
      }));
    } catch (error) {
      console.error('Error fetching featured recipes:', error);
      return [];
    }
  }

  static async saveRecipe(data: SaveRecipeData): Promise<string> {
    const { recipe, userId, userAllergens, userDietaryPrefs, isFavorite = false } = data;
    
    try {
      const searchKey = buildSearchKey({
        searchQuery: recipe.searchQuery,
        userAllergens,
        userDietaryPrefs,
        title: recipe.title,
        headNote: recipe.headNote,
        description: recipe.description,
      });

      // Check if recipe already exists
      const { data: existingRecipes, error: checkError } = await supabase
        .from('recipes')
        .select('id, image')
        .eq('search_key', searchKey);

      if (checkError) throw checkError;

      let recipeId: string;
      let finalImageFilename = null;

      if (existingRecipes && existingRecipes.length > 0) {
        // Recipe exists - use existing one
        recipeId = existingRecipes[0].id;
        finalImageFilename = existingRecipes[0].image;
        console.log('Using existing recipe:', recipeId);
      } else {
        // Create new recipe
        console.log('💾 Saving new recipe to DB:');
        console.log('💾 recipe.allergensIncluded from OpenAI:', recipe.allergensIncluded);
        
        const allergensContained = Array.isArray(recipe.allergensIncluded) 
          ? recipe.allergensIncluded.join(', ')
          : (recipe.allergensIncluded || '');
        
        console.log('💾 allergensContained for DB:', allergensContained);
        
        const { data: recipeData, error: recipeError } = await supabase
          .from('recipes')
          .insert([{
            title: recipe.title,
            head_note: recipe.headNote,
            description: recipe.description,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            prep_time: recipe.prepTime,
            cook_time: recipe.cookTime,
            servings: recipe.servings,
            difficulty: recipe.difficulty,
            tags: recipe.tags,
            search_query: recipe.searchQuery,
            search_key: searchKey,
            notes: recipe.notes,
            nutrition_info: recipe.nutritionInfo,
            allergens_included: allergensContained,
            image: null,
          }])
          .select()
          .single();

        console.log('💾 Inserted recipe data:', recipeData);
        
        if (recipeError) throw recipeError;
        recipeId = recipeData.id;

        // Generate and persist image
        try {
          await this.persistRecipeImage({
            recipeTitle: recipe.title,
            searchQuery: recipe.searchQuery,
            allergenNames: userAllergens,
            recipeId,
            userId,
          });
          
          // Wait for image processing
          let attempts = 0;
          const maxAttempts = 10;
          while (attempts < maxAttempts) {
            const { data: updatedRecipe, error } = await supabase
              .from('recipes')
              .select('image')
              .eq('id', recipeId)
              .single();

            if (!error && updatedRecipe?.image) {
              finalImageFilename = updatedRecipe.image;
              break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
          }
        } catch (imageError) {
          console.warn('🖼️ Error persisting image (continuing without image):', imageError);
        }

        // Insert allergen relationships
        if (recipe.allergens.length > 0) {
          const { data: allergenData, error: allergenError } = await supabase
            .from('allergens')
            .select('id, name')
            .in('name', recipe.allergens);

          if (allergenError) throw allergenError;

          if (allergenData && allergenData.length > 0) {
            const allergenRelationships = allergenData.map(allergen => ({
              recipe_id: recipeId,
              allergen_id: allergen.id,
            }));

            const { error: allergenRelError } = await supabase
              .from('recipe_allergens')
              .insert(allergenRelationships);

            if (allergenRelError) throw allergenRelError;
          }
        }

        // Insert dietary preference relationships
        if (recipe.dietaryPrefs.length > 0) {
          const { data: dietaryData, error: dietaryError } = await supabase
            .from('dietary_prefs')
            .select('id, name')
            .in('name', recipe.dietaryPrefs);

          if (dietaryError) throw dietaryError;

          if (dietaryData && dietaryData.length > 0) {
            const dietaryRelationships = dietaryData.map(dietary => ({
              recipe_id: recipeId,
              dietary_pref_id: dietary.id,
            }));

            const { error: dietaryRelError } = await supabase
              .from('recipe_dietary_prefs')
              .insert(dietaryRelationships);

            if (dietaryRelError) throw dietaryRelError;
          }
        }
      }

      // Create user-recipe relationship
      const actions = isFavorite ? ['favorite'] : [];
      const { error: userRecipeError } = await supabase
        .from('user_recipes')
        .upsert([{
          user_id: userId,
          recipe_id: recipeId,
          actions,
        }], {
          onConflict: 'user_id,recipe_id'
        });

      if (userRecipeError) throw userRecipeError;
      
      return recipeId;
    } catch (error) {
      console.error('Error saving recipe:', error);
      throw error;
    }
  }

  static async toggleFavorite(userId: string, recipeId: string): Promise<void> {
    try {
      // Get current user recipe data
      const { data: userRecipe, error: fetchError } = await supabase
        .from('user_recipes')
        .select('actions')
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)
        .single();

      if (fetchError) {
        // If no relationship exists, create one with favorite
        const { error: insertError } = await supabase
          .from('user_recipes')
          .insert([{
            user_id: userId,
            recipe_id: recipeId,
            actions: ['favorite'],
          }]);

        if (insertError) throw insertError;
        return;
      }

      // Update existing relationship
      const currentActions = userRecipe.actions || [];
      const newActions = currentActions.includes('favorite')
        ? currentActions.filter(action => action !== 'favorite')
        : [...currentActions, 'favorite'];

      const { error: updateError } = await supabase
        .from('user_recipes')
        .update({ actions: newActions })
        .eq('user_id', userId)
        .eq('recipe_id', recipeId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  static async deleteUserRecipe(userId: string, recipeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_recipes')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_id', recipeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user recipe:', error);
      throw error;
    }
  }

  private static async persistRecipeImage({
    recipeTitle,
    searchQuery,
    allergenNames,
    recipeId,
    userId,
  }: {
    recipeTitle: string;
    searchQuery: string;
    recipeId: string;
    allergenNames: string[];
    userId: string;
  }): Promise<string> {
    try {
      console.log('🖼️ Start image generation:', recipeTitle);

      const fileName = formatImageName(searchQuery, allergenNames, 'png').replace('.png', '');
      const prompt = `High quality food photo of ${recipeTitle}, professional lighting, styled on a plate`;
      
      const result = await generateAndUploadImage({
        prompt,
        userId,
        recipeId,
        fileName,
        bucket: 'recipe-images',
        size: '1024x1024',
      });

      console.log('🖼️ ✅ Upload successful:', result.publicUrl);

      // Update recipe with image filename
      const imageFileName = `${fileName}.png`;
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ image: imageFileName })
        .eq('id', recipeId);

      if (updateError) {
        console.error('🖼️ DB update error:', updateError);
      }

      return result.publicUrl || DEFAULT_RECIPE_IMAGE;
    } catch (imageGenError) {
      console.error('🖼️ Image generation failed:', imageGenError);
      return DEFAULT_RECIPE_IMAGE;
    }
  }
}