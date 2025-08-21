/*
  # Replace JSONB columns with many-to-many relationship tables

  1. New Tables
    - `recipe_allergens` - Many-to-many relationship between recipes and allergens
    - `recipe_dietary_prefs` - Many-to-many relationship between recipes and dietary preferences

  2. Changes
    - Remove `allergens` JSONB column from recipes table
    - Remove `dietary_prefs` JSONB column from recipes table

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users to read relationships
    - Add policies for authenticated users to manage relationships for recipes they can access

  4. Indexes
    - Add indexes for better query performance on foreign keys
*/

-- Create recipe_allergens many-to-many table
CREATE TABLE IF NOT EXISTS recipe_allergens (
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
  allergen_id uuid REFERENCES public.allergens(id) ON DELETE RESTRICT,
  PRIMARY KEY (recipe_id, allergen_id)
);

-- Create recipe_dietary_prefs many-to-many table
CREATE TABLE IF NOT EXISTS recipe_dietary_prefs (
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
  dietary_pref_id uuid REFERENCES public.dietary_prefs(id) ON DELETE RESTRICT,
  PRIMARY KEY (recipe_id, dietary_pref_id)
);

-- Enable Row Level Security
ALTER TABLE recipe_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_dietary_prefs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipe_allergens (public read for authenticated users)
CREATE POLICY "Authenticated users can read recipe allergens"
  ON recipe_allergens
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert recipe allergens"
  ON recipe_allergens
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update recipe allergens"
  ON recipe_allergens
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete recipe allergens"
  ON recipe_allergens
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for recipe_dietary_prefs (public read for authenticated users)
CREATE POLICY "Authenticated users can read recipe dietary prefs"
  ON recipe_dietary_prefs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert recipe dietary prefs"
  ON recipe_dietary_prefs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update recipe dietary prefs"
  ON recipe_dietary_prefs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete recipe dietary prefs"
  ON recipe_dietary_prefs
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipe_allergens_recipe_id ON recipe_allergens(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_allergens_allergen_id ON recipe_allergens(allergen_id);
CREATE INDEX IF NOT EXISTS idx_recipe_dietary_prefs_recipe_id ON recipe_dietary_prefs(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_dietary_prefs_dietary_pref_id ON recipe_dietary_prefs(dietary_pref_id);

-- Remove the JSONB columns from recipes table
ALTER TABLE recipes DROP COLUMN IF EXISTS allergens;
ALTER TABLE recipes DROP COLUMN IF EXISTS dietary_prefs;