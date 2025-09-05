/*
  # Find Duplicate Recipes by Title and Head Note
  
  This query identifies recipes that have the same title AND head_note,
  which are likely true duplicates that should be cleaned up.
*/

-- Find recipes with duplicate title + head_note combinations
SELECT 
  title,
  head_note,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY created_at) as recipe_ids,
  array_agg(created_at ORDER BY created_at) as created_dates,
  array_agg(search_query ORDER BY created_at) as search_queries
FROM recipes 
GROUP BY title, head_note
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, title;

-- Alternative: More detailed view with user relationships
SELECT 
  r.title,
  r.head_note,
  COUNT(*) OVER (PARTITION BY r.title, r.head_note) as duplicate_count,
  r.id as recipe_id,
  r.created_at,
  r.search_query,
  COUNT(ur.user_id) as user_count,
  array_agg(DISTINCT ur.user_id) FILTER (WHERE ur.user_id IS NOT NULL) as users_who_saved
FROM recipes r
LEFT JOIN user_recipes ur ON ur.recipe_id = r.id
GROUP BY r.id, r.title, r.head_note, r.created_at, r.search_query
HAVING COUNT(*) OVER (PARTITION BY r.title, r.head_note) > 1
ORDER BY r.title, r.head_note, r.created_at;

-- Quick count of total duplicates
SELECT 
  'Total duplicate groups' as metric,
  COUNT(*) as value
FROM (
  SELECT title, head_note
  FROM recipes 
  GROUP BY title, head_note
  HAVING COUNT(*) > 1
) duplicates;

-- Find exact matches (title + head_note + description)
SELECT 
  title,
  head_note,
  LEFT(description, 50) as description_preview,
  COUNT(*) as exact_matches,
  array_agg(id ORDER BY created_at) as recipe_ids
FROM recipes 
GROUP BY title, head_note, description
HAVING COUNT(*) > 1
ORDER BY exact_matches DESC, title;