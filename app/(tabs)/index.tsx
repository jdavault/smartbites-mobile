import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
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
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import {
  useTheme,
  SPACING,
  RADIUS,
  SHADOWS,
  FONT_SIZES,
} from '@/contexts/ThemeContext';
import { useRecipes } from '@/contexts/RecipesContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useAllergens } from '@/contexts/AllergensContext';
import { useDietary } from '@/contexts/DietaryContext';
import { ALLERGENS } from '@/contexts/AllergensContext';
import { DIETARY_PREFERENCES } from '@/contexts/DietaryContext';
import {
  generateRecipesParallel,
  type RecipeVariant,
} from '@/utils/generateAIRecipes';
import { validateFoodQuery } from '@/utils/validation';
import { Search, ChevronDown, X } from 'lucide-react-native';
import RecipeCard from '@/components/RecipeCard';
import RecipeSection from '@/components/RecipeSection';
import AllergenFilter from '@/components/AllergenFilter';
import DietaryFilter from '@/components/DietaryFilter';
import { mapOpenAIRecipeToRecipe } from '@/utils/recipeMapping';

// Then DELETE the local SPACING, RADIUS, SHADOWS, FONT_SIZES definitions from each file
type ModalInfo = {
  visible: boolean;
  title: string;
  subtitle?: string;
  emoji?: string;
};

