/*
  # Create cooking methods table and integrate with recipes

  1. New Tables
    - `cooking_methods`
      - `id` (uuid, primary key)
      - `name` (text, unique) - e.g., "Grilled", "Baked", "Fried", "Steamed"
      - `description` (text, optional)
      - `created_at` (timestamp)
    - `recipe_cooking_methods`
      - `id` (uuid, primary key)
      - `recipe_id` (uuid, foreign key to recipes)
      - `cooking_method_id` (uuid, foreign key to cooking_methods)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read cooking methods
    - Add policies for users to manage their recipe cooking method relationships

  3. Initial Data
    - Insert common cooking methods like Grilled, Baked, Fried, Steamed, etc.
*/

-- Create cooking methods lookup table
CREATE TABLE IF NOT EXISTS cooking_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create junction table for recipe cooking methods
CREATE TABLE IF NOT EXISTS recipe_cooking_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  cooking_method_id uuid NOT NULL REFERENCES cooking_methods(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recipe_id, cooking_method_id)
);

-- Enable RLS
ALTER TABLE cooking_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_cooking_methods ENABLE ROW LEVEL SECURITY;

-- Policies for cooking_methods (read-only for all authenticated users)
CREATE POLICY "Anyone can read cooking methods"
  ON cooking_methods
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for recipe_cooking_methods
CREATE POLICY "Users can read recipe cooking methods"
  ON recipe_cooking_methods
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert recipe cooking methods"
  ON recipe_cooking_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_recipes ur 
      WHERE ur.recipe_id = recipe_cooking_methods.recipe_id 
      AND ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete recipe cooking methods"
  ON recipe_cooking_methods
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_recipes ur 
      WHERE ur.recipe_id = recipe_cooking_methods.recipe_id 
      AND ur.user_id = auth.uid()
    )
  );

-- Insert common cooking methods
INSERT INTO cooking_methods (name, description) VALUES
  ('Grilled', 'Cooked over direct heat, typically on a grill'),
  ('Baked', 'Cooked in an oven using dry heat'),
  ('Fried', 'Cooked in oil or fat at high temperature'),
  ('Steamed', 'Cooked using steam from boiling water'),
  ('Roasted', 'Cooked in an oven at high temperature'),
  ('Sautéed', 'Cooked quickly in a small amount of fat over high heat'),
  ('Braised', 'Cooked slowly in liquid after browning'),
  ('Boiled', 'Cooked in boiling water or other liquid'),
  ('Poached', 'Cooked gently in simmering liquid'),
  ('Broiled', 'Cooked under direct high heat'),
  ('Stir-Fried', 'Cooked quickly over high heat while stirring'),
  ('Slow-Cooked', 'Cooked at low temperature for extended time'),
  ('Smoked', 'Cooked using smoke from burning wood'),
  ('Raw', 'Not cooked, served fresh'),
  ('No-Bake', 'Prepared without cooking or baking')
ON CONFLICT (name) DO NOTHING;