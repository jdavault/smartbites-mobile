/*
  # Emergency Fix - Create Base Tables
  
  This migration creates the base tables needed by sparkling_leaf.sql
  Uses timestamp 20250903230742 to run exactly 1 second before sparkling_leaf.sql (20250903230743)
  
  1. New Tables
    - `recipes` - Base recipe table structure
    - `cooking_methods` - Cooking methods lookup table
    
  2. Security
    - Enable RLS on both tables
    - Add basic read policies for authenticated users
    
  3. Initial Data
    - Insert basic cooking methods
*/

-- Create recipes table with minimal structure
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text DEFAULT '',
  description text DEFAULT '',
  ingredients text[] DEFAULT '{}',
  instructions text[] DEFAULT '{}',
  prep_time text DEFAULT '',
  cook_time text DEFAULT '',
  servings integer DEFAULT 4,
  difficulty text DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags text[] DEFAULT '{}',
  search_query text DEFAULT '',
  notes text DEFAULT '',
  nutrition_info text DEFAULT '',
  image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cooking methods table
CREATE TABLE IF NOT EXISTS cooking_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_methods ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Anyone can read recipes" ON recipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert recipes" ON recipes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update recipes" ON recipes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Anyone can read cooking methods" ON cooking_methods FOR SELECT TO authenticated USING (true);

-- Insert basic cooking methods
INSERT INTO cooking_methods (name, description) VALUES
  ('Bake', 'Cooked in an oven using dry heat'),
  ('Boil', 'Cooked in boiling water or other liquid'),
  ('Grill', 'Cooked over direct heat, typically on a grill'),
  ('Braise', 'Cooked slowly in liquid after browning'),
  ('Steam', 'Cooked using steam from boiling water'),
  ('Fry', 'Cooked in oil or fat at high temperature'),
  ('Stew', 'Cooked slowly in liquid'),
  ('Sous vide', 'Cooked in vacuum-sealed bags in water bath'),
  ('Slow cooker', 'Cooked at low temperature for extended time'),
  ('Instant Pot', 'Cooked using pressure cooking'),
  ('Microwave', 'Cooked using microwave radiation'),
  ('Air Fryer', 'Cooked using circulated hot air')
ON CONFLICT (name) DO NOTHING;

-- Log the emergency fix
DO $$
BEGIN
  RAISE NOTICE 'Emergency fix: Created base tables before sparkling_leaf.sql';
  RAISE NOTICE 'This allows sparkling_leaf.sql to reference recipes(id) successfully';
END $$;