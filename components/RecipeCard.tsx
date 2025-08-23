import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeColors, useTheme } from '@/contexts/ThemeContext';
import { Recipe } from '@/contexts/RecipesContext';
import { supabase } from '@/lib/supabase';
import {
  Heart,
  BookmarkPlus,
  Clock,
  Users,
  ChefHat,
  Trash2,
} from 'lucide-react-native';

interface RecipeCardProps {
  recipe: Recipe;
  onSave?: () => void;
  onSaveAndFavorite?: () => void;
  onToggleFavorite?: () => void;
  onDelete?: () => void;
  showSaveButton?: boolean;
  showHeartButton?: boolean;
  selectedAllergens?: { $id: string; name: string }[];
  isSaving?: boolean;
  isFavoriting?: boolean;
}

export default function RecipeCard({
  recipe,
  onSave,
  onSaveAndFavorite,
  onToggleFavorite,
  onDelete = () => {},
  showSaveButton = false,
  showHeartButton = false,
  selectedAllergens = [],
  isSaving = false,
  isFavoriting = false,
}: RecipeCardProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  // Get the image URL - either from Supabase storage or fallback
  const getImageUrl = () => {
    if (recipe.image && recipe.id) {
      const baseUrl = process.env.EXPO_PUBLIC_RECIPE_IMAGES!; // define it in your .env
      return `${baseUrl}/${recipe.id}/${recipe.image}`;
    }

    return 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';
  };

  const handleCardPress = () => {
    if (recipe.id) {
      router.push(`/recipe/${recipe.id}`);
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

  const styles = getStyles(colors);

  // Show preview version for search results (no image)
  if (showSaveButton) {
    return (
      <TouchableOpacity style={styles.card} onPress={handleCardPress}>
        <View style={styles.previewContent}>
          <Text style={styles.previewTitle}>{recipe.title}</Text>

          <Text style={styles.headNote}>{recipe.headNote}</Text>

          <Text style={styles.previewDescription}>{recipe.description}</Text>

          <View style={styles.previewMetadata}>
            <View style={styles.previewMetadataItem}>
              <Users size={16} color={colors.text} />
              <Text style={styles.previewMetadataText}>
                {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View style={styles.previewTags}>
            {selectedAllergens.map((allergen, index) => (
              <View
                key={`allergen-free-${index}`}
                style={styles.allergenFreeTag}
              >
                <Text style={styles.previewTagText}>
                  🚫 {allergen.name.toLowerCase()}-free
                </Text>
              </View>
            ))}
            {recipe.allergens.map((allergen, index) => (
              <View key={`allergen-${index}`} style={styles.allergenTag}>
                <Text style={styles.previewTagText}>🚫 {allergen}</Text>
              </View>
            ))}
            {recipe.dietaryPrefs.map((dietary, index) => (
              <View key={`dietary-${index}`} style={styles.dietaryTag}>
                <Text style={styles.previewTagText}>🌱 {dietary}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Corner action buttons for search results */}
        {showSaveButton && (
          <View style={styles.cornerActions}>
            {onSave && (
              <TouchableOpacity
                style={[styles.cornerButton, styles.saveCornerButton]}
                onPress={onSave}
                disabled={isSaving || isFavoriting}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <BookmarkPlus size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            )}

            {onSaveAndFavorite && (
              <TouchableOpacity
                style={[styles.cornerButton, styles.favoriteCornerButton]}
                onPress={onSaveAndFavorite}
                disabled={isSaving || isFavoriting}
              >
                {isFavoriting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Heart size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Show full version with image for saved recipes
  return (
    <TouchableOpacity style={styles.card} onPress={handleCardPress}>
      <Image source={{ uri: getImageUrl() }} style={styles.image} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{recipe.title}</Text>
          <View style={styles.actionButtons}>
            {onDelete && !showSaveButton && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onDelete}
              >
                <Trash2
                  size={20}
                  color={colors.error}
                />
              </TouchableOpacity>
            )}
            {onToggleFavorite && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onToggleFavorite}
              >
                <Heart
                  size={20}
                  color={
                    recipe.isFavorite ? colors.error : colors.textSecondary
                  }
                  fill={recipe.isFavorite ? colors.error : 'none'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.description}>{recipe.description}</Text>

        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.metadataText}>{recipe.cookTime.replace('minutes', 'min')}</Text>
          </View>

          <View style={styles.metadataItem}>
            <Users size={14} color={colors.textSecondary} />
            <Text style={styles.metadataText}>{recipe.servings} servings</Text>
          </View>

          <View style={styles.difficulty}>
            <ChefHat size={14} color={getDifficultyColor(recipe.difficulty)} />
            <Text
              style={[
                styles.difficultyText,
                { color: getDifficultyColor(recipe.difficulty) },
              ]}
            >
              {recipe.difficulty}
            </Text>
          </View>
        </View>

        {recipe.tags.length > 0 && (
          <View style={styles.tags}>
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.previewTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {(recipe.allergens.length > 0 || recipe.dietaryPrefs.length > 0) && (
          <View style={styles.tags}>
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
        )}
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      height: 520, // Fixed height for consistent layout
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: 140, // Fixed image height
      backgroundColor: colors.border,
    },
    content: {
      padding: 16,
    },
    previewContent: {
      padding: 20,
      position: 'relative',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      height: 50, // Fixed header height for 2 lines of title
      marginBottom: 8,
    },
    title: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.textPrimary,
      flex: 1,
      marginRight: 8,
      height: 50, // Exactly 2 lines at 18px + 6px line height
      lineHeight: 22,
    },
    previewTitle: {
      fontSize: 17,
      fontFamily: 'Inter-Bold',
      color: colors.textPrimary,
      marginBottom: 12,
      lineHeight: 26,
      paddingRight: 80,
      flexWrap: 'wrap',
    },
    headNote: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 12,
      lineHeight: 22,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    cornerActions: {
      position: 'absolute',
      top: 16,
      right: 16,
      flexDirection: 'row',
      gap: 8,
    },
    cornerButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    saveCornerButton: {
      backgroundColor: colors.primary,
    },
    favoriteCornerButton: {
      backgroundColor: colors.error,
    },
    description: {
      fontSize: 15,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
      height: 88, // Fixed height for exactly 4 lines
      lineHeight: 20,
      overflow: 'hidden',
      marginBottom: 12,
    },
    previewDescription: {
      fontSize: 16,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 16,
    },
    metadata: {
      flexDirection: 'row',
      height: 20, // Fixed height for 1 row
      gap: 16,
      marginBottom: 12,
    },
    previewMetadata: {
      flexDirection: 'row',
      gap: 20,
      marginBottom: 16,
      paddingVertical: 8,
    },
    metadataItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    previewMetadataItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metadataText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    previewMetadataText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    difficulty: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    difficultyText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      textTransform: 'capitalize',
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      height: 24, // Fixed height for 1 row of tags
      overflow: 'hidden',
      gap: 8,
      marginBottom: 16,
    },
    previewTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    tag: {
      backgroundColor: '#8ec7df', // Colors.cerulean[200]
      height: 24, // Fixed tag height
      justifyContent: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    allergenTag: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      height: 24, // Fixed tag height
      justifyContent: 'center',
      paddingVertical: 4,
      borderRadius: 8,
    },
    allergenFreeTag: {
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
    },
    dietaryTag: {
      backgroundColor: colors.dietary,
      paddingHorizontal: 8,
      height: 24, // Fixed tag height
      justifyContent: 'center',
      paddingVertical: 4,
      borderRadius: 8,
    },
    tagText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textWhite,
    },
    previewTagText: {
      fontSize: 13,
      fontFamily: 'Inter-Medium',
      color: colors.textWhite,
    },
  });
