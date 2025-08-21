import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRecipes } from '@/contexts/RecipesContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useAllergens } from '@/contexts/AllergensContext';
import { useDietary } from '@/contexts/DietaryContext';
import { generateRecipes } from '@/lib/openai';
import { Search, RefreshCw } from 'lucide-react-native';
import RecipeCard from '@/components/RecipeCard';
import RecipeSection from '@/components/RecipeSection';
import AllergenFilter from '@/components/AllergenFilter';
import DietaryFilter from '@/components/DietaryFilter';

export default function SearchScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { profile } = useUserProfile();
  const {
    savedRecipes,
    favoriteRecipes,
    recentRecipes,
    featuredRecipes,
    saveRecipe,
    saveAndFavoriteRecipe,
    toggleFavorite,
    generateFeaturedRecipes,
    loading: recipesLoading,
  } = useRecipes();
  const { userAllergens } = useAllergens();
  const { userDietaryPrefs } = useDietary();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAllergens, setSelectedAllergens] = useState<
    { $id: string; name: string }[]
  >([]);
  const [selectedDietary, setSelectedDietary] = useState<
    { $id: string; name: string }[]
  >([]);

  // Initialize filters with user's preferences
  useEffect(() => {
    setSelectedAllergens(userAllergens);
    setSelectedDietary(userDietaryPrefs);
  }, [userAllergens, userDietaryPrefs]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert(
        'Search Required',
        'Please enter a recipe or ingredient to search for.'
      );
      return;
    }

    setLoading(true);
    try {
      const allergenNames = selectedAllergens.map((a) => a.name);
      const dietaryNames = selectedDietary.map((d) => d.name);

      const recipes = await generateRecipes(
        searchQuery,
        allergenNames,
        dietaryNames
      );
      setSearchResults(recipes);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert(
        'Search Error',
        'Failed to search for recipes. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async (recipe: any) => {
    try {
      setLoading(true);
      await saveRecipe(recipe);
      Alert.alert('Success', 'Recipe saved to your collection!');
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Save recipe error:', error);
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndFavoriteRecipe = async (recipe: any) => {
    try {
      setLoading(true);
      await saveAndFavoriteRecipe(recipe);
      Alert.alert('Success', 'Recipe saved and added to favorites!');
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Save and favorite recipe error:', error);
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAllergenFilter = (allergenName: string) => {
    const allergen = {
      $id: allergenName.toLowerCase().replace(/\s+/g, '-'),
      name: allergenName,
    };
    setSelectedAllergens((prev) => {
      const exists = prev.some((a) => a.name === allergenName);
      return exists
        ? prev.filter((a) => a.name !== allergenName)
        : [...prev, allergen];
    });
  };

  const handleToggleDietaryFilter = (dietaryName: string) => {
    const dietary = {
      $id: dietaryName.toLowerCase().replace(/\s+/g, '-'),
      name: dietaryName,
    };
    setSelectedDietary((prev) => {
      const exists = prev.some((d) => d.name === dietaryName);
      return exists
        ? prev.filter((d) => d.name !== dietaryName)
        : [...prev, dietary];
    });
  };

  const handleClearAllergenFilters = () => {
    setSelectedAllergens([]);
  };

  const handleClearDietaryFilters = () => {
    setSelectedDietary([]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await generateFeaturedRecipes();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor: '#FFFFFF',
      marginBottom: 12,
    },
    headerContent: {
      flex: 1,
    },
    headerLogo: {
      width: 72,
      height: 72,
      marginLeft: 16,
    },
    title: {
      fontSize: 22,
      fontFamily: 'Inter-Bold',
      color: '#FF8866',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
    },
    searchContainer: {
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.textWhite,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textPrimary,
      outlineWidth: 0,
    },
    searchButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      marginLeft: 8,
    },
    searchButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
    },
    searchResults: {
      paddingHorizontal: 24,
      marginBottom: 32,
    },
    searchResultsTitle: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
      marginBottom: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 12,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 40,
    },
    emptyStateIcon: {
      marginBottom: 16,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 16,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>
            Hi, {profile?.firstName || 'there'}!
          </Text>
          <Text style={styles.subtitle}>
            What would you like to cook today?
          </Text>
        </View>
        <Image
          source={require('@/assets/images/smart-bites-logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for recipes or ingredients..."
            placeholderTextColor={colors.textSecondary}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      <AllergenFilter
        selectedAllergens={selectedAllergens}
        onToggleFilter={handleToggleAllergenFilter}
        onClearFilters={handleClearAllergenFilters}
      />

      <DietaryFilter
        selectedDietary={selectedDietary}
        onToggleFilter={handleToggleDietaryFilter}
        onClearFilters={handleClearDietaryFilters}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>            🍳 Cooking up something delicious just for you...</Text>
          </View>
        )}

        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            <Text style={styles.searchResultsTitle}>Search Results</Text>
            {searchResults.map((recipe, index) => (
              <RecipeCard
                key={index}
                recipe={recipe}
                onSave={() => handleSaveRecipe(recipe)}
                onSaveAndFavorite={() => handleSaveAndFavoriteRecipe(recipe)}
                showSaveButton={true}
              />
            ))}
          </View>
        )}

        {!loading && searchResults.length === 0 && (
          <>
            {featuredRecipes.length > 0 && (
              <RecipeSection
                title="🌟 Featured Recipes"
                recipes={featuredRecipes}
                onToggleFavorite={toggleFavorite}
                horizontal={true}
              />
            )}

            {favoriteRecipes.length > 0 && (
              <RecipeSection
                title="❤️ Your Favorites"
                recipes={favoriteRecipes}
                onToggleFavorite={toggleFavorite}
                horizontal={true}
              />
            )}

            {recentRecipes.length > 0 && (
              <RecipeSection
                title="🕑 Recently Added"
                recipes={recentRecipes}
                onToggleFavorite={toggleFavorite}
                horizontal={false}
              />
            )}

            {savedRecipes.length === 0 &&
              featuredRecipes.length === 0 &&
              recentRecipes.length === 0 && (
                <View style={styles.emptyState}>
                  <View style={styles.emptyStateIcon}>
                    <Search size={48} color={colors.textSecondary} />
                  </View>
                  <Text style={styles.emptyStateTitle}>
                    Start Your Culinary Journey
                  </Text>
                  <Text style={styles.emptyStateText}>
                    Search for recipes above to discover delicious meals
                    tailored to your dietary needs and preferences.
                  </Text>
                </View>
              )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
