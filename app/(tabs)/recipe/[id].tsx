import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRecipes } from '@/contexts/RecipesContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, Clock, Users, ChefHat } from 'lucide-react-native';

const DEFAULT_IMAGE_URL = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { savedRecipes, featuredRecipes, saveRecipe } = useRecipes();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  // Find recipe in saved recipes first, then featured recipes
  const recipe = savedRecipes.find((r) => r.id === id) || 
                 featuredRecipes.find((r) => r.id === id);

  const isFeaturedRecipe = !savedRecipes.find((r) => r.id === id) && 
                          featuredRecipes.find((r) => r.id === id);

  useEffect(() => {
    // If this is a featured recipe (not saved), automatically save it
    if (isFeaturedRecipe && recipe) {
      handleAutoSave();
    }
  }, [isFeaturedRecipe, recipe]);

  const handleAutoSave = async () => {
    if (!recipe) return;
    
    setLoading(true);
    try {
      await saveRecipe(recipe);
    } catch (error) {
      console.error('Error auto-saving featured recipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return colors.success;
      case 'medium': return colors.warning;
      case 'hard': return colors.error;
      default: return colors.textSecondary;
    }
  };

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🍳</Text>
          <Text style={styles.emptyTitle}>Recipe Not Found</Text>
          <Text style={styles.emptySubtitle}>
            This recipe might have been removed or doesn't exist.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
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
    backButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      flex: 1,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    image: {
      width: '100%',
      height: 250,
      backgroundColor: colors.border,
    },
    content: {
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: '#FF8866',
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
    sectionTitle: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
      marginBottom: 12,
      marginTop: 8,
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
      marginTop: 8,
    },
    tag: {
      backgroundColor: colors.primary,
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
      color: '#FFFFFF',
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
  });

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {recipe.title}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: recipe.image || DEFAULT_IMAGE_URL }}
          style={styles.image}
          resizeMode="cover"
        />

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
                {recipe.prepTime}
              </Text>
            </View>
            
            <View style={styles.metadataItem}>
              <Users size={16} color={colors.text} />
              <Text style={styles.metadataText}>
                {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
              </Text>
            </View>

            <View style={styles.difficulty}>
              <ChefHat size={16} color={getDifficultyColor(recipe.difficulty)} />
              <Text style={[styles.difficultyText, { color: getDifficultyColor(recipe.difficulty) }]}>
                {recipe.difficulty}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Ingredients</Text>
          {recipe.ingredients.map((ingredient, index) => (
            <Text key={index} style={styles.ingredientItem}>
              • {ingredient}
            </Text>
          ))}

          <Text style={styles.sectionTitle}>Instructions</Text>
          {recipe.instructions.map((instruction, index) => (
            <Text key={index} style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>{index + 1}.</Text> {instruction}
            </Text>
          ))}

          {(recipe.allergens.length > 0 || recipe.dietaryPrefs.length > 0) && (
            <>
              <Text style={styles.sectionTitle}>Dietary Information</Text>
              <View style={styles.tagsContainer}>
                {recipe.allergens.map((allergen, index) => (
                  <View key={`allergen-${index}`} style={styles.allergenTag}>
                    <Text style={styles.tagText}>🚫 {allergen}</Text>
                  </View>
                ))}
                {recipe.dietaryPrefs.map((dietary, index) => (
                  <View key={`dietary-${index}`} style={styles.dietaryTag}>
                    <Text style={styles.tagText}>🌱 {dietary}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {recipe.tags.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {recipe.tags.map((tag, index) => (
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