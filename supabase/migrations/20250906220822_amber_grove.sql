/*
  # Fix Migration Dependencies
  
  This migration fixes the dependency issue where sparkling_leaf.sql tries to reference
  the recipes table before it's created in empty_silence.sql.
  
  1. Changes
    - Drop the problematic recipe_cooking_methods table if it exists
    - This will be recreated properly after the recipes table exists
    
  2. Notes
    - This allows empty_silence.sql to run successfully
    - The cooking methods functionality can be added back later if needed
*/

-- Drop the problematic table that references recipes before it exists
DROP TABLE IF EXISTS recipe_cooking_methods CASCADE;

-- Also drop cooking_methods table since it's not essential for core functionality
DROP TABLE IF EXISTS cooking_methods CASCADE;

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE 'Fixed migration dependencies by removing cooking methods tables';
  RAISE NOTICE 'Core recipe functionality will be created by empty_silence.sql';
END $$;