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
  method: string; // Required in UserRecipeData
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  searchQuery: string;
  searchKey?: string;
  allergensToAvoid: string[];
  allergensIncluded: string[];
  dietaryPrefs: string[];
  notes: string;
  nutritionInfo: string;
  image?: string;
  isFavorite?: boolean;
  actions?: any;
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
      console.log('💾 DEBUG: Raw database items for debugging:');
      data?.forEach((item, index) => {
        console.log(`💾 DEBUG: Item ${index + 1} allergens_included from DB:`, item.recipes?.allergens_included);
        console.log(`💾 DEBUG: Item ${index + 1} cooking_method from DB:`, item.recipes?.cooking_method);
      });

      return data?.map(item => ({
        id: item.recipes.id,
        title: item.recipes.title,
        headNote: item.recipes.head_note || '',
        description: item.recipes.description || '',
        ingredients: item.recipes.ingredients || [],
        instructions: item.recipes.instructions || [],
        prepTime: item.recipes.prep_time || '',
        cookTime: item.recipes.cook_time || '',
        method: item.recipes.cooking_method || 'Bake',
        servings: item.recipes.servings || 4,
        difficulty: item.recipes.difficulty || 'easy',
        tags: item.recipes.tags || [],
        searchQuery: item.recipes.search_query || '',
        searchKey: item.recipes.search_key || '',
        allergensToAvoid: item.recipes.recipe_allergens?.map((ra: any) => ra.allergens?.name).filter(Boolean) || [],
        allergensIncluded: item.recipes.allergens_included
          ? item.recipes.allergens_included.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
        dietaryPrefs: item.recipes.recipe_dietary_prefs?.map((rd: any) => rd.dietary_prefs?.name).filter(Boolean) || [],
        notes: item.recipes.notes || '',
        nutritionInfo: item.recipes.nutrition_info || '',
        image: item.recipes.image,
        isFavorite: item.actions?.includes('favorite') || false,
        actions: item.actions || [],
        createdAt: item.recipes.created_at,
      })) || [];
    } catch (error) {
      console.error('Error fetching user recipes:', error);
      throw error;
    }
  }

  static async getFeaturedRecipes(
    userId: string,
    userAllergens: string[],
    userDietaryPrefs: string[]
  ): Promise<UserRecipeData[]> {
    try {
      // Get user's saved recipe IDs to exclude them
      const { data: userRecipeData, error: userRecipeError } = await supabase
        .from('user_recipes')
        .select('recipe_id')
        .eq('user_id', userId);

      if (userRecipeError) throw userRecipeError;

      const savedRecipeIds = userRecipeData?.map((ur) => ur.recipe_id) || [];
      const savedIds = new Set(savedRecipeIds);

      // Get allergen and dietary preference IDs from lookup tables
      let allergenIds: string[] = [];
      let dietaryIds: string[] = [];

      if (userAllergens.length > 0) {
        const { data: allergenData, error: allergenError } = await supabase
          .from('allergens')
          .select('id')
          .in('name', userAllergens);

        if (allergenError) throw allergenError;
        allergenIds = allergenData?.map((a) => a.id) || [];
      }

      if (userDietaryPrefs.length > 0) {
        const { data: dietaryData, error: dietaryError } = await supabase
          .from('dietary_prefs')
          .select('id')
          .in('name', userDietaryPrefs);

        if (dietaryError) throw dietaryError;
        dietaryIds = dietaryData?.map((d) => d.id) || [];
      }

      console.log('🔍 User allergen names:', userAllergens);
      console.log('🔍 User allergen IDs:', allergenIds);
      console.log('🔍 User dietary names:', userDietaryPrefs);
      console.log('🔍 User dietary IDs:', dietaryIds);

      // Get all recipes with their relationships for client-side filtering
      const { data, error } = await supabase
        .from('recipes')
        .select(
          `
          *,
          recipe_allergens (
            allergen_id
          ),
          recipe_dietary_prefs (
            dietary_pref_id
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Build sets of required IDs once
      const userAllergenSet = new Set(allergenIds);
      const userDietSet = new Set(dietaryIds);

      // Helpers
      const getRecipeAllergenSet = (r: any) =>
        new Set<string>(
          (r.recipe_allergens ?? []).map((ra: any) => ra.allergen_id)
        );

      const getRecipeDietSet = (r: any) =>
        new Set<string>(
          (r.recipe_dietary_prefs ?? []).map((rd: any) => rd.dietary_pref_id)
        );

      const isSuperset = (have: Set<string>, need: Set<string>) =>
        [...need].every((id) => have.has(id));

      const isDisjoint = (a: Set<string>, b: Set<string>) => {
        for (const id of a) if (b.has(id)) return false;
        return true;
      };

      // Start with everything (optionally exclude saved client-side; more robust)
      let filtered = data.filter((r: any) => !savedIds.has(r.id));

      console.log('🔍 Candidate recipes:', filtered.length);

      // --- Allergens: recipe must include ALL user allergen IDs in recipe_allergens ---
      if (userAllergenSet.size) {
        const before = filtered.length;
        filtered = filtered.filter((r: any) => {
          const recipeAllergenIds = new Set<string>(
            (r.recipe_allergens ?? []).map((ra: any) => String(ra.allergen_id))
          );
          const ok = [...userAllergenSet].every((id) =>
            recipeAllergenIds.has(String(id))
          );
          if (!ok) {
            const missing = [...userAllergenSet].filter(
              (id) => !recipeAllergenIds.has(String(id))
            );
            console.log(`🔍 Allergens miss "${r.title}":`, missing);
          }
          return ok;
        });
        console.log(
          `🔍 After allergen superset: ${filtered.length} (filtered out ${
            before - filtered.length
          })`
        );
      }

      // --- Dietary prefs: recipe must include ALL user diet IDs in recipe_dietary_prefs ---
      if (userDietSet.size) {
        const before = filtered.length;
        filtered = filtered.filter((r: any) => {
          const recipeDietaryIds = new Set<string>(
            (r.recipe_dietary_prefs ?? []).map((rd: any) =>
              String(rd.dietary_pref_id)
            )
          );
          const ok = [...userDietSet].every((id) =>
            recipeDietaryIds.has(String(id))
          );
          if (!ok) {
            const missing = [...userDietSet].filter(
              (id) => !recipeDietaryIds.has(String(id))
            );
            console.log(`🔍 Dietary miss "${r.title}":`, missing);
          }
          return ok;
        });
        console.log(
          `🔍 After dietary superset: ${filtered.length} (filtered out ${
            before - filtered.length
          })`
        );
      }

      if (!filtered.length) {
        console.log(
          '🔍 No recipes found matching criteria (after superset filters).'
        );
        return [];
      }

      // Remove duplicates by title (case-insensitive)
      const seenTitles = new Set<string>();
      const uniqueRecipes = filtered.filter((recipe) => {
        // Create a composite key from title and headNote for better deduplication
        const compositeKey = [
          recipe.title.toLowerCase().trim(),
          (recipe.head_note || '').toLowerCase().trim()
        ].join('|');
        
        if (seenTitles.has(compositeKey)) {
          return false;
        }
        seenTitles.add(compositeKey);
        return true;
      });

      console.log(
        `🔍 After title+headNote deduplication: ${uniqueRecipes.length} (removed ${
          filtered.length - uniqueRecipes.length
        } duplicates)`
      );

      // Select up to 10 unique recipes
      const selectedRecipes = uniqueRecipes.slice(0, 10);

      // Get allergen and dietary preference names for display
      const { data: allAllergens } = await supabase
        .from('allergens')
        .select('id, name');

      const { data: allDietaryPrefs } = await supabase
        .from('dietary_prefs')
        .select('id, name');

      if (!allAllergens || !allDietaryPrefs) return [];

      const allergenMap = new Map(
        allAllergens?.map((a) => [a.id, a.name]) || []
      );
      const dietaryMap = new Map(
        allDietaryPrefs?.map((d) => [d.id, d.name]) || []
      );

      interface RecipeAllergenRow {
        allergen_id: string;
      }
      interface RecipeDietRow {
        dietary_pref_id: string;
      }
      interface SupabaseRecipeRow {
        id: string;
        title: string;
        head_note?: string | null;
        description?: string | null;
        ingredients?: string[] | null;
        instructions?: string[] | null;
        prep_time?: string | null;
        cook_time?: string | null;
        servings?: number | null;
        difficulty?: 'easy' | 'medium' | 'hard' | null;
        cooking_method?: string | null;
        tags?: string[] | null;
        search_query?: string | null;
        search_key?: string | null;
        recipe_allergens?: RecipeAllergenRow[] | null;
        recipe_dietary_prefs?: RecipeDietRow[] | null;
        notes?: string | null;
        nutrition_info?: string | null;
        image?: string | null;
        allergens_included?: string | null;
        created_at?: string | null;
      }

      return selectedRecipes.map((recipe: SupabaseRecipeRow): UserRecipeData => ({
        id: recipe.id,
        title: recipe.title,
        headNote: recipe.head_note || '',
        description: recipe.description || '',
        ingredients: (recipe.ingredients || []) as string[],
        instructions: (recipe.instructions || []) as string[],
        prepTime: recipe.prep_time || '',
        cookTime: recipe.cook_time || '',
        servings: (recipe.servings as number) || 4,
        difficulty: (recipe.difficulty as 'easy' | 'medium' | 'hard') || 'easy',
        method: recipe.cooking_method || 'Bake',
        tags: (recipe.tags || []) as string[],
        searchQuery: recipe.search_query || '',
        searchKey: recipe.search_key || '',
        allergensToAvoid: (recipe.recipe_allergens || [])
          .map((ra: RecipeAllergenRow) => allergenMap.get(ra.allergen_id))
          .filter(Boolean) as string[],
        dietaryPrefs: (recipe.recipe_dietary_prefs || [])
          .map((rd: RecipeDietRow) => dietaryMap.get(rd.dietary_pref_id))
          .filter(Boolean) as string[],
        notes: recipe.notes || '',
        nutritionInfo: recipe.nutrition_info || '',
        image: recipe.image as string | undefined,
        allergensIncluded: recipe.allergens_included
          ? recipe.allergens_included.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        isFavorite: false,
        actions: [] as any,
        createdAt: recipe.created_at as string,
      })) as UserRecipeData[];
    } catch (error) {
      console.error('Error fetching featured recipes:', error);
      return [];
    }
  }

  static async saveRecipe(data: SaveRecipeData): Promise<string> {
    const { recipe, userId, userAllergens, userDietaryPrefs, isFavorite = false } = data;
    
    try {
      // Create a content-based key for true deduplication
      const contentKey = buildSearchKey({
        allergensToAvoid: recipe.allergensToAvoid,
        dietaryPrefs: recipe.dietaryPrefs,
        title: recipe.title,
        headNote: recipe.headNote,
      });

      // Check if recipe with same content already exists
      const { data: existingRecipes, error: checkError } = await supabase
        .from('recipes')
        .select('id, image')
        .eq('search_key', contentKey);

      if (checkError) throw checkError;

      let recipeId: string;
      let finalImageFilename = null;

      if (existingRecipes && existingRecipes.length > 0) {
        // Recipe with same content exists - reuse it
        recipeId = existingRecipes[0].id;
        finalImageFilename = existingRecipes[0].image;
        console.log('💾 Reusing existing recipe with same content:', recipeId);
      } else {
        // Create new recipe with content-based key
        console.log('💾 DEBUG: Creating new recipe in DB:');
        console.log('💾 DEBUG: recipe.allergensIncluded from OpenAI:', recipe.allergensIncluded);
        console.log('💾 DEBUG: recipe.allergensToAvoid from OpenAI:', recipe.allergensToAvoid);
        console.log('💾 DEBUG: recipe.allergensIncluded type:', typeof recipe.allergensIncluded);
        console.log('💾 DEBUG: recipe.allergensIncluded isArray:', Array.isArray(recipe.allergensIncluded));
        
        // Convert allergensIncluded array to comma-delimited string for storage
        // Use allergensIncluded from the mapped recipe (should be an array)
        const allergensIncludedArray = recipe.allergensIncluded || [];
        const allergensIncludedString = allergensIncludedArray.length > 0 
          ? allergensIncludedArray.join(',')
          : '';
        
        console.log('💾 DEBUG: allergensIncludedString for DB:', allergensIncludedString);
        console.log('💾 DEBUG: allergensIncludedString length:', allergensIncludedString.length);
        console.log('💾 DEBUG: recipe.method from OpenAI:', recipe.method);
        console.log('💾 DEBUG: Full recipe object being saved:', JSON.stringify({
          title: recipe.title,
          allergens_included: allergensIncludedString,
          cooking_method: recipe.method || 'Bake'
        }, null, 2));
        
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
            cooking_method: recipe.method || 'Bake',
            tags: recipe.tags,
            search_query: recipe.searchQuery,
            search_key: contentKey,
            notes: recipe.notes,
            nutrition_info: recipe.nutritionInfo,
            allergens_included: allergensIncludedString,
            image: null,
          }])
          .select()
          .single();

        console.log('💾 DEBUG: Inserted recipe data:', recipeData);
        console.log('💾 DEBUG: Inserted recipe allergens_included:', recipeData?.allergens_included);
        console.log('💾 DEBUG: Inserted recipe cooking_method:', recipeData?.cooking_method);
        
        if (recipeError) throw recipeError;
        recipeId = recipeData.id;

        // Generate and persist image for new recipes only
        try {
          await this.persistRecipeImage({
            recipeTitle: recipe.title,
            recipeIngredients: recipe.ingredients,
            searchQuery: recipe.searchQuery,
            allergenNames: userAllergens,
            recipeId,
            userId,
          });
          
          // Wait for image processing to complete
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

        // Insert allergen relationships for new recipes only
        if (recipe.allergensToAvoid && recipe.allergensToAvoid.length > 0) {
          const { data: allergenData, error: allergenError } = await supabase
            .from('allergens')
            .select('id, name')
            .in('name', recipe.allergensToAvoid);

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
            
            console.log('💾 DEBUG: Inserted allergen relationships for allergens:', recipe.allergensToAvoid);
          }
        }

        // Insert dietary preference relationships for new recipes only
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

      // Check if user already has this recipe saved
      const { data: existingUserRecipe, error: userRecipeCheckError } = await supabase
        .from('user_recipes')
        .select('actions')
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)
        .maybeSingle();

      if (userRecipeCheckError) throw userRecipeCheckError;

      const actions = isFavorite ? ['favorite'] : [];
      
      if (existingUserRecipe) {
        // Update existing user-recipe relationship
        const currentActions = existingUserRecipe.actions || [];
        const newActions = isFavorite && !currentActions.includes('favorite')
          ? [...currentActions, 'favorite']
          : currentActions;
          
        const { error: userRecipeError } = await supabase
          .from('user_recipes')
          .update({ actions: newActions })
          .eq('user_id', userId)
          .eq('recipe_id', recipeId);
          
        if (userRecipeError) throw userRecipeError;
        console.log('💾 Updated existing user-recipe relationship');
      } else {
        // Create new user-recipe relationship
        const { error: userRecipeError } = await supabase
          .from('user_recipes')
          .insert([{
            user_id: userId,
            recipe_id: recipeId,
            actions,
          }]);
          
        if (userRecipeError) throw userRecipeError;
        console.log('💾 Created new user-recipe relationship');
      }

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
        ? currentActions.filter((action: string) => action !== 'favorite')
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

  static async persistRecipeImage({
    recipeTitle,
    recipeIngredients,
    searchQuery,
    allergenNames,
    recipeId,
    userId,
  }: {
    recipeTitle: string;
    recipeIngredients: string[];
    searchQuery: string;
    recipeId: string;
    allergenNames: string[];
    userId: string;
  }): Promise<string> {
    try {
      console.log('🖼️ Start image generation:', recipeTitle);

      const fileName = formatImageName(searchQuery, allergenNames, 'png').replace('.png', '');
      
      // Create a more detailed prompt using key ingredients
      const keyIngredients = recipeIngredients
        .slice(0, 5) // Use first 5 ingredients to avoid overly long prompts
        .map(ingredient => {
          // Extract the main ingredient name (remove quantities and prep instructions)
          return ingredient
            .replace(/^\d+[\s\w]*\s+/, '') // Remove quantities like "2 cups", "1 lb"
            .replace(/,.*$/, '') // Remove everything after comma
            .replace(/\(.*?\)/g, '') // Remove parenthetical notes
            .trim()
            .split(' ')
            .slice(0, 2) // Take first 2 words max
            .join(' ');
        })
        .filter(ingredient => ingredient.length > 2) // Filter out very short words
        .slice(0, 3); // Limit to 3 key ingredients for prompt clarity
      
      const ingredientsText = keyIngredients.length > 0 
        ? ` featuring ${keyIngredients.join(', ')}`
        : '';
      
      const prompt = `High quality food photo of ${recipeTitle}${ingredientsText}, professional lighting, styled on a plate`;
      
      console.log('🖼️ Generated image prompt:', prompt);
      
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
        throw new Error('Failed to save recipe image. Please try again later.');
      }

      return result.publicUrl || DEFAULT_RECIPE_IMAGE;
    } catch (imageGenError) {
      console.error('🖼️ Image generation failed:', imageGenError);
      throw new Error('Failed to generate recipe image. Please try again later.');
    }
  }
}