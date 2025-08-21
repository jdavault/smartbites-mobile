import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useAllergens } from './AllergensContext';
import { useDietary } from './DietaryContext';

export interface Recipe {
  id?: string;
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
  isFavorite?: boolean;
  createdAt?: string;
  actions?: string[];
}

interface RecipesContextType {
  savedRecipes: Recipe[];
  favoriteRecipes: Recipe[];
  recentRecipes: Recipe[];
  featuredRecipes: Recipe[];
  loading: boolean;
  saveRecipe: (recipe: Recipe) => Promise<void>;
  saveAndFavoriteRecipe: (recipe: Recipe) => Promise<void>;
  toggleFavorite: (recipeId: string) => Promise<void>;
  deleteRecipe: (recipeId: string) => Promise<void>;
  refreshRecipes: () => Promise<void>;
  generateFeaturedRecipes: () => Promise<void>;
}

const RecipesContext = createContext<RecipesContextType | undefined>(undefined);

export function RecipesProvider({ children }: { children: React.ReactNode }) {
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { userAllergens } = useAllergens();
  const { userDietaryPrefs } = useDietary();

  const favoriteRecipes = savedRecipes.filter(recipe => recipe.isFavorite);
  const recentRecipes = savedRecipes.slice(0, 5);

  const fetchRecipes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_recipes')
        .select(`
          *,
          recipes (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false, foreignTable: 'recipes' });

      if (error) {
        // Handle case where table doesn't exist yet
        if (error.code === '42P01') {
          console.warn('Database tables not created yet. Please run the migration.');
          setLoading(false);
          return;
        }
        throw error;
      }

      const formattedRecipes: Recipe[] = data?.map(item => ({
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
        allergens: item.recipes.allergens || [],
        dietaryPrefs: item.recipes.dietary_prefs || [],
        notes: item.recipes.notes || '',
        nutritionInfo: item.recipes.nutrition_info || '',
        image: item.recipes.image,
        isFavorite: item.actions?.includes('favorite') || false,
        actions: item.actions || [],
        createdAt: item.recipes.created_at,
      })) || [];

      setSavedRecipes(formattedRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecipes();
      loadFeaturedRecipes();
    } else {
      setSavedRecipes([]);
      setFeaturedRecipes([]);
    }
  }, [user]);

  const loadFeaturedRecipes = () => {
    // Load static featured recipes
    const staticFeaturedRecipes: Recipe[] = [
      {
        id: 'featured-1',
        title: 'Mediterranean Quinoa Bowl',
        headNote: 'A nutritious and colorful bowl packed with Mediterranean flavors',
        description: 'Fresh quinoa topped with roasted vegetables, olives, and a tangy lemon dressing',
        ingredients: [],
        instructions: [],
        prepTime: '',
        cookTime: '',
        servings: 4,
        difficulty: 'easy',
        tags: [],
        searchQuery: '',
        searchKey: '',
        allergens: [],
        dietaryPrefs: [],
        notes: '',
        nutritionInfo: '',
      }
    ];
    setFeaturedRecipes(staticFeaturedRecipes);
  };

  // Load 5 random recipes that match user's allergens and dietary preferences
  const loadRandomFeaturedRecipes = async () => {
    if (!user) return;

    try {
      // Get recipes with their allergens and dietary preferences using joins
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_allergens (
            allergens (name)
          ),
          recipe_dietary_prefs (
            dietary_prefs (name)
          )
        `)
        .limit(20) // Get more than 5 to randomize from
        .order('created_at', { ascending: false });

      if (error) throw error;

      let filteredRecipes = data || [];

      const userAllergenNames = userAllergens.map(a => a.name);
      const userDietaryNames = userDietaryPrefs.map(d => d.name);

      // Filter out recipes that contain user's allergens
      if (userAllergenNames.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe => {
          const recipeAllergens = recipe.recipe_allergens?.map((ra: any) => ra.allergens.name) || [];
          return !recipeAllergens.some((allergen: string) => userAllergenNames.includes(allergen));
        });
      }

      // Filter by dietary preferences if user has any
      if (userDietaryNames.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe => {
          const recipeDietaryPrefs = recipe.recipe_dietary_prefs?.map((rd: any) => rd.dietary_prefs.name) || [];
          return userDietaryNames.some(userPref => recipeDietaryPrefs.includes(userPref));
        });
      }

      // Randomize and take 5
      const shuffled = filteredRecipes.sort(() => 0.5 - Math.random());
      const selectedRecipes = shuffled.slice(0, 5);

      const formattedRecipes: Recipe[] = selectedRecipes.map(recipe => ({
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
        allergens: recipe.recipe_allergens?.map((ra: any) => ra.allergens.name) || [],
        dietaryPrefs: recipe.recipe_dietary_prefs?.map((rd: any) => rd.dietary_prefs.name) || [],
        notes: recipe.notes || '',
        nutritionInfo: recipe.nutrition_info || '',
        image: recipe.image,
        isFavorite: false,
        createdAt: recipe.created_at,
      }));

      setFeaturedRecipes(formattedRecipes);
    } catch (error) {
      console.error('Error loading featured recipes:', error);
      // Fallback to empty array if there's an error
      setFeaturedRecipes([]);
    }
  };

  // Reload featured recipes when user's allergens or dietary preferences change
  useEffect(() => {
    if (user && userAllergens && userDietaryPrefs) {
      loadRandomFeaturedRecipes();
    }
  }, [user, userAllergens, userDietaryPrefs]);

  const generateFeaturedRecipes = async () => {
    await loadRandomFeaturedRecipes();
  };

  const saveRecipe = async (recipe: Recipe) => {
    if (!user) return;

    console.log('Saving recipe:', recipe.title);
    try {
      const searchKey = recipe.searchQuery
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // First, insert the recipe
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
          image: recipe.image,
        }])
        .select()
        .single();

      if (recipeError) throw recipeError;
      console.log('Recipe inserted:', recipeData);

      // Insert allergen relationships
      if (recipe.allergens && recipe.allergens.length > 0) {
        // Get allergen IDs by name
        const { data: allergenData, error: allergenError } = await supabase
          .from('allergens')
          .select('id, name')
          .in('name', recipe.allergens);

        if (allergenError) throw allergenError;

        if (allergenData && allergenData.length > 0) {
          const allergenRelationships = allergenData.map(allergen => ({
            recipe_id: recipeData.id,
            allergen_id: allergen.id,
          }));

          const { error: allergenRelError } = await supabase
            .from('recipe_allergens')
            .insert(allergenRelationships);

          if (allergenRelError) throw allergenRelError;
        }
      }

      // Insert dietary preference relationships
      if (recipe.dietaryPrefs && recipe.dietaryPrefs.length > 0) {
        // Get dietary preference IDs by name
        const { data: dietaryData, error: dietaryError } = await supabase
          .from('dietary_prefs')
          .select('id, name')
          .in('name', recipe.dietaryPrefs);

        if (dietaryError) throw dietaryError;

        if (dietaryData && dietaryData.length > 0) {
          const dietaryRelationships = dietaryData.map(dietary => ({
            recipe_id: recipeData.id,
            dietary_pref_id: dietary.id,
          }));

          const { error: dietaryRelError } = await supabase
            .from('recipe_dietary_prefs')
            .insert(dietaryRelationships);

          if (dietaryRelError) throw dietaryRelError;
        }
      }
      // Then, create the user-recipe relationship
      const { error: userRecipeError } = await supabase
        .from('user_recipes')
        .insert([{
          user_id: user.id,
          recipe_id: recipeData.id,
          actions: [],
        }]);

      if (userRecipeError) throw userRecipeError;
      console.log('User-recipe relationship created');
      
      // Add to local state
      const newRecipe = {
        ...recipe,
        id: recipeData.id,
        searchKey,
        isFavorite: false,
        actions: [],
        createdAt: recipeData.created_at,
      };
      
      setSavedRecipes(prev => [newRecipe, ...prev]);
    } catch (error) {
      console.error('Error saving recipe:', error);
      throw error;
    }
  };

  const saveAndFavoriteRecipe = async (recipe: Recipe) => {
    if (!user) return;

    console.log('Saving and favoriting recipe:', recipe.title);
    try {
      const searchKey = recipe.searchQuery
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // First, check if a recipe with matching criteria already exists
      const { data: existingRecipes, error: searchError } = await supabase
        .from('recipes')
        .select('id')
        .eq('title', recipe.title)
        .eq('search_key', searchKey);

      if (searchError) throw searchError;

      let recipeId: string;

      if (existingRecipes && existingRecipes.length > 0) {
        // Recipe already exists, use the existing one
        recipeId = existingRecipes[0].id;
        console.log('Using existing recipe for favorite:', recipeId);
      } else {
        // Recipe doesn't exist, create a new one
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
            image: recipe.image,
          }])
          .select()
          .single();

        if (recipeError) throw recipeError;
        recipeId = recipeData.id;
        console.log('New recipe created for favorite:', recipeId);

        // Insert allergen relationships for new recipe
        if (recipe.allergens && recipe.allergens.length > 0) {
          // Get allergen IDs by name
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

        // Insert dietary preference relationships for new recipe
        if (recipe.dietaryPrefs && recipe.dietaryPrefs.length > 0) {
          // Get dietary preference IDs by name
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

      // Then, create the user-recipe relationship with favorite action
      const { error: userRecipeError } = await supabase
        .from('user_recipes')
        .insert([{
          user_id: user.id,
          recipe_id: recipeId,
          actions: ['favorite'],
        }]);

      if (userRecipeError) throw userRecipeError;
      console.log('User-recipe relationship created with favorite for recipe:', recipeId);
      
      // Add to local state
      const newRecipe = {
        ...recipe,
        id: recipeId,
        searchKey,
        isFavorite: true,
        actions: ['favorite'],
      };
      
      setSavedRecipes(prev => [newRecipe, ...prev]);
    } catch (error) {
      console.error('Error saving and favoriting recipe:', error);
      throw error;
    }
  };

  const toggleFavorite = async (recipeId: string) => {
    if (!user) return;

    try {
      // Check if this recipe is already in user's saved recipes
      const savedRecipe = savedRecipes.find(r => r.id === recipeId);
      
      if (savedRecipe) {
        // Recipe is already saved - just update the actions
        const currentActions = savedRecipe.actions || [];
        const newActions = currentActions.includes('favorite')
          ? currentActions.filter(action => action !== 'favorite') // Remove favorite
          : [...currentActions, 'favorite']; // Add favorite

        const { error } = await supabase
          .from('user_recipes')
          .update({ actions: newActions })
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId);

        if (error) throw error;

        // Update local state for saved recipes
        setSavedRecipes(prev =>
          prev.map(r =>
            r.id === recipeId ? { 
              ...r, 
              isFavorite: newActions.includes('favorite'),
              actions: newActions 
            } : r
          )
        );
      } else {
        // Recipe is not saved yet (featured recipe) - create association with favorite
        const featuredRecipe = featuredRecipes.find(r => r.id === recipeId);
        if (!featuredRecipe) return;

        // Create user-recipe relationship with favorite action
        const { error } = await supabase
          .from('user_recipes')
          .insert([{
            user_id: user.id,
            recipe_id: recipeId,
            actions: ['favorite'],
          }]);

        if (error) throw error;

        // Add to saved recipes with favorite status
        const newSavedRecipe = {
          ...featuredRecipe,
          isFavorite: true,
          actions: ['favorite'],
        };
        
        setSavedRecipes(prev => [newSavedRecipe, ...prev]);
      }

      // Update featured recipes state to reflect favorite status
      setFeaturedRecipes(prev =>
        prev.map(r =>
          r.id === recipeId ? { 
            ...r, 
            isFavorite: true 
          } : r
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_recipes')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId);

      if (error) throw error;

      setSavedRecipes(prev => prev.filter(r => r.id !== recipeId));
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const refreshRecipes = async () => {
    await fetchRecipes();
  };

  return (
    <RecipesContext.Provider
      value={{
        savedRecipes,
        favoriteRecipes,
        recentRecipes,
        featuredRecipes,
        loading,
        saveRecipe,
        saveAndFavoriteRecipe,
        toggleFavorite,
        deleteRecipe,
        refreshRecipes,
        generateFeaturedRecipes,
      }}
    >
      {children}
    </RecipesContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipesContext);
  if (context === undefined) {
    throw new Error('useRecipes must be used within a RecipesProvider');
  }
  return context;
}