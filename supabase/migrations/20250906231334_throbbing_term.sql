-- Check what tables exist in the public schema
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check if our specific tables exist with their columns
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN (
    'allergens', 
    'dietary_prefs', 
    'recipes', 
    'user_profiles',
    'user_allergens',
    'user_dietary_prefs',
    'recipe_allergens',
    'recipe_dietary_prefs',
    'user_recipes'
  )
ORDER BY table_name, ordinal_position;

-- Check if there's any data in the lookup tables
SELECT 'allergens' as table_name, count(*) as row_count FROM allergens
UNION ALL
SELECT 'dietary_prefs' as table_name, count(*) as row_count FROM dietary_prefs
UNION ALL
SELECT 'recipes' as table_name, count(*) as row_count FROM recipes
UNION ALL
SELECT 'user_profiles' as table_name, count(*) as row_count FROM user_profiles;

-- Check what allergens were inserted
SELECT id, name, description FROM allergens ORDER BY name;

-- Check what dietary preferences were inserted  
SELECT id, name, description FROM dietary_prefs ORDER BY name;