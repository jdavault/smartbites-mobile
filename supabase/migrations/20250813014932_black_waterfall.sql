/*
  # Insert Featured Recipes and User Relationships

  1. Insert featured recipes into recipes table
  2. Create user_recipes relationships for recipes that match user allergens and dietary preferences
  3. User ID: 76395f22-34fa-4359-9b7d-537bb4a4b359
  4. User allergens: Eggs, Fish
  5. User dietary preferences: Low-Carb
*/

-- Insert featured recipes
INSERT INTO recipes (
  id,
  title,
  head_note,
  description,
  ingredients,
  instructions,
  prep_time,
  cook_time,
  servings,
  difficulty,
  tags,
  search_query,
  search_key,
  allergens,
  dietary_prefs,
  notes,
  nutrition_info,
  image,
  created_at
) VALUES 
(
  'featured-1'::uuid,
  'Mediterranean Quinoa Bowl',
  'A nutritious and colorful bowl packed with Mediterranean flavors',
  'Fresh quinoa topped with roasted vegetables, olives, and a tangy lemon dressing',
  '["1 cup quinoa", "2 cups vegetable broth", "1 cucumber, diced", "1 cup cherry tomatoes, halved", "1/2 red onion, thinly sliced", "1/2 cup kalamata olives", "1/4 cup olive oil", "2 tablespoons lemon juice", "1 teaspoon dried oregano", "Salt and pepper to taste"]'::jsonb,
  '["Rinse quinoa and cook in vegetable broth according to package directions", "Let quinoa cool to room temperature", "Combine cucumber, tomatoes, red onion, and olives in a large bowl", "Whisk together olive oil, lemon juice, oregano, salt, and pepper", "Add cooled quinoa to vegetables and toss with dressing", "Serve immediately or chill for 30 minutes"]'::jsonb,
  '15 minutes',
  '15 minutes',
  4,
  'easy',
  '["healthy", "mediterranean", "vegetarian", "gluten-free"]'::jsonb,
  'mediterranean quinoa bowl',
  'mediterranean-quinoa-bowl',
  '[]'::jsonb,
  '["Vegetarian", "Gluten-Free"]'::jsonb,
  'Can be made vegan by ensuring vegetable broth is plant-based',
  'Approximately 320 calories per serving',
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
  now()
),
(
  'featured-2'::uuid,
  'Honey Garlic Chicken Stir-Fry',
  'Quick and flavorful weeknight dinner ready in 20 minutes',
  'Tender chicken with crisp vegetables in a sweet and savory honey garlic sauce',
  '["1 lb chicken breast, sliced thin", "2 tablespoons vegetable oil", "1 bell pepper, sliced", "1 cup broccoli florets", "2 carrots, sliced", "3 cloves garlic, minced", "3 tablespoons honey", "2 tablespoons soy sauce", "1 tablespoon cornstarch", "2 green onions, chopped"]'::jsonb,
  '["Heat oil in a large skillet or wok over medium-high heat", "Add chicken and cook until golden brown, about 5-6 minutes", "Add vegetables and cook for 3-4 minutes until crisp-tender", "Mix honey, soy sauce, and cornstarch in a small bowl", "Add garlic to pan and cook for 30 seconds", "Pour sauce over chicken and vegetables, toss to coat", "Cook for 1-2 minutes until sauce thickens", "Garnish with green onions and serve over rice"]'::jsonb,
  '10 minutes',
  '10 minutes',
  4,
  'easy',
  '["quick", "asian", "protein"]'::jsonb,
  'honey garlic chicken stir fry',
  'honey-garlic-chicken-stir-fry',
  '["Soybeans"]'::jsonb,
  '["High-Protein"]'::jsonb,
  'Use tamari instead of soy sauce for gluten-free option',
  'Approximately 280 calories per serving',
  'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg',
  now()
),
(
  'featured-3'::uuid,
  'Classic Chocolate Chip Cookies',
  'Soft, chewy cookies that are perfect for any occasion',
  'Traditional chocolate chip cookies with the perfect balance of crispy edges and soft centers',
  '["2 1/4 cups all-purpose flour", "1 teaspoon baking soda", "1 teaspoon salt", "1 cup butter, softened", "3/4 cup granulated sugar", "3/4 cup brown sugar", "2 large eggs", "2 teaspoons vanilla extract", "2 cups chocolate chips"]'::jsonb,
  '["Preheat oven to 375°F (190°C)", "Mix flour, baking soda, and salt in a bowl", "Cream butter and both sugars until light and fluffy", "Beat in eggs one at a time, then vanilla", "Gradually mix in flour mixture", "Stir in chocolate chips", "Drop rounded tablespoons onto ungreased baking sheets", "Bake 9-11 minutes until golden brown", "Cool on baking sheet for 2 minutes before transferring"]'::jsonb,
  '15 minutes',
  '10 minutes',
  24,
  'easy',
  '["dessert", "baking", "classic"]'::jsonb,
  'chocolate chip cookies',
  'chocolate-chip-cookies',
  '["Wheat (Gluten)", "Eggs", "Milk"]'::jsonb,
  '[]'::jsonb,
  'For chewier cookies, slightly underbake. For crispier cookies, bake an extra minute',
  'Approximately 180 calories per cookie',
  'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg',
  now()
),
(
  'featured-4'::uuid,
  'Grilled Salmon with Lemon Herb Butter',
  'Perfectly grilled salmon with a rich lemon herb butter sauce',
  'Fresh salmon fillets grilled to perfection and topped with aromatic lemon herb butter',
  '["4 salmon fillets (6 oz each)", "2 tablespoons olive oil", "Salt and pepper to taste", "4 tablespoons butter, softened", "2 tablespoons fresh lemon juice", "1 tablespoon fresh dill, chopped", "1 tablespoon fresh parsley, chopped", "2 cloves garlic, minced", "Lemon wedges for serving"]'::jsonb,
  '["Preheat grill to medium-high heat", "Brush salmon with olive oil and season with salt and pepper", "In a small bowl, mix butter, lemon juice, dill, parsley, and garlic", "Grill salmon for 4-5 minutes per side until cooked through", "Top each fillet with herb butter", "Serve immediately with lemon wedges"]'::jsonb,
  '10 minutes',
  '10 minutes',
  4,
  'easy',
  '["seafood", "grilled", "healthy", "low-carb"]'::jsonb,
  'grilled salmon lemon herb butter',
  'grilled-salmon-lemon-herb-butter',
  '["Fish"]'::jsonb,
  '["Low-Carb", "High-Protein"]'::jsonb,
  'Can substitute with other firm fish like halibut or cod',
  'Approximately 350 calories per serving',
  'https://images.pexels.com/photos/1516415/pexels-photo-1516415.jpeg',
  now()
),
(
  'featured-5'::uuid,
  'Zucchini Noodles with Pesto',
  'Light and fresh zucchini noodles tossed in homemade basil pesto',
  'Spiralized zucchini noodles with a vibrant basil pesto sauce, perfect for a low-carb meal',
  '["4 medium zucchini, spiralized", "2 cups fresh basil leaves", "3 cloves garlic", "1/2 cup pine nuts", "1/2 cup grated Parmesan cheese", "1/2 cup extra virgin olive oil", "Salt and pepper to taste", "Cherry tomatoes for garnish"]'::jsonb,
  '["Spiralize zucchini into noodles and set aside", "In a food processor, pulse basil, garlic, and pine nuts", "Add Parmesan cheese and pulse again", "Slowly drizzle in olive oil while processing until smooth", "Season pesto with salt and pepper", "Toss zucchini noodles with pesto", "Garnish with cherry tomatoes and serve immediately"]'::jsonb,
  '15 minutes',
  '0 minutes',
  4,
  'easy',
  '["vegetarian", "low-carb", "fresh", "no-cook"]'::jsonb,
  'zucchini noodles pesto',
  'zucchini-noodles-pesto',
  '["Milk"]'::jsonb,
  '["Vegetarian", "Low-Carb"]'::jsonb,
  'For vegan version, substitute nutritional yeast for Parmesan cheese',
  'Approximately 220 calories per serving',
  'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Create user_recipes relationships for recipes that DON'T contain user's allergens (Eggs, Fish)
-- and DO contain user's dietary preferences (Low-Carb)
INSERT INTO user_recipes (user_id, recipe_id, actions)
SELECT 
  '76395f22-34fa-4359-9b7d-537bb4a4b359'::uuid,
  r.id,
  ARRAY[]::text[]
FROM recipes r
WHERE 
  -- Recipe does NOT contain user's allergens
  NOT (r.allergens ?| ARRAY['Eggs', 'Fish'])
  -- Recipe DOES contain user's dietary preferences
  AND r.dietary_prefs ?| ARRAY['Low-Carb']
  -- Don't create duplicates
  AND NOT EXISTS (
    SELECT 1 FROM user_recipes ur 
    WHERE ur.user_id = '76395f22-34fa-4359-9b7d-537bb4a4b359'::uuid 
    AND ur.recipe_id = r.id
  )
ON CONFLICT (user_id, recipe_id) DO NOTHING;