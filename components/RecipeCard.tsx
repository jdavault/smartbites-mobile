import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Recipe } from '@/contexts/RecipesContext';
import { Heart, BookmarkPlus, Clock, Users, ChefHat } from 'lucide-react-native';

interface RecipeCardProps {
  recipe: Recipe;
  onSave?: () => void;
  onSaveAndFavorite?: () => void;
  onToggleFavorite?: () => void;
  showSaveButton?: boolean;
  showHeartButton?: boolean;
}

export default function RecipeCard({ 
  recipe, 
  onSave, 
  onSaveAndFavorite,
  onToggleFavorite,
  showSaveButton = false,
  showHeartButton = false
}: RecipeCardProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handleCardPress = () => {
    if (recipe.id) {
      router.push(`/recipe/${recipe.id}`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return colors.success;
      case 'medium': return colors.warning;
      case 'hard': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: 200,
      backgroundColor: colors.border,
    },
    content: {
      padding: 16,
    },
    previewContent: {
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    title: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
      flex: 1,
      marginRight: 8,
    },
    previewTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: '#FF8866',
      marginBottom: 12,
      lineHeight: 26,
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
    iconActions: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    iconButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveIconButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    favoriteIconButton: {
      backgroundColor: colors.error,
      borderColor: colors.error,
    },
    description: {
      fontSize: 14,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    previewDescription: {
      fontSize: 15,
      fontFamily: 'Lato-Regular',
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 16,
    },
    metadata: {
      flexDirection: 'row',
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
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    allergenTag: {
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
    },
    dietaryTag: {
      backgroundColor: colors.dietary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
    },
    tagText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: '#FFFFFF',
    },
    previewTagText: {
      fontSize: 13,
      fontFamily: 'Inter-Medium',
      color: '#FFFFFF',
    },
  });

  // Show preview version for search results (no image)
  if (showSaveButton) {
    return (
      <View style={styles.card}>
        <View style={styles.previewContent}>
          <Text style={styles.previewTitle}>{recipe.title}</Text>
          
          <Text style={styles.headNote}>{recipe.headNote}</Text>
          
          <Text style={styles.previewDescription}>{recipe.description}</Text>

          <View style={styles.previewMetadata}>
            <View style={styles.previewMetadataItem}>
              <Clock size={16} color={colors.text} />
              <Text style={styles.previewMetadataText}>
                {recipe.prepTime}
              </Text>
            </View>
            
            <View style={styles.previewMetadataItem}>
              <Users size={16} color={colors.text} />
              <Text style={styles.previewMetadataText}>
                {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View style={styles.previewTags}>
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

          <View style={styles.iconActions}>
            {onSave && (
              <TouchableOpacity 
                style={[styles.iconButton, styles.saveIconButton]} 
                onPress={onSave}
              >
                <BookmarkPlus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            
            {onSaveAndFavorite && (
              <TouchableOpacity 
                style={[styles.iconButton, styles.favoriteIconButton]} 
                onPress={onSaveAndFavorite}
              >
                <Heart size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Show full version with image for saved recipes
  return (
    <TouchableOpacity style={styles.card} onPress={handleCardPress}>
      <Image
        source={{ 
          uri: recipe.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg' 
        }}
        style={styles.image}
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{recipe.title}</Text>
          <View style={styles.actionButtons}>
            {onToggleFavorite && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onToggleFavorite}
              >
                <Heart
                  size={20}
                  color={recipe.isFavorite ? colors.error : colors.textSecondary}
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
              {recipe.prepTime} + {recipe.cookTime}
            </Text>
          </View>
          
          <View style={styles.metadataItem}>
            <Users size={14} color={colors.textSecondary} />
            <Text style={styles.metadataText}>{recipe.servings} servings</Text>
          </View>
          
          <View style={styles.difficulty}>
            <ChefHat size={14} color={getDifficultyColor(recipe.difficulty)} />
            <Text style={[styles.difficultyText, { color: getDifficultyColor(recipe.difficulty) }]}>
              {recipe.difficulty}
            </Text>
          </View>
        </View>

        {recipe.tags.length > 0 && (
          <View style={styles.tags}>
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}