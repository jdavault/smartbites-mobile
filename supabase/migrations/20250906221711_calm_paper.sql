/*
  # Fix Migration Dependencies - Emergency Fix
  
  This migration runs BEFORE sparkling_leaf.sql to prevent the foreign key dependency error.
  
  1. Changes
    - Create a minimal recipes table structure so sparkling_leaf.sql can reference it
    - This prevents the "relation recipes does not exist" error
    
  2. Notes
    - This is a temporary fix to resolve the migration order issue
    - The full recipes table will be properly created by empty_silence.sql
    - Uses IF NOT EXISTS to avoid conflicts
*/

-- Create a minimal recipes table structure to satisfy foreign key dependencies
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

-- Log the emergency fix
DO $$
BEGIN
  RAISE NOTICE 'Emergency fix: Created minimal recipes table to satisfy foreign key dependencies';
  RAISE NOTICE 'Full recipes table structure will be created by empty_silence.sql';
END $$;