const COUNT_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10];

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
  const isWeb = Platform.OS === 'web';

  const openModal = (info: Omit<ModalInfo, 'visible'>) =>
    setModalInfo({ ...info, visible: true });
  const closeModal = () => setModalInfo((m) => ({ ...m, visible: false }));

  useEffect(() => {
    setSelectedAllergens(userAllergens);
    setSelectedDietary(userDietaryPrefs);
  }, [userAllergens, userDietaryPrefs]);

  const allergensFilter = ALLERGENS.map((a) => ({
    ...a,
    selected: selectedAllergens.some((s) => s.$id === a.$id),
  }));
  const dietaryFilter = DIETARY_PREFERENCES.map((d) => ({
    ...d,
    selected: selectedDietary.some((s) => s.$id === d.$id),
  }));

  const getProgressMessage = (loaded: number, total: number) => {
    if (loaded === 0) return 'Analyzing your preferences...';
    if (loaded === Math.floor(total / 2)) return 'Halfway there!';
    if (loaded === total - 1) return 'Almost done...';
    return 'Cooking up recipes...';
  };

  const getProgressEmoji = (loaded: number, total: number) => {
    if (loaded === 0) return '🤖';
    if (loaded === Math.floor(total / 2)) return '🎯';
    if (loaded >= total - 1) return '🎉';
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
      setSearchResults([]);
      setRecipesLoaded(0);
      const allergenNames = allergensFilter
        .filter((a) => a.selected)
        .map((a) => a.name);
      const dietaryNames = dietaryFilter
        .filter((d) => d.selected)
        .map((d) => d.name);
      const generatedRecipes = await generateRecipesParallel(
        searchQuery,
        allergenNames,
        dietaryNames,
        recipeCount,
        recipeType,
        (recipe, index) => {
          const mappedRecipe = mapOpenAIRecipeToRecipe(recipe);
          setSearchResults((prev) => {
            const n = [...prev];
            n[index] = mappedRecipe;
            return n.filter((r) => r);
          });
          setRecipesLoaded((prev) => prev + 1);
        }
      );
      setSearchResults(generatedRecipes.map(mapOpenAIRecipeToRecipe));
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Failed to search for recipes.';
      openModal({
        title: msg.includes('API key') ? 'API Key Required' : 'Search Error',
        subtitle: msg,
        emoji: msg.includes('API key') ? '🔑' : '❌',
      });
      setSearchResults([]);
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
    } catch {
      openModal({
        title: 'Save Failed',
        subtitle: 'Failed to save recipe.',
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
    } catch {
      openModal({
        title: 'Save Failed',
        subtitle: 'Failed to save recipe.',
        emoji: '❌',
      });
    } finally {
      setFavoritingRecipeId(null);
      setShowSaveModal(false);
    }
  };

  const handleToggleAllergenFilter = (name: string) => {
    const a = ALLERGENS.find((x) => x.name === name);
    if (a) toggleAllergen(a);
  };
  const handleToggleDietaryFilter = (name: string) => {
    const d = DIETARY_PREFERENCES.find((x) => x.name === name);
    if (d) toggleDietaryPref(d);
  };
  const handleClearAllergenFilters = () =>
    selectedAllergens.forEach((a) => {
      const o = ALLERGENS.find((x) => x.name === a.name);
      if (o) toggleAllergen(o);
    });
  const handleClearDietaryFilters = () =>
    selectedDietary.forEach((d) => {
      const o = DIETARY_PREFERENCES.find((x) => x.name === d.name);
      if (o) toggleDietaryPref(o);
    });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await generateFeaturedRecipes();
    } finally {
      setRefreshing(false);
    }
  };

  const currentTypeLabel =
    TYPE_OPTIONS.find((t) => t.value === recipeType)?.label || 'Mix';
  const showDetailedProgress = recipeCount >= 3;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchSection: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.sm,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Platform.select({
        android: SPACING.xs,
        ios: SPACING.xs,
        web: SPACING.sm,
      }),
    },
    searchInputContainer: {
      flex: 1,
      flexShrink: 1, // 👈 Allow it to shrink
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      paddingHorizontal: Platform.select({
        android: SPACING.sm,
        ios: SPACING.sm,
        web: SPACING.lg,
      }),
      paddingVertical: Platform.select({
        android: SPACING.sm - 2,
        ios: SPACING.sm,
        web: SPACING.md,
      }),
      borderWidth: 1.5,
      borderColor: colors.border,
      ...SHADOWS.sm,
    },
    searchIcon: { marginRight: SPACING.md, opacity: 0.6 },
    searchInput: {
      flex: 1,
      fontSize: FONT_SIZES.md,
      fontFamily: 'Inter-Regular',
      color: colors.textPrimary,
      paddingVertical: 0,
      ...(Platform.OS === 'web' && { outlineStyle: 'none' }),
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: RADIUS.md,
      paddingHorizontal: Platform.select({
        android: 6,
        ios: 6,
        web: SPACING.md,
      }),
      paddingVertical: Platform.select({
        android: SPACING.sm - 2,
        ios: SPACING.sm,
        web: SPACING.md,
      }),
      borderWidth: 1.5,
      borderColor: colors.border,
      gap: 1,
      ...SHADOWS.sm,
    },
    dropdownButtonSmall: {
      minWidth: Platform.select({ android: 32, ios: 34, web: 45 }),
    },
    dropdownButtonMedium: {
      minWidth: Platform.select({ android: 42, ios: 46, web: 65 }),
    },
    dropdownText: {
      fontSize: Platform.select({ android: 11, ios: 11, web: FONT_SIZES.sm }),
      fontFamily: 'Inter-SemiBold',
      color: colors.textPrimary,
    },
    pickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xxl,
    },
    pickerContent: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.xl,
      padding: SPACING.sm,
      minWidth: 240,
      maxWidth: 320,
      maxHeight: 400,
      ...SHADOWS.lg,
    },
    pickerTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: 'Inter-SemiBold',
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: SPACING.sm,
    },
    pickerOption: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: RADIUS.md,
      marginHorizontal: SPACING.xs,
      marginVertical: 2,
    },
    pickerOptionSelected: { backgroundColor: `${colors.primary}15` },
    pickerOptionText: {
      fontSize: FONT_SIZES.md,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      textAlign: 'center',
    },
    pickerOptionTextSelected: {
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },
    content: { flex: 1 },
    contentContainer: { maxWidth: 1024, alignSelf: 'center', width: '100%' },
    resultsSection: { paddingHorizontal: SPACING.lg },
    resultsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.lg,
      marginTop: SPACING.md,
    },
    resultsTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
      letterSpacing: -0.3,
    },
    dismissButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.full,
      backgroundColor: colors.backgroundLight,
      gap: SPACING.xs,
    },
    dismissButtonText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SPACING.xxxl,
      paddingVertical: 60,
    },
    emptyStateIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${colors.primary}10`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.xl,
    },
    emptyStateTitle: {
      fontSize: FONT_SIZES.xl,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: SPACING.sm,
      letterSpacing: -0.3,
    },
    emptyStateText: {
      fontSize: FONT_SIZES.md,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      maxWidth: 300,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xxl,
    },
    modalContent: {
      backgroundColor: colors.surface,
      padding: SPACING.xxl,
      borderRadius: RADIUS.xl,
      width: '100%',
      maxWidth: 380,
      alignItems: 'center',
      ...SHADOWS.lg,
    },
    modalEmoji: { fontSize: 48, marginBottom: SPACING.lg },
    modalTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: SPACING.sm,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    modalSubtitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    loadingModalContent: {
      backgroundColor: colors.surface,
      padding: SPACING.xxxl,
      borderRadius: RADIUS.xl,
      alignItems: 'center',
      minWidth: 280,
      ...SHADOWS.lg,
    },
    loadingText: {
      fontSize: FONT_SIZES.md,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      textAlign: 'center',
      marginTop: SPACING.md,
    },
    loadingSubtext: {
      fontSize: FONT_SIZES.sm,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: SPACING.xs,
    },
    dropdownRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginTop: isWeb ? 0 : SPACING.sm, // Space below search on mobile
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading Modal */}
      <Modal transparent animationType="fade" visible={isSearching}>
        <View style={styles.modalOverlay}>
          <View style={styles.loadingModalContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            {showDetailedProgress ? (
              <>
                <Text style={[styles.loadingText, { marginTop: SPACING.lg }]}>
                  {getProgressEmoji(recipesLoaded, recipeCount)}{' '}
                  {getProgressMessage(recipesLoaded, recipeCount)}
                </Text>
                {recipesLoaded > 0 && (
                  <Text style={styles.loadingSubtext}>
                    {recipesLoaded}/{recipeCount} recipes loaded
                  </Text>
                )}
              </>
            ) : (
              <Text style={[styles.loadingText, { marginTop: SPACING.lg }]}>
                🤖 Analyzing your preferences...
              </Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Count Picker */}
      <Modal
        transparent
        animationType="fade"
        visible={showCountPicker}
        onRequestClose={() => setShowCountPicker(false)}
      >
        <Pressable
          style={styles.pickerOverlay}
          onPress={() => setShowCountPicker(false)}
        >
          <Pressable>
            <View style={styles.pickerContent}>
              <Text style={styles.pickerTitle}>Number of Recipes</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
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
          </Pressable>
        </Pressable>
      </Modal>

      {/* Type Picker */}
      <Modal
        transparent
        animationType="fade"
        visible={showTypePicker}
        onRequestClose={() => setShowTypePicker(false)}
      >
        <Pressable
          style={styles.pickerOverlay}
          onPress={() => setShowTypePicker(false)}
        >
          <Pressable>
            <View style={styles.pickerContent}>
              <Text style={styles.pickerTitle}>Recipe Type</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {TYPE_OPTIONS.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.pickerOption,
                      recipeType === type.value && styles.pickerOptionSelected,
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
          </Pressable>
        </Pressable>
      </Modal>

      {/* Save Modal */}
      <Modal transparent animationType="fade" visible={showSaveModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.loadingModalContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { marginTop: SPACING.lg }]}>
              🧠 Generating image...
            </Text>
            <Text style={styles.loadingSubtext}>Saving your recipe</Text>
          </View>
        </View>
      </Modal>

      {/* Info Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={modalInfo.visible}
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Pressable>
            <View style={styles.modalContent}>
              {modalInfo.emoji && (
                <Text style={styles.modalEmoji}>{modalInfo.emoji}</Text>
              )}
              <Text style={styles.modalTitle}>{modalInfo.title}</Text>
              {!!modalInfo.subtitle && (
                <Text style={styles.modalSubtitle}>{modalInfo.subtitle}</Text>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Header
        title={`Hi, ${profile?.firstName || 'there'}!`}
        subtitle="What would you like to cook today?"
      />

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            {Platform.OS === 'web' && (
              <Search
                size={20}
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
            )}
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              placeholder="recipes or ingredients"
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity
            style={[styles.dropdownButton, styles.dropdownButtonSmall]}
            onPress={() => setShowCountPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownText}>{recipeCount}</Text>
            <ChevronDown
              size={Platform.OS === 'web' ? 14 : 12}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dropdownButton, styles.dropdownButtonMedium]}
            onPress={() => setShowTypePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownText} numberOfLines={1}>
              {currentTypeLabel.split(' ')[0]}
            </Text>
            <ChevronDown
              size={Platform.OS === 'web' ? 14 : 12}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={{ paddingHorizontal: SPACING.lg }}>
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

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.contentContainer}>
          {searchResults.length > 0 && (
            <View style={styles.resultsSection}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>Search Results</Text>
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={() => {
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                  activeOpacity={0.7}
                >
                  <X size={16} color={colors.textSecondary} />
                  <Text style={styles.dismissButtonText}>Clear</Text>
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
                      <Search size={36} color={colors.primary} />
                    </View>
                    <Text style={styles.emptyStateTitle}>
                      Start Your Culinary Journey
                    </Text>
                    <Text style={styles.emptyStateText}>
                      Search for recipes above to discover delicious meals
                      tailored to your dietary needs.
                    </Text>
                  </View>
                )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
