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
    },
    horizontalCardContainer: {
      width: width * 0.8,
      marginRight: 16,
    },
    verticalCardContainer: {
      marginBottom: 16,
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