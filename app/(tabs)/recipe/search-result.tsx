import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRecipes } from '@/contexts/RecipesContext';
import { ThemeColors, useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, Clock, Users, Zap, Flame, BookmarkPlus, Heart } from 'lucide-react-native';

export default function SearchResultDetailScreen() {
  const { recipeData, fromSearch } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const { saveRecipe, saveAndFavoriteRecipe } = useRecipes();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveAction, setSaveAction] = useState<'save' | 'favorite'>('save');

  let recipe;
  try {
    recipe = JSON.parse(recipeData as string);
  } catch (error) {
    console.error('Error parsing recipe data:', error);
    recipe = null;
  }

  const handleBack = () => {
    if (fromSearch === 'true') {
      // Go back to search results
      router.back();
    } else {
      // Fallback to main recipes tab
      router.replace('/(tabs)');
    }
  };

  const handleSave = async () => {
    if (!recipe) return;
    try {
      setShowSaveModal(true);
      setSaveAction('save');
      await saveRecipe(recipe);
      // After saving, go back to search results
      router.back();
    } catch (error) {
      console.error('Error saving recipe:', error);
    } finally {
      setShowSaveModal(false);
    }
  };

  const handleSaveAndFavorite = async () => {
    if (!recipe) return;
    try {
      setShowSaveModal(true);
      setSaveAction('favorite');
      await saveAndFavoriteRecipe(recipe);
      // After saving, go back to search results
      router.back();
    } catch (error) {
      console.error('Error saving and favoriting recipe:', error);
    } finally {
      setShowSaveModal(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'hard':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getMethodColor = (method: string) => {
    // You can customize colors for different cooking methods
    switch (method?.toLowerCase()) {
      case 'grill':
        return '#e97659'; // warm orange
      case 'fry':
        return '#f59e0b'; // golden
      case 'steam':
        return '#0B6082'; // blue
      case 'bake':
        return '#99523d'; // brown
      default:
        return colors.textSecondary;
    }
  };

  const styles = getStyles(colors);

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🍳</Text>
          <Text style={styles.emptyTitle}>Recipe Not Found</Text>
          <Text style={styles.emptySubtitle}>
            Unable to load recipe details.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Save Loading Modal */}
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
              <Text style={styles.saveModalText}>
                {saveAction === 'favorite' ? 'Saving & Favoriting Recipe' : 'Saving Recipe'}
              </Text>
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {recipe.title}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <BookmarkPlus size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.favoriteButton} onPress={handleSaveAndFavorite}>
            <Heart size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>{recipe.title}</Text>

          {recipe.headNote && (
            <Text style={styles.headNote}>{recipe.headNote}</Text>
          )}

          <Text style={styles.description}>{recipe.description}</Text>

          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Clock size={16} color={colors.text} />
              <Text style={styles.metadataText}>
                {recipe.prepTime?.replace('minutes', 'min')} +{' '}
                {recipe.cookTime?.replace('minutes', 'min')}
              </Text>
            </View>

            <View style={styles.metadataItem}>
              <Users size={16} color={colors.text} />
              <Text style={styles.metadataText}>
                {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
              </Text>
            </View>

            <View style={styles.difficulty}>
              <Zap
                size={16}
                color={getDifficultyColor(recipe.difficulty)}
              />
              <Text
                style={[
                  styles.difficultyText,
                  { color: getDifficultyColor(recipe.difficulty) },
                ]}
              >
                {recipe.difficulty}
              </Text>
            </View>

            <View style={styles.method}>
              <Flame
                size={16}
                color="#99523d"
              />
              <Text
                style={[
                  styles.methodText,
                  { color: "#99523d" },
                ]}
              >
                {recipe.method || 'Bake'}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Ingredients</Text>
          {recipe.ingredients?.map((ingredient: string, index: number) => (
            <Text key={index} style={styles.ingredientItem}>
              • {ingredient}
            </Text>
          ))}


          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Instructions</Text>
          {recipe.instructions?.map((instruction: string, index: number) => (
            <Text key={index} style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>{index + 1}.</Text>{' '}
              {instruction}
            </Text>
          ))}


          {(recipe.allergens?.length > 0 || recipe.dietaryPrefs?.length > 0) && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Dietary Information</Text>
              <View style={styles.tagsContainer}>
                {recipe.allergens?.map((allergen: string, index: number) => (
                  <View key={`allergen-${index}`} style={styles.allergenTag}>
                    <Text style={styles.prefText}>🚫 {allergen}</Text>
                  </View>
                ))}
                {recipe.dietaryPrefs?.map((dietary: string, index: number) => (
                  <View key={`dietary-${index}`} style={styles.dietaryTag}>
                    <Text style={styles.prefText}>🌱 {dietary}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {recipe.tags?.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 28, marginBottom: 8 }]}>Tags</Text>
              <View style={styles.tagsContainer}>
                {recipe.tags?.map((tag: string, index: number) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {recipe.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Chef's Notes</Text>
              <Text style={styles.notesText}>{recipe.notes}</Text>
            </View>
          )}

          {recipe.nutritionInfo && (
            <View style={styles.nutritionSection}>
              <Text style={styles.nutritionTitle}>Nutrition Information</Text>
              <Text style={styles.nutritionText}>{recipe.nutritionInfo}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      flex: 1,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    saveButton: {
      backgroundColor: colors.primary,
      padding: 8,
      borderRadius: 8,
    },
    favoriteButton: {
      backgroundColor: colors.error,
      padding: 8,
      borderRadius: 8,
    },
    content: {
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.textPrimary,
      marginBottom: 8,
      lineHeight: 30,
    },
    headNote: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 12,
      lineHeight: 22,
    },
    description: {
      fontSize: 15,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 20,
    },
    metadata: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    metadataItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metadataText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    difficulty: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    difficultyText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      textTransform: 'capitalize',
    },
    method: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    methodText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      textTransform: 'capitalize',
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
      marginBottom: 12,
      marginTop: 0,
    },
    ingredientItem: {
      fontSize: 15,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      marginBottom: 8,
      lineHeight: 22,
    },
    instructionItem: {
      fontSize: 15,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      marginBottom: 12,
      lineHeight: 22,
    },
    instructionNumber: {
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 4,
      marginBottom: 8,
    },
    tag: {
      backgroundColor: '#8ec7df',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    allergenTag: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    dietaryTag: {
      backgroundColor: colors.dietary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    tagText: {
      fontSize: 13,
      fontFamily: 'Inter-Medium',
      color: colors.textPrimary,
    },
    prefText: {
      fontSize: 13,
      fontFamily: 'Inter-Medium',
      color: colors.textWhite,
    },
    notesSection: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    notesTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
      marginBottom: 8,
    },
    notesText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      lineHeight: 20,
    },
    nutritionSection: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginTop: 16,
      marginBottom: 32,
      borderWidth: 1,
      borderColor: colors.border,
    },
    nutritionTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
      marginBottom: 8,
    },
    nutritionText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      lineHeight: 20,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    emptyEmoji: {
      fontSize: 52,
      marginBottom: 12,
      color: colors.primary,
    },
    emptyTitle: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    backButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
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
    modalEmoji: {
      fontSize: 40,
      marginBottom: 12,
    },
  });