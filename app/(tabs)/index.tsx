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
import {
  generateRecipesParallel,
  VARIANT_LABELS,
  type RecipeVariant,
} from '@/utils/generateAIRecipes';
import { validateFoodQuery } from '@/utils/validation';
import { Search, ChevronDown } from 'lucide-react-native';
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

// Count options for dropdown
const COUNT_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10];

// Type/Variant options for dropdown
const TYPE_OPTIONS: { value: RecipeVariant; label: string }[] = [
  { value: 'mix', label: 'Mix (Variety)' },
  { value: 'quick', label: 'Quick (< 30 min)' },
  { value: 'standard', label: 'Standard' },
  { value: 'gourmet', label: 'Gourmet' },
  { value: 'budget', label: 'Budget' },
  { value: 'comfort', label: 'Comfort' },
];

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
  const [isSearching, setIsSearching] = useState(false);
  const [recipesLoaded, setRecipesLoaded] = useState(0);

  // NEW: Recipe count and type settings
  const [recipeCount, setRecipeCount] = useState(3);
  const [recipeType, setRecipeType] = useState<RecipeVariant>('mix');
  const [showCountPicker, setShowCountPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

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
  const padX = 8;

  const openModal = (info: Omit<ModalInfo, 'visible'>) =>
    setModalInfo({ ...info, visible: true });
  const closeModal = () => setModalInfo((m) => ({ ...m, visible: false }));

  // Initialize filters with user's preferences
  useEffect(() => {
    setSelectedAllergens(userAllergens);
    setSelectedDietary(userDietaryPrefs);
  }, [userAllergens, userDietaryPrefs]);

  // Create allergen filter array for UI
  const allergensFilter = ALLERGENS.map((allergen) => ({
    ...allergen,
    selected: selectedAllergens.some((a) => a.$id === allergen.$id),
  }));

  // Create dietary filter array for UI
  const dietaryFilter = DIETARY_PREFERENCES.map((dietary) => ({
    ...dietary,
    selected: selectedDietary.some((d) => d.$id === dietary.$id),
  }));

  // Helper function to get progress message (only for 3+ recipes)
  const getProgressMessage = (loaded: number, total: number) => {
    if (loaded === 0) return 'Analyzing your preferences...';
    const halfway = Math.floor(total / 2);
    const almostDone = total - 1;
    if (loaded === halfway) return 'Halfway there!';
    if (loaded === almostDone) return 'Almost done...';
    return 'Cooking up recipes...';
  };

  // Helper function to get progress emoji (only for 3+ recipes)
  const getProgressEmoji = (loaded: number, total: number) => {
    if (loaded === 0) return '🤖';
    const halfway = Math.floor(total / 2);
    const almostDone = total - 1;
    if (loaded === halfway) return '🎯';
    if (loaded >= almostDone) return '🎉';
    return '🍳';
  };

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

    try {
      setIsSearching(true);
      setSearchResults([]); // Clear previous results
      setRecipesLoaded(0); // Reset progress

      const allergenNames = allergensFilter
        .filter((a) => a.selected)
        .map((a) => a.name);
      const dietaryNames = dietaryFilter
        .filter((d) => d.selected)
        .map((d) => d.name);

      console.log('🔍 Searching for:', searchQuery);
      console.log('📊 Count:', recipeCount, 'Type:', recipeType);
      console.log('🚫 Avoiding allergens:', allergenNames);
      console.log('🥗 Dietary preferences:', dietaryNames);

      // ✨ PARALLEL GENERATION with configurable count and type
      const generatedRecipes = await generateRecipesParallel(
        searchQuery,
        allergenNames,
        dietaryNames,
        recipeCount,
        recipeType,
        // 🎯 Callback: fires as EACH recipe completes
        (recipe, index) => {
          console.log(
            `✅ Recipe ${index + 1}/${recipeCount} ready: "${recipe.title}"`
          );

          // Map OpenAI recipe to your Recipe interface
          const mappedRecipe = mapOpenAIRecipeToRecipe(recipe);

          // Add to list immediately (progressive display)
          setSearchResults((prev) => {
            const newResults = [...prev];
            newResults[index] = mappedRecipe;
            return newResults.filter((r) => r); // Remove undefined slots
          });

          // Update progress counter
          setRecipesLoaded((prev) => prev + 1);
        }
      );

      // Final update (ensures all recipes are there)
      const allMappedRecipes = generatedRecipes.map(mapOpenAIRecipeToRecipe);
      setSearchResults(allMappedRecipes);

      console.log(`🎉 All ${recipeCount} recipes generated successfully!`);
    } catch (error) {
      console.error('Search error:', error);

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

      setSearchResults([]); // Clear on error
    } finally {
      setIsSearching(false);
      setRecipesLoaded(0);
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
    const allergen = ALLERGENS.find((a) => a.name === allergenName);
    if (allergen) {
      toggleAllergen(allergen);
    }
  };

  const handleToggleDietaryFilter = (dietaryName: string) => {
    const dietary = DIETARY_PREFERENCES.find((d) => d.name === dietaryName);
    if (dietary) {
      toggleDietaryPref(dietary);
    }
  };

  const handleClearAllergenFilters = () => {
    selectedAllergens.forEach((allergen) => {
      const allergenObj = ALLERGENS.find((a) => a.name === allergen.name);
      if (allergenObj) {
        toggleAllergen(allergenObj);
      }
    });
  };

  const handleClearDietaryFilters = () => {
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

  // Get current type label for display
  const currentTypeLabel =
    TYPE_OPTIONS.find((t) => t.value === recipeType)?.label || 'Mix';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    responsiveShell: {
      width: '100%',
      maxWidth: '100%',
      alignSelf: 'center',
      paddingHorizontal: 0,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
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
      fontSize: Platform.select({
        ios: 16,
        android: 11,
        web: 13,
      }),
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
    },
    searchContainer: {
      marginBottom: 6,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: Platform.OS === 'android' ? 4 : 8,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: Platform.OS === 'android' ? 40 : 'auto',
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: Platform.select({
        ios: 14,
        android: 11,
        web: 13,
      }),
      fontFamily: 'Inter-Regular',
      color: colors.textPrimary,
      outlineWidth: 0,
      paddingVertical: Platform.OS === 'android' ? 0 : 0,
      textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
      includeFontPadding: false,
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: Platform.OS === 'android' ? 8 : 10,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: Platform.OS === 'android' ? 40 : 'auto',
    },
    dropdownButtonSmall: {
      minWidth: 50,
    },
    dropdownButtonMedium: {
      minWidth: Platform.OS === 'web' ? 130 : 100,
    },
    dropdownText: {
      fontSize: Platform.select({
        ios: 13,
        android: 10,
        web: 12,
      }),
      fontFamily: 'Inter-Medium',
      color: colors.textPrimary,
      marginRight: 4,
    },
    dropdownLabel: {
      fontSize: Platform.select({
        ios: 10,
        android: 8,
        web: 10,
      }),
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 2,
    },
    pickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    pickerContent: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 8,
      minWidth: 200,
      maxHeight: 300,
    },
    pickerOption: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    pickerOptionSelected: {
      backgroundColor: '#FF886620',
    },
    pickerOptionText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
    },
    pickerOptionTextSelected: {
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
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
      marginTop: 4,
    },
    mobileBetaFooter: {
      paddingHorizontal: 24,
      paddingVertical: 8,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    mobileBetaText: {
      fontSize: Platform.OS === 'android' ? 10 : 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  // Determine if we should show detailed progress (3+ recipes)
  const showDetailedProgress = recipeCount >= 3;

  return (
    <SafeAreaView style={styles.container}>
      {/* LOADING MODAL */}
      {isSearching && (
        <Modal
          transparent
          animationType="fade"
          visible={isSearching}
          onRequestClose={() => {}}
        >
          <View style={styles.saveModalOverlay}>
            <View style={styles.saveModalContent}>
              <ActivityIndicator size="large" color="#FF8866" />
              {showDetailedProgress ? (
                <>
                  <Text style={[styles.saveModalText, styles.modalEmoji]}>
                    {getProgressEmoji(recipesLoaded, recipeCount)}
                  </Text>
                  <Text style={styles.saveModalText}>
                    {getProgressMessage(recipesLoaded, recipeCount)}
                  </Text>
                  {recipesLoaded > 0 && (
                    <Text style={styles.saveModalText}>
                      {recipesLoaded}/{recipeCount} recipes loaded
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={[styles.saveModalText, styles.modalEmoji]}>
                    🤖
                  </Text>
                  <Text style={styles.saveModalText}>
                    Analyzing your preferences...
                  </Text>
                </>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* COUNT PICKER MODAL */}
      {showCountPicker && (
        <Modal
          transparent
          animationType="fade"
          visible={showCountPicker}
          onRequestClose={() => setShowCountPicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowCountPicker(false)}>
            <View style={styles.pickerOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.pickerContent}>
                  <ScrollView>
                    {COUNT_OPTIONS.map((count) => (
                      <TouchableOpacity
                        key={count}
                        style={[
                          styles.pickerOption,
                          recipeCount === count && styles.pickerOptionSelected,
                        ]}
                        onPress={() => {
                          setRecipeCount(count);
                          setShowCountPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            recipeCount === count &&
                              styles.pickerOptionTextSelected,
                          ]}
                        >
                          {count} recipes
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* TYPE PICKER MODAL */}
      {showTypePicker && (
        <Modal
          transparent
          animationType="fade"
          visible={showTypePicker}
          onRequestClose={() => setShowTypePicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowTypePicker(false)}>
            <View style={styles.pickerOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.pickerContent}>
                  <ScrollView>
                    {TYPE_OPTIONS.map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.pickerOption,
                          recipeType === type.value &&
                            styles.pickerOptionSelected,
                        ]}
                        onPress={() => {
                          setRecipeType(type.value);
                          setShowTypePicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            recipeType === type.value &&
                              styles.pickerOptionTextSelected,
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* SAVE MODAL */}
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

      {/* SUCCESS/ERROR MODAL */}
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

      {/* HEADER */}
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

      {/* SEARCH + DROPDOWNS */}
      <View style={[styles.responsiveShell, { paddingHorizontal: padX }]}>
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            {/* Search Input (shorter) */}
            <View style={styles.searchInputContainer}>
              <Search
                size={18}
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search recipes..."
                placeholderTextColor={colors.textSecondary}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
            </View>

            {/* Count Dropdown */}
            <TouchableOpacity
              style={[styles.dropdownButton, styles.dropdownButtonSmall]}
              onPress={() => setShowCountPicker(true)}
            >
              <Text style={styles.dropdownText}>{recipeCount}</Text>
              <ChevronDown size={14} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Type Dropdown */}
            <TouchableOpacity
              style={[styles.dropdownButton, styles.dropdownButtonMedium]}
              onPress={() => setShowTypePicker(true)}
            >
              <Text style={styles.dropdownText} numberOfLines={1}>
                {currentTypeLabel.split(' ')[0]}
              </Text>
              <ChevronDown size={14} color={colors.textSecondary} />
            </TouchableOpacity>
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

      {/* CONTENT */}
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
          {/* SEARCH RESULTS */}
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
                  key={recipe.id || index}
                  recipe={recipe}
                  onSave={() => handleSaveRecipe(recipe)}
                  onSaveAndFavorite={() => handleSaveAndFavoriteRecipe(recipe)}
                  showSaveButton={true}
                  isSaving={savingRecipeId === recipe.title}
                  isFavoriting={favoritingRecipeId === recipe.title}
                />
              ))}
            </View>
          )}

          {/* DEFAULT CONTENT */}
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

              {/* EMPTY STATE */}
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

      {/* MOBILE BETA FOOTER */}
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
