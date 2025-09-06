/*
  # Create Base Tables - Emergency Dependency Fix
  
  This migration runs BEFORE all other migrations to create the base tables
  that other migrations depend on.
  
  1. New Tables
    - `recipes` - Base recipe table (minimal structure)
    - `cooking_methods` - Cooking methods lookup table
    
  2. Notes
    - Uses timestamp 20250901000000 to run before sparkling_leaf.sql
    - Creates minimal structure to satisfy foreign key dependencies
    - Later migrations will expand these tables with full structure
*/

-- Create minimal recipes table to satisfy foreign key dependencies
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create cooking methods table (needed by sparkling_leaf.sql)
CREATE TABLE IF NOT EXISTS cooking_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS (will be expanded by later migrations)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_methods ENABLE ROW LEVEL SECURITY;

-- Basic policies (will be expanded by later migrations)
CREATE POLICY "Anyone can read recipes"
  ON recipes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read cooking methods"
  ON cooking_methods
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert basic cooking methods (needed by sparkling_leaf.sql)
INSERT INTO cooking_methods (name, description) VALUES
  ('Bake', 'Cooked in an oven using dry heat'),
  ('Grill', 'Cooked over direct heat'),
  ('Fry', 'Cooked in oil at high temperature'),
  ('Steam', 'Cooked using steam'),
  ('Boil', 'Cooked in boiling water')
ON CONFLICT (name) DO NOTHING;

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE 'Created base tables to fix migration dependencies';
  RAISE NOTICE 'Later migrations will expand these tables with full structure';
END $$;