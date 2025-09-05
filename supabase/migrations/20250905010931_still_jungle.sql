/*
  # Delete User Data Script
  
  This script safely removes a user and all related records:
  - user_recipes (user-recipe relationships)
  - user_allergens (user allergen preferences)
  - user_dietary_prefs (user dietary preferences)
  - user_profiles (user profile information)
  - auth.users (the user account itself - optional)
  
  Replace 'YOUR_USER_ID_HERE' with the actual user ID you want to delete.
*/

-- Replace 'YOUR_USER_ID_HERE' with the actual user ID you want to delete
DO $$
DECLARE
  target_user_id uuid := 'YOUR_USER_ID_HERE'; -- 🔄 CHANGE THIS
  user_email text;
BEGIN
  -- Get user email for logging (if it exists)
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = target_user_id;
  
  -- Log what we're about to delete
  RAISE NOTICE 'Deleting user data for: % (ID: %)', COALESCE(user_email, 'Unknown'), target_user_id;
  
  -- Delete user-recipe relationships
  DELETE FROM user_recipes 
  WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted user_recipes entries';
  
  -- Delete user allergen preferences
  DELETE FROM user_allergens 
  WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted user_allergens entries';
  
  -- Delete user dietary preferences
  DELETE FROM user_dietary_prefs 
  WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted user_dietary_prefs entries';
  
  -- Delete user profile
  DELETE FROM user_profiles 
  WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted user_profiles entry';
  
  -- Optional: Delete the user account itself from auth.users
  -- Uncomment the next line if you want to delete the actual user account
  -- DELETE FROM auth.users WHERE id = target_user_id;
  -- RAISE NOTICE 'Deleted auth.users entry';
  
  RAISE NOTICE 'User data deletion completed successfully';
END $$;

-- Alternative: Find users you might want to delete
-- Uncomment and modify as needed:

/*
-- Find users with no saved recipes (inactive users)
SELECT 
  u.id,
  u.email,
  u.created_at,
  COUNT(ur.recipe_id) as saved_recipes_count
FROM auth.users u
LEFT JOIN user_recipes ur ON ur.user_id = u.id
GROUP BY u.id, u.email, u.created_at
HAVING COUNT(ur.recipe_id) = 0
ORDER BY u.created_at DESC;
*/

/*
-- Find users by email pattern
SELECT 
  u.id,
  u.email,
  u.created_at,
  COUNT(ur.recipe_id) as saved_recipes_count,
  COUNT(ua.allergen) as allergen_count,
  COUNT(ud.dietary_pref) as dietary_pref_count
FROM auth.users u
LEFT JOIN user_recipes ur ON ur.user_id = u.id
LEFT JOIN user_allergens ua ON ua.user_id = u.id
LEFT JOIN user_dietary_prefs ud ON ud.user_id = u.id
WHERE u.email ILIKE '%test%' OR u.email ILIKE '%example%'
GROUP BY u.id, u.email, u.created_at
ORDER BY u.created_at DESC;
*/

/*
-- Find duplicate users by email (if any exist)
SELECT 
  email,
  COUNT(*) as duplicate_count,
  array_agg(id) as user_ids,
  array_agg(created_at) as created_dates
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
*/