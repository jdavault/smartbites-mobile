import { supabase } from '@/lib/supabase';

interface GeneratedRecipe {
  title: string;
  headNote: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  searchQuery: string;
  allergens: string[];
  dietaryPrefs: string[];
  notes: string;
  nutritionInfo: string;
}

// Use the edge function URL from your Supabase project
const getEdgeFunctionUrl = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL is required');
  }
  return `${supabaseUrl}/functions/v1/generate-recipes`;
};

export async function generateRecipes(
  query: string,
  allergens: string[] = [],
  dietaryPrefs: string[] = []
): Promise<GeneratedRecipe[]> {
  try {
    const edgeUrl = getEdgeFunctionUrl();
    
    // Get current session for authorization (optional)
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(edgeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include auth token if you want to require logged-in users
        ...(session?.access_token && {
          'Authorization': `Bearer ${session.access_token}`
        }),
      },
      body: JSON.stringify({ 
        query, 
        allergens, 
        dietaryPrefs 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error || `Edge function error: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];

  } catch (error) {
    console.error('Error calling edge function:', error);
    
    // Fallback to mock recipe
    return [generateMockRecipe(query, allergens, dietaryPrefs)];
  }
}

export async function generateRecipeImage(title: string): Promise<string> {
  try {
    // For now, keep image generation in the client since it's simpler
    // You could move this to an edge function too if needed
    const edgeUrl = getEdgeFunctionUrl().replace('generate-recipes', 'generate-image');
    
    const response = await fetch(edgeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error(`Image generation error: ${response.status}`);
    }

    const data = await response.json();
    return data.imageUrl || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';
    
  } catch (error) {
    console.error('Error generating recipe image:', error);
    return 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';
  }
}

function generateMockRecipe(
  query: string,
  allergens: string[],
  dietaryPrefs: string[]
): GeneratedRecipe {
  return {
    title: `Delicious ${query}`,
    headNote: `A wonderful take on ${query} that's both flavorful and satisfying.`,
    description: `This ${query} recipe combines fresh ingredients with simple cooking techniques to create a memorable meal.`,
    ingredients: [
      '2 cups fresh ingredients',
      '1 tablespoon olive oil',
      '1 teaspoon salt',
      '1/2 teaspoon black pepper',
      '2 cloves garlic, minced',
    ],
    instructions: [
      'Prepare all ingredients by washing and chopping as needed.',
      'Heat olive oil in a large skillet over medium heat.',
      'Add garlic and cook for 1 minute until fragrant.',
      'Add main ingredients and season with salt and pepper.',
      'Cook for 15-20 minutes until tender and golden.',
      'Serve immediately while hot.',
    ],
    prepTime: '15 minutes',
    cookTime: '25 minutes',
    servings: 4,
    difficulty: 'easy' as const,
    tags: ['quick', 'healthy', 'family-friendly'],
    searchQuery: query,
    allergens: [],
    dietaryPrefs: dietaryPrefs,
    notes: 'Feel free to substitute ingredients based on your preferences.',
    nutritionInfo: 'Approximately 250 calories per serving',
  };
}