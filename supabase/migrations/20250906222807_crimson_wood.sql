/*
  # Create base recipes table
  
  This migration creates the recipes table early so that violet_desert.sql
  can successfully add the cooking_method column.
  
  1. New Tables
    - `recipes` - Base recipe table with essential columns
    
  2. Security
    - Enable RLS on recipes table
    - Add basic policies for authenticated users
*/

-- Create recipes table with minimal structure needed for violet_desert.sql
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  head_note text DEFAULT '',
  description text DEFAULT '',
  ingredients text[] DEFAULT '{}',
  instructions text[] DEFAULT '{}',
  prep_time text DEFAULT '',
  cook_time text DEFAULT '',
  servings integer DEFAULT 4,
  difficulty text DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags text[] DEFAULT '{}',
  search_query text DEFAULT '',
  search_key text DEFAULT '',
  notes text DEFAULT '',
  nutrition_info text DEFAULT '',
  allergens_included text DEFAULT '',
  image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Add basic policies
CREATE POLICY "Anyone can read recipes"
  ON recipes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert recipes"
  ON recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update recipes"
  ON recipes
  FOR UPDATE
  TO authenticated
  USING (true);

-- Log the creation
DO $$
BEGIN
  RAISE NOTICE 'Created base recipes table to fix migration dependencies';
  RAISE NOTICE 'violet_desert.sql can now add cooking_method column successfully';
END $$;