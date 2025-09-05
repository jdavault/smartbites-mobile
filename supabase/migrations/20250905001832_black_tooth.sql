/*
  # Recipe Cleanup Query with Cascading Deletes
  
  This query safely removes a recipe and all related records:
  - user_recipes (user-recipe relationships)
  - recipe_allergens (recipe-allergen relationships) 
  - recipe_dietary_prefs (recipe-dietary preference relationships)
  - recipe_cooking_methods (recipe-cooking method relationships)
  - The recipe itself from recipes table
  
  The CASCADE constraints should handle most relationships automatically,
  but we'll be explicit for safety.
*/

-- Replace 'YOUR_RECIPE_ID_HERE' with the actual recipe ID you want to delete
DO $$
DECLARE
  target_recipe_id uuid := 'YOUR_RECIPE_ID_HERE'; -- 🔄 CHANGE THIS
BEGIN
  -- Log what we're about to delete
  RAISE NOTICE 'Deleting recipe: %', target_recipe_id;
  
  -- Delete user-recipe relationships first (explicit)
  DELETE FROM user_recipes 
  WHERE recipe_id = target_recipe_id;
  
  -- Delete recipe-allergen relationships (explicit)
  DELETE FROM recipe_allergens 
  WHERE recipe_id = target_recipe_id;
  
  -- Delete recipe-dietary preference relationships (explicit)
  DELETE FROM recipe_dietary_prefs 
  WHERE recipe_id = target_recipe_id;
  
  -- Delete recipe-cooking method relationships (explicit)
  DELETE FROM recipe_cooking_methods 
  WHERE recipe_id = target_recipe_id;
  
  -- Finally delete the recipe itself
  DELETE FROM recipes 
  WHERE id = target_recipe_id;
  
  RAISE NOTICE 'Recipe deletion completed successfully';
END $$;

-- Alternative: Single query relying on CASCADE (simpler but less explicit)
-- DELETE FROM recipes WHERE id = 'YOUR_RECIPE_ID_HERE';

-- Query to find recipes you might want to delete (duplicates, test data, etc.)
-- Uncomment and modify as needed:

/*
-- Find potential duplicate recipes by title
SELECT 
  title,
  COUNT(*) as count,
  array_agg(id) as recipe_ids,
  array_agg(created_at) as created_dates
FROM recipes 
GROUP BY title 
HAVING COUNT(*) > 1
ORDER BY count DESC;
*/

/*
-- Find recipes with no user relationships (orphaned)
SELECT r.id, r.title, r.created_at
FROM recipes r
LEFT JOIN user_recipes ur ON ur.recipe_id = r.id
WHERE ur.recipe_id IS NULL
ORDER BY r.created_at DESC;
*/

/*
-- Find recipes by search query pattern
SELECT id, title, search_query, created_at
FROM recipes 
WHERE search_query ILIKE '%chicken%'
ORDER BY created_at DESC;
*/