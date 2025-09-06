import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRecipes } from '@/contexts/RecipesContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useAllergens } from '@/contexts/AllergensContext';
import { useDietary } from '@/contexts/DietaryContext';
import { ALLERGENS } from '@/contexts/AllergensContext';
import { DIETARY_PREFERENCES } from '@/contexts/DietaryContext';
import { generateRecipes } from '@/lib/openai';
import { validateFoodQuery } from '@/utils/validation';
import { Search, RefreshCw } from 'lucide-react-native';
import RecipeCard from '@/components/RecipeCard';
import RecipeSection from '@/components/RecipeSection';
import AllergenFilter from '@/components/AllergenFilter';
import DietaryFilter from '@/components/DietaryFilter';
import { mapOpenAIRecipeToRecipe } from '@/utils/recipeMapping';

type ModalInfo = {
  visible: boolean;
  title: string;
  subtitle?: string;
  emoji?: string;
};

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
    deleteRecipe,
    generateFeaturedRecipes,
    loading: recipesLoading,
  } = useRecipes();
  const { userAllergens, toggleAllergen } = useAllergens();
  const { userDietaryPrefs, toggleDietaryPref } = useDietary();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingRecipeId, setSavingRecipeId] = useState<string | null>(null);
  const [favoritingRecipeId, setFavoritingRecipeId] = useState<string | null>(
    null
  );
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedAllergens, setSelectedAllergens] = useState<
    { $id: string; name: string }[]
  >([]);
  const [selectedDietary, setSelectedDietary] = useState<
    { $id: string; name: string }[]
  >([]);
  const [modalInfo, setModalInfo] = useState<ModalInfo>({
    visible: false,
    title: '',
  });

  const { width } = useWindowDimensions();
  const containerMax = 1024;
  const padX = 8; // Just a tiny bit of padding for search and filters

  const openModal = (info: Omit<ModalInfo, 'visible'>) =>
    setModalInfo({ ...info, visible: true });
  const closeModal = () => setModalInfo((m) => ({ ...m, visible: false }));

  // Initialize filters with user's preferences
  useEffect(() => {
    setSelectedAllergens(userAllergens);
    setSelectedDietary(userDietaryPrefs);
  }, [userAllergens, userDietaryPrefs]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      openModal({
        title: 'Search Required',
        subtitle: 'Please enter a recipe or ingredient to search for.',
        emoji: '🔍',
      });
      return;
    }

    // Validate food query BEFORE showing loading modal
    const validation = validateFoodQuery(searchQuery);
    if (!validation.isValid) {
      openModal({
        title: 'Food Items Only',
        subtitle: `Please search for food or recipes only. ${
          validation.suggestion || ''
        }`,
        emoji: '🍽️',
      });
      return;
    }

    setLoading(true);
    const debugMessages: string[] = [];
    try {
      const allergenNames = selectedAllergens.map((a) => a.name);
      const dietaryNames = selectedDietary.map((d) => d.name);
      debugMessages.push(`=== SEARCH DEBUG START ===`);

      const recipes = await generateRecipes(
        searchQuery,
        allergenNames,
        dietaryNames
      );
      
      // Map OpenAI recipes to our Recipe interface
      const mappedRecipes = recipes.map(mapOpenAIRecipeToRecipe);
      setSearchResults(mappedRecipes);
      debugMessages.push(`=== SEARCH DEBUG END (no error )===`);
    } catch (error) {
      console.error('Search error:', error);
      debugMessages.push(
        `Parsed recipeData: ${JSON.stringify(error).substring(0, 300)}...`
      );

      debugMessages.push(`=== SEARCH DEBUG END ( ERROR )===`);

      // Handle different types of errors with appropriate messages and emojis
      if (error instanceof Error) {
        if (error.message.includes('OpenAI API key')) {
          openModal({
            title: 'API Key Required',
            subtitle:
              'OpenAI API key is required for recipe generation. Please configure your API key.',
            emoji: '🔑',
          });
        } else {
          openModal({
            title: 'Search Error',
            subtitle:
              error.message ||
              'Failed to search for recipes. Please try again.',
            emoji: '❌',
          });
        }
      } else {
        openModal({
          title: 'Search Error',
          subtitle: 'Failed to search for recipes. Please try again.',
          emoji: '❌',
        });
      }
    } finally {
      console.log('[SEARCH DEBUG]', debugMessages.join('\n'));
      setLoading(false);
    }
  };

  const handleSaveRecipe = async (recipe: any) => {
    try {
      setShowSaveModal(true);
      setSavingRecipeId(recipe.title);
      await saveRecipe(recipe);
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Save recipe error:', error);
      openModal({
        title: 'Save Failed',
        subtitle: 'Failed to save recipe. Please try again.',
        emoji: '❌',
      });
    } finally {
      setSavingRecipeId(null);
      setShowSaveModal(false);
    }
  };

  const handleSaveAndFavoriteRecipe = async (recipe: any) => {
    try {
      setShowSaveModal(true);
      setFavoritingRecipeId(recipe.title);
      await saveAndFavoriteRecipe(recipe);
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Save and favorite recipe error:', error);
      openModal({
        title: 'Save Failed',
        subtitle: 'Failed to save recipe. Please try again.',
        emoji: '❌',
      });
    } finally {
      setFavoritingRecipeId(null);
      setShowSaveModal(false);
    }
  };

  const handleToggleAllergenFilter = (allergenName: string) => {
    // Find the allergen object from the ALLERGENS constant
    const allergen = ALLERGENS.find((a) => a.name === allergenName);
    if (allergen) {
      // Use the context method to toggle the allergen (this updates the database)
      toggleAllergen(allergen);
    }
  };

  const handleToggleDietaryFilter = (dietaryName: string) => {
    // Find the dietary preference object from the DIETARY_PREFERENCES constant
    const dietary = DIETARY_PREFERENCES.find((d) => d.name === dietaryName);
    if (dietary) {
      // Use the context method to toggle the dietary preference (this updates the database)
      toggleDietaryPref(dietary);
    }
  };

  const handleClearAllergenFilters = () => {
    // Clear all allergens by toggling off each selected one
    selectedAllergens.forEach((allergen) => {
      const allergenObj = ALLERGENS.find((a) => a.name === allergen.name);
      if (allergenObj) {
        toggleAllergen(allergenObj);
      }
    });
  };

  const handleClearDietaryFilters = () => {
    // Clear all dietary preferences by toggling off each selected one
    selectedDietary.forEach((dietary) => {
      const dietaryObj = DIETARY_PREFERENCES.find(
        (d) => d.name === dietary.name
      );
      if (dietaryObj) {
        toggleDietaryPref(dietaryObj);
      }
    });
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
    responsiveShell: {
      width: '100%',
      maxWidth: '100%', // Allow full width
      alignSelf: 'center',
      paddingHorizontal: 0, // No padding at all
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24, // reverted back
      paddingTop: Platform.OS === 'android' ? 32 : 4,
      paddingBottom: 2,
      backgroundColor: colors.surface,
      marginBottom: 12,
    },
    headerContent: {
      flex: 1,
    },
    headerLogoContainer: {
      alignItems: 'center',
      position: 'relative',
    },
    headerLogo: {
      width: 72,
      height: 72,
      marginLeft: 16,
    },
    betaBadge: {
      position: 'absolute',
      top: -4,
      right: -8,
      backgroundColor: '#FF8866',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    betaBadgeText: {
      fontSize: 10,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    title: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: '#FF8866',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: Platform.OS === 'android' ? 14 : 16,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
    },
    searchContainer: {
      marginBottom: 6,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: Platform.OS === 'android' ? 8 : 8,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: Platform.OS === 'android' ? 52 : 'auto',
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: Platform.OS === 'android' ? 14 : 16,
      fontFamily: 'Inter-Regular',
      color: colors.textPrimary,
      outlineWidth: 0,
      paddingVertical: Platform.OS === 'android' ? 0 : 0,
      textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
      includeFontPadding: false,
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
    contentContainer: {
      maxWidth: 1024,
      alignSelf: 'center',
      width: '100%',
    },
    searchResultsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    searchResultsTitle: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
    },
    dismissButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    dismissButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      padding: 24,
      borderRadius: 12,
      width: '80%',
      maxWidth: 420,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    modalEmoji: {
      fontSize: 40,
      marginBottom: 12,
    },

    saveModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveModalContent: {
      backgroundColor: colors.surface,
      padding: 32,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 280,
    },

    saveModalText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      textAlign: 'center',
      marginTop: 4, // small spacing between lines
    },
    mobileBetaFooter: {
      paddingHorizontal: 24,
      paddingVertical: 8,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    mobileBetaText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Full Screen Save Modal */}
      {showSaveModal && (
        <Modal
          transparent
          animationType="fade"
          visible={showSaveModal}
          onRequestClose={() => {}}
        >
          <View style={styles.saveModalOverlay}>
            <View style={styles.saveModalContent}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.saveModalText, styles.modalEmoji]}>🧠</Text>
              <Text style={styles.saveModalText}>Generating image</Text>
              <Text style={styles.saveModalText}>Saving Recipe</Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Success/Error Modal */}
      {modalInfo.visible && (
        <Modal
          transparent
          animationType="fade"
          visible={modalInfo.visible}
          onRequestClose={closeModal}
        >
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                {modalInfo.emoji && (
                  <Text style={styles.modalEmoji}>{modalInfo.emoji}</Text>
                )}
                <Text style={styles.modalTitle}>{modalInfo.title}</Text>
                {!!modalInfo.subtitle && (
                  <Text style={styles.modalSubtitle}>{modalInfo.subtitle}</Text>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Static full-width header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Hi, {profile?.firstName || 'there'}!</Text>
          <Text style={styles.subtitle}>
            What would you like to cook today?
          </Text>
        </View>
        <View style={styles.headerLogoContainer}>
          <Image
            source={require('@/assets/images/smart-bites-logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          {Platform.OS !== 'web' && (
            <View style={styles.betaBadge}>
              <Text style={styles.betaBadgeText}>Beta</Text>
            </View>
          )}
        </View>
      </View>

      {/* Responsive shell for search + filters */}
      <View style={[styles.responsiveShell, { paddingHorizontal: padX }]}>
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
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && (
          <Modal
            transparent
            animationType="fade"
            visible={loading}
            onRequestClose={() => {}}
          >
            <View style={styles.saveModalOverlay}>
              <View style={styles.saveModalContent}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.saveModalText, styles.modalEmoji]}>
                  🍳
                </Text>
                <Text style={styles.saveModalText}>Cooking up something</Text>
                <Text style={styles.saveModalText}>
                  special just for you...
                </Text>
              </View>
            </View>
          </Modal>
        )}

        <View style={styles.contentContainer}>
          {searchResults.length > 0 && (
            <View style={[styles.responsiveShell, { paddingHorizontal: padX }]}>
              <View style={styles.searchResultsHeader}>
                <Text style={styles.searchResultsTitle}>Search Results</Text>
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={() => {
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.dismissButtonText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
              {searchResults.map((recipe, index) => (
                <RecipeCard
                  key={index}
                  recipe={{
                    ...recipe,
                  }}
                  onSave={() => handleSaveRecipe(recipe)}
                  onSaveAndFavorite={() => handleSaveAndFavoriteRecipe(recipe)}
                  showSaveButton={true}
                  isSaving={savingRecipeId === recipe.title}
                  isFavoriting={favoritingRecipeId === recipe.title}
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
                  onDelete={undefined}
                  horizontal={true}
                />
              )}

              {favoriteRecipes.length > 0 && (
                <RecipeSection
                  title="❤️ Your Favorites"
                  recipes={favoriteRecipes}
                  onToggleFavorite={toggleFavorite}
                  onDelete={deleteRecipe}
                  horizontal={true}
                />
              )}

              {recentRecipes.length > 0 && (
                <RecipeSection
                  title="📚 My Collection"
                  recipes={recentRecipes}
                  onToggleFavorite={toggleFavorite}
                  onDelete={deleteRecipe}
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
        </View>
      </ScrollView>

      {/* Mobile Beta Footer */}
      {Platform.OS !== 'web' && (
        <View style={styles.mobileBetaFooter}>
          <Text style={styles.mobileBetaText}>
            Currently in beta — thanks for testing!
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}