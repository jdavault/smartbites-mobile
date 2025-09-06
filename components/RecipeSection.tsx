import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Recipe } from '@/contexts/RecipesContext';
import RecipeCard from './RecipeCard';

interface RecipeSectionProps {
  title: string;
  recipes: Recipe[];
  onToggleFavorite: (recipeId: string) => void;
  onDelete?: (recipeId: string) => void;
  horizontal?: boolean;
}

export default function RecipeSection({
  title,
  recipes,
  onToggleFavorite,
  onDelete = undefined,
  horizontal = true,
}: RecipeSectionProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  if (recipes.length === 0) return null;

  // Calculate responsive card width - more generous on mobile
  const cardWidth =
    width < 768 ? Math.min(360, width * 0.9) : Math.min(320, width * 0.85);
  const horizontalPadding = 24;
  const cardGap = 16;

  // Match the page's max container width (you set maxWidth: 1024 in index.tsx)
  const containerMax = 1024;
  const effectiveViewport = Math.min(width, containerMax);
  const availableWidth = effectiveViewport - horizontalPadding * 2;

  let verticalCardWidth;
  if (width <= 360) {
    // 0–360px: same width as the horizontal "tile" card
    verticalCardWidth = Math.min(cardWidth, availableWidth);
  } else if (width <= 690) {
    // 361–690px: grow to ~two cards wide (~680)
    verticalCardWidth = Math.min(680, availableWidth);
  } else if (width <= 1024) {
    // 691–1024px: grow to ~three cards wide (~1024)
    verticalCardWidth = Math.min(1024, availableWidth);
  } else {
    // >1024px: cap at 1024 (matches your page container max)
    verticalCardWidth = 1024;
  }

  const styles = StyleSheet.create({
    section: {
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: Platform.select({
        android: 16, // 20% smaller for Android
        default: 20, // Keep iOS/web at 20
      }),
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
      marginBottom: 12,
      paddingHorizontal: 12,
    },
    horizontalScrollContainer: {
      paddingLeft: 12,
    },
    verticalContainer: {
      paddingHorizontal: 12,
      alignItems: 'center',
      width: '100%',
    },
    horizontalCardContainer: {
      width: cardWidth,
      marginRight: 16,
    },
    verticalCardContainer: {
      marginBottom: 16,
      width: verticalCardWidth,
    },
  });

  if (horizontal) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContainer}
        >
          {recipes.map((recipe) => (
            <View key={recipe.id} style={styles.horizontalCardContainer}>
              <RecipeCard
                recipe={recipe}
                onToggleFavorite={() => onToggleFavorite(recipe.id!)}
                onDelete={onDelete ? () => onDelete(recipe.id!) : undefined}
                isHorizontalLayout={horizontal}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.verticalContainer}>
        {recipes.map((recipe) => (
          <View key={recipe.id} style={styles.verticalCardContainer}>
            <RecipeCard
              recipe={recipe}
              onToggleFavorite={() => onToggleFavorite(recipe.id!)}
              onDelete={onDelete ? () => onDelete(recipe.id!) : undefined}
            />
          </View>
        ))}
      </View>
    </View>
  );
}