import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Platform,
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
  Zap,
  Flame,
  Trash2,
} from 'lucide-react-native';
import {
  SUPABASE_RECIPE_IMAGES_PUBLIC_ROUTE,
  SUPABASE_URL,
} from '@/config/constants';

// Safe Platform fallback for web compatibility
const SafePlatform = Platform || { OS: 'web' };

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
  isHorizontalLayout?: boolean;
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
  isHorizontalLayout = false,
}: RecipeCardProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  // Get the image URL - either from Supabase storage or fallback
  const getImageUrl = () => {
    if (recipe.image && recipe.id) {
      const baseUrl = `${SUPABASE_URL}${SUPABASE_RECIPE_IMAGES_PUBLIC_ROUTE}`;
      return `${baseUrl}/${recipe.id}/${recipe.image}`;
    }
    // Return null if no image available
    return null;
  };

  const handleCardPress = () => {
    // Always allow navigation to details, whether saved or search result
    if (recipe.id || showSaveButton) {
      // For search results, we'll pass the recipe data as params
      if (showSaveButton) {
        router.push({
          pathname: '/recipe/search-result',
          params: {
            recipeData: JSON.stringify(recipe),
            fromSearch: 'true',
          },
        });
      } else {
        // For saved/featured recipes, use the normal ID route
        router.push(`/recipe/${recipe.id}`);
      }
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
      <TouchableOpacity style={styles.previewCard} onPress={handleCardPress}>
        <View style={styles.previewContent}>
          <Text style={styles.previewTitle}>{recipe.title}</Text>

          <Text style={styles.headNote}>{recipe.headNote}</Text>

          <Text style={styles.previewDescription}>{recipe.description}</Text>

          <View style={styles.previewMetadata}>
            <View style={styles.previewMetadataItem}>
              <Clock size={16} color={colors.text} />
              <Text style={styles.previewMetadataText}>
                {recipe.cookTime.replace('minutes', 'min')}
              </Text>
            </View>

            <View style={styles.previewMetadataItem}>
              <Users size={16} color={colors.text} />
              <Text style={styles.previewMetadataText}>
                {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
              </Text>
            </View>

            <View style={styles.difficulty}>
              <Zap size={16} color={getDifficultyColor(recipe.difficulty)} />
              <Text
                style={[
                  styles.previewMetadataText,
                  { color: getDifficultyColor(recipe.difficulty) },
                ]}
              >
                {recipe.difficulty}
              </Text>
            </View>

            <View style={styles.method}>
              <Flame size={16} color="#99523d" />
              <Text style={[styles.previewMetadataText, { color: '#99523d' }]}>
                {recipe.method || 'Bake'}
              </Text>
            </View>
          </View>

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
                    <BookmarkPlus size={18} color={colors.text} />
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
                    <Heart size={18} color={colors.error} />
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Show full version with image for saved recipes
  return (
    <TouchableOpacity
      style={[styles.card, isHorizontalLayout && styles.cardWithMaxWidth]}
      onPress={handleCardPress}
    >
      {getImageUrl() && (
        <Image source={{ uri: getImageUrl()! }} style={styles.image} />
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{recipe.title}</Text>
          <View style={styles.actionButtons}>
            {onDelete && !showSaveButton && (
              <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                <Trash2 size={20} color={colors.error} />
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
            <Text style={styles.metadataText}>
              {recipe.cookTime.replace('minutes', 'min')}
            </Text>
          </View>

          <View style={styles.metadataItem}>
            <Users size={14} color={colors.textSecondary} />
            <Text style={styles.metadataText}>{recipe.servings} serv</Text>
          </View>

          <View style={styles.difficulty}>
            <Zap size={14} color={getDifficultyColor(recipe.difficulty)} />
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
            <Flame size={14} color="#99523d" />
            <Text style={[styles.methodText, { color: '#99523d' }]}>
              {recipe.method || 'Bake'}
            </Text>
          </View>
        </View>

        {/* Bottom content: fixed at bottom */}
        <View style={styles.bottomSection}>
          {/* optional spacer or divider */}
          <View style={styles.bottomSpacer} />

          {recipe.tags.length > 0 && (
            <View style={styles.tags}>
              {recipe.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.previewTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {((recipe.allergensToAvoid?.length ?? 0) > 0 ||
            (recipe.dietaryPrefs?.length ?? 0) > 0 ||
            (recipe.allergensIncluded?.length ?? 0) > 0) && (
            <View style={styles.tags}>
              {recipe.allergensToAvoid?.map((allergen, index) => (
                <View key={`allergen-${index}`} style={styles.allergenTag}>
                  <Text style={styles.tagText}>🚫 {allergen}</Text>
                </View>
              ))}
              {recipe.dietaryPrefs?.map((dietary, index) => (
                <View key={`dietary-${index}`} style={styles.dietaryTag}>
                  <Text style={styles.tagText}>🌱 {dietary}</Text>
                </View>
              ))}
              {recipe.allergensIncluded?.map((allergen, index) => (
                <View
                  key={`included-${index}`}
                  style={styles.allergenIncludedTag}
                >
                  <Text style={styles.tagText}>⚠️ {allergen}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (colors: ThemeColors) => {
  // Responsive font sizes - smaller on mobile
  const CARD_FONTS = {
    title: Platform.select({ android: 15, ios: 16, web: 18 }),
    previewTitle: Platform.select({ android: 15, ios: 16, web: 17 }),
    headNote: Platform.select({ android: 14, ios: 15, web: 16 }),
    description: Platform.select({ android: 13, ios: 14, web: 15 }),
    previewDescription: Platform.select({ android: 14, ios: 15, web: 16 }),
    metadata: Platform.select({ android: 11, ios: 12, web: 14 }),
    tag: Platform.select({ android: 10, ios: 11, web: 12 }),
    previewTag: Platform.select({ android: 11, ios: 12, web: 13 }),
  };

  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      width: '100%',
      height:
        SafePlatform.OS === 'android'
          ? 540
          : SafePlatform.OS === 'ios'
          ? 500
          : 540,
    },
    cardWithMaxWidth: {
      maxWidth: 380,
      height:
        SafePlatform.OS === 'android'
          ? 580
          : SafePlatform.OS === 'ios'
          ? 520
          : 560,
      alignSelf: 'center',
    },
    previewCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      width: '100%',
      maxWidth: 380,
      alignSelf: 'center',
    },
    image: {
      width: '100%',
      height: Platform.select({ android: 160, ios: 170, web: 180 }),
      backgroundColor: colors.border,
    },
    content: {
      flex: 1,
      padding: Platform.select({ android: 12, ios: 14, web: 16 }),
    },
    previewContent: {
      padding: Platform.select({ android: 14, ios: 16, web: 20 }),
      position: 'relative',
    },
    bottomSection: {
      marginTop: 'auto',
    },
    bottomSpacer: {
      height: 0,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    title: {
      fontSize: CARD_FONTS.title,
      fontFamily: 'Inter-SemiBold',
      color: colors.textPrimary,
      flex: 1,
      marginRight: 8,
    },
    previewTitle: {
      fontSize: CARD_FONTS.previewTitle,
      fontFamily: 'Inter-Bold',
      color: colors.textPrimary,
      marginBottom: Platform.select({ android: 8, ios: 10, web: 12 }),
      lineHeight: Platform.select({ android: 22, ios: 24, web: 26 }),
      paddingRight: 80,
      flexWrap: 'wrap',
    },
    headNote: {
      fontSize: CARD_FONTS.headNote,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: Platform.select({ android: 8, ios: 10, web: 12 }),
      lineHeight: Platform.select({ android: 20, ios: 21, web: 22 }),
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
      top: Platform.select({ android: 12, ios: 14, web: 16 }),
      right: Platform.select({ android: 12, ios: 14, web: 16 }),
      flexDirection: 'row',
      gap: 8,
    },
    cornerButton: {
      width: Platform.select({ android: 32, ios: 34, web: 36 }),
      height: Platform.select({ android: 32, ios: 34, web: 36 }),
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    saveCornerButton: {},
    favoriteCornerButton: {},
    description: {
      fontSize: CARD_FONTS.description,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
      lineHeight: Platform.select({ android: 18, ios: 19, web: 20 }),
      marginBottom: 0,
    },
    previewDescription: {
      fontSize: CARD_FONTS.previewDescription,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
      lineHeight: Platform.select({ android: 20, ios: 21, web: 22 }),
      marginBottom: Platform.select({ android: 12, ios: 14, web: 16 }),
    },
    metadata: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Platform.select({ android: 8, ios: 10, web: 12 }),
    },
    previewMetadata: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Platform.select({ android: 12, ios: 16, web: 20 }),
      marginBottom: Platform.select({ android: 12, ios: 14, web: 16 }),
      paddingVertical: Platform.select({ android: 6, ios: 7, web: 8 }),
    },
    metadataItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    previewMetadataItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Platform.select({ android: 4, ios: 5, web: 6 }),
    },
    metadataText: {
      fontSize: Platform.select({ android: 10, ios: 11, web: 12 }),
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    previewMetadataText: {
      fontSize: CARD_FONTS.metadata,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    difficulty: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    difficultyText: {
      fontSize: Platform.select({ android: 10, ios: 11, web: 12 }),
      fontFamily: 'Inter-Medium',
      textTransform: 'capitalize',
    },
    method: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    methodText: {
      fontSize: Platform.select({ android: 10, ios: 11, web: 12 }),
      fontFamily: 'Inter-Medium',
      textTransform: 'capitalize',
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Platform.select({ android: 6, ios: 7, web: 8 }),
      marginBottom: 5,
    },
    previewTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Platform.select({ android: 6, ios: 7, web: 8 }),
      marginBottom: 5,
    },
    tag: {
      backgroundColor: '#8ec7df',
      paddingHorizontal: Platform.select({ android: 6, ios: 7, web: 8 }),
      paddingVertical: Platform.select({ android: 3, ios: 3, web: 4 }),
      borderRadius: 8,
    },
    allergenTag: {
      backgroundColor: colors.primary,
      paddingHorizontal: Platform.select({ android: 5, ios: 5, web: 6 }),
      paddingVertical: Platform.select({ android: 2, ios: 2, web: 3 }),
      borderRadius: 8,
    },
    allergenFreeTag: {
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
    },
    allergenIncludedTag: {
      backgroundColor: colors.warning,
      paddingHorizontal: Platform.select({ android: 5, ios: 5, web: 6 }),
      paddingVertical: Platform.select({ android: 2, ios: 2, web: 3 }),
      borderRadius: 8,
    },
    dietaryTag: {
      backgroundColor: colors.dietary,
      paddingHorizontal: Platform.select({ android: 5, ios: 5, web: 6 }),
      paddingVertical: Platform.select({ android: 2, ios: 2, web: 3 }),
      borderRadius: 8,
    },
    tagText: {
      fontSize: CARD_FONTS.tag,
      fontFamily: 'Inter-Medium',
      color: colors.textWhite,
    },
    previewTagText: {
      fontSize: CARD_FONTS.previewTag,
      fontFamily: 'Inter-Medium',
      color: colors.textWhite,
    },
  });
};
