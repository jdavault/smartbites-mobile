-- Check if tables exist in the database
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check if our specific tables exist
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
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
SELECT 'dietary_prefs' as table_name, count(*) as row_count FROM dietary_prefs;