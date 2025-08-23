import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Recipe } from '@/contexts/RecipesContext';
import RecipeCard from './RecipeCard';

const { width } = Dimensions.get('window');

interface RecipeSectionProps {
  title: string;
  recipes: Recipe[];
  onToggleFavorite: (recipeId: string) => void;
  onDelete?: (recipeId: string) => void;
  horizontal?: boolean;
}

export default function RecipeSection({ title, recipes, onToggleFavorite, onDelete = undefined, horizontal = true }: RecipeSectionProps) {
  const { colors } = useTheme();

  if (recipes.length === 0) return null;

  // Calculate responsive card width - more generous on mobile
  const cardWidth = width < 768 ? Math.min(360, width * 0.9) : Math.min(320, width * 0.85);
  const horizontalPadding = 24;
  const cardGap = 16;
  const availableWidth = width - (horizontalPadding * 2);
  const cardsPerRow = Math.floor((availableWidth + cardGap) / (cardWidth + cardGap));
  
  // Progressive width scaling with specific breakpoints
  let verticalCardWidth;
  if (width < 690) {
    // Mobile: full available width (current behavior)
    verticalCardWidth = availableWidth;
  } else if (width < 1024) {
    // 690px+: grow to fill more space while matching horizontal sections
    const baseWidth = (cardWidth * cardsPerRow) + (cardGap * (cardsPerRow - 1));
    verticalCardWidth = Math.min(width * 0.92, baseWidth); // 92% of viewport or horizontal width
  } else {
    // 1024px+: cap at 1024px with gutters
    verticalCardWidth = Math.min(1024, (cardWidth * cardsPerRow) + (cardGap * (cardsPerRow - 1)));
  }
    
  const styles = StyleSheet.create({
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: '#FF8866',
      marginBottom: 16,
      paddingHorizontal: 24,
    },
    horizontalScrollContainer: {
      paddingLeft: 24,
    },
    verticalContainer: {
      paddingHorizontal: 24,
      alignItems: 'center',
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