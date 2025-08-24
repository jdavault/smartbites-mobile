import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { RecipeService, type UserRecipeData, type SaveRecipeData } from '@/services/recipeService';
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

  const favoriteRecipes = useMemo(() => 
    savedRecipes.filter(recipe => recipe.isFavorite), 
    [savedRecipes]
  );
  
  const recentRecipes = useMemo(() => 
    savedRecipes.filter(recipe => !recipe.isFavorite).slice(0, 5), 
    [savedRecipes]
  );

  const fetchRecipes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const recipeData = await RecipeService.getUserRecipes(user.id);
      const formattedRecipes: Recipe[] = recipeData.map(item => ({
        id: item.id,
        title: item.title,
        headNote: item.headNote,
        description: item.description,
        ingredients: item.ingredients,
        instructions: item.instructions,
        prepTime: item.prepTime,
        cookTime: item.cookTime,
        servings: item.servings,
        difficulty: item.difficulty,
        tags: item.tags,
        searchQuery: item.searchQuery,
        searchKey: item.searchKey,
        allergens: item.allergens,
        dietaryPrefs: item.dietaryPrefs,
        notes: item.notes,
        nutritionInfo: item.nutritionInfo,
        image: item.image,
        isFavorite: item.isFavorite,
        actions: item.actions,
        createdAt: item.createdAt,
      }));

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
      // Don't load static featured recipes, only database recipes
      loadRandomFeaturedRecipes();
    } else {
      setSavedRecipes([]);
      setFeaturedRecipes([]);
    }
  }, [user]);

  const loadFeaturedRecipes = () => {
    // Don't load any static recipes - only load from database
    setFeaturedRecipes([]);
  };

  // Load 5 random recipes that match user's allergens and dietary preferences
  const loadRandomFeaturedRecipes = async () => {
    if (!user) return;
    
    try {
      const userAllergenNames = userAllergens.map(a => a.name);
      const userDietaryNames = userDietaryPrefs.map(d => d.name);
      
      const recipeData = await RecipeService.getFeaturedRecipes(
        user.id, 
        userAllergenNames, 
        userDietaryNames
      );
      
      const formattedRecipes: Recipe[] = recipeData.map(item => ({
        id: item.id,
        title: item.title,
        headNote: item.headNote,
        description: item.description,
        ingredients: item.ingredients,
        instructions: item.instructions,
        prepTime: item.prepTime,
        cookTime: item.cookTime,
        servings: item.servings,
        difficulty: item.difficulty,
        tags: item.tags,
        searchQuery: item.searchQuery,
        searchKey: item.searchKey,
        allergens: item.allergens,
        dietaryPrefs: item.dietaryPrefs,
        notes: item.notes,
        nutritionInfo: item.nutritionInfo,
        image: item.image,
        isFavorite: item.isFavorite,
        actions: item.actions,
        createdAt: item.createdAt,
      }));

      setFeaturedRecipes(formattedRecipes);
    } catch (error) {
      console.error('Error loading featured recipes:', error);
      setFeaturedRecipes([]);
    }
  };

  // Reload featured recipes when user's allergens or dietary preferences change
  useEffect(() => {
    if (user?.id && (userAllergens.length > 0 || userDietaryPrefs.length > 0)) {
      console.log('🔄 Loading featured recipes due to preference change');
      loadRandomFeaturedRecipes();
    }
  }, [user?.id, JSON.stringify(userAllergens.map(a => a.$id)), JSON.stringify(userDietaryPrefs.map(d => d.$id))]);

  const generateFeaturedRecipes = async () => {
    await loadRandomFeaturedRecipes();
  };

  const saveRecipe = async (recipe: Recipe) => {
    if (!user) return;

    try {
      const userAllergenNames = userAllergens.map(a => a.name);
      const userDietaryNames = userDietaryPrefs.map(d => d.name);
      
      const recipeId = await RecipeService.saveRecipe({
        recipe,
        userId: user.id,
        userAllergens: userAllergenNames,
        userDietaryPrefs: userDietaryNames,
        isFavorite: false,
      });

      // Check if a recipe with this search key already exists
      // Refresh recipes to get the newly saved recipe
      await fetchRecipes();
    } catch (error) {
      console.error('Error saving recipe:', error);
      throw error;
    }
  };

  const saveAndFavoriteRecipe = async (recipe: Recipe) => {
    if (!user) return;

    try {
      const userAllergenNames = userAllergens.map(a => a.name);
      const userDietaryNames = userDietaryPrefs.map(d => d.name);
      
      const recipeId = await RecipeService.saveRecipe({
        recipe,
        userId: user.id,
        userAllergens: userAllergenNames,
        userDietaryPrefs: userDietaryNames,
        isFavorite: true,
      });

      // Refresh recipes to get the newly saved recipe
      await fetchRecipes();
    } catch (error) {
      console.error('Error saving and favoriting recipe:', error);
      throw error;
    }
  };

  const toggleFavorite = async (recipeId: string) => {
    if (!user) return;

    try {
      await RecipeService.toggleFavorite(user.id, recipeId);
      
      // Update local state
      const savedRecipe = savedRecipes.find(r => r.id === recipeId);
      if (savedRecipe) {
        // Update existing saved recipe
        setSavedRecipes(prev =>
          prev.map(r =>
            r.id === recipeId ? { 
              ...r, 
              isFavorite: !r.isFavorite,
              actions: r.isFavorite 
                ? r.actions?.filter(action => action !== 'favorite') || []
                : [...(r.actions || []), 'favorite']
            } : r
          )
        );
      } else {
        // Featured recipe - add to saved recipes
        const featuredRecipe = featuredRecipes.find(r => r.id === recipeId);
        if (featuredRecipe) {
          const newSavedRecipe = {
            ...featuredRecipe,
            isFavorite: true,
            actions: ['favorite'],
          };
          setSavedRecipes(prev => [newSavedRecipe, ...prev]);
        }
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
      await RecipeService.deleteUserRecipe(user.id, recipeId);
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