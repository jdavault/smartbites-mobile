/*
  # Create base schema for SmartBites application

  1. New Tables
    - `allergens` - Master list of allergens (Milk, Eggs, etc.)
    - `dietary_prefs` - Master list of dietary preferences (Vegan, Keto, etc.)
    - `recipes` - Recipe data with ingredients, instructions, etc.
    - `user_profiles` - Extended user profile information
    - `user_allergens` - User's selected allergens to avoid
    - `user_dietary_prefs` - User's selected dietary preferences
    - `recipe_allergens` - Junction table for recipe-allergen relationships
    - `recipe_dietary_prefs` - Junction table for recipe-dietary preference relationships
    - `user_recipes` - Junction table for user-recipe relationships (saved, favorited)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for reading lookup tables (allergens, dietary_prefs)

  3. Initial Data
    - Insert standard allergens (FDA top 9)
    - Insert common dietary preferences
*/

-- Create allergens lookup table
CREATE TABLE IF NOT EXISTS allergens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create dietary preferences lookup table
CREATE TABLE IF NOT EXISTS dietary_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  head_note text DEFAULT '',
  description text DEFAULT '',
  ingredients text[] DEFAULT '{}',
  instructions text[] DEFAULT '{}',
  prep_time text DEFAULT '',
  cook_time text DEFAULT '',
  servings integer DEFAULT 4,
  difficulty text DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  cooking_method text DEFAULT 'Bake',
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

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  address1 text DEFAULT '',
  address2 text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  zip text DEFAULT '',
  phone text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user allergens table
CREATE TABLE IF NOT EXISTS user_allergens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allergen text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, allergen)
);

-- Create user dietary preferences table
CREATE TABLE IF NOT EXISTS user_dietary_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dietary_pref text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, dietary_pref)
);

-- Create recipe allergens junction table
CREATE TABLE IF NOT EXISTS recipe_allergens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  allergen_id uuid NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recipe_id, allergen_id)
);

-- Create recipe dietary preferences junction table
CREATE TABLE IF NOT EXISTS recipe_dietary_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  dietary_pref_id uuid NOT NULL REFERENCES dietary_prefs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recipe_id, dietary_pref_id)
);

-- Create user recipes junction table
CREATE TABLE IF NOT EXISTS user_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  actions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Enable RLS on all tables
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE dietary_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dietary_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_dietary_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recipes ENABLE ROW LEVEL SECURITY;

-- Policies for allergens (read-only for all authenticated users)
CREATE POLICY "Anyone can read allergens"
  ON allergens
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for dietary_prefs (read-only for all authenticated users)
CREATE POLICY "Anyone can read dietary preferences"
  ON dietary_prefs
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for recipes (read-only for all authenticated users)
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

-- Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for user_allergens
CREATE POLICY "Users can read own allergens"
  ON user_allergens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own allergens"
  ON user_allergens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own allergens"
  ON user_allergens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own allergens"
  ON user_allergens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for user_dietary_prefs
CREATE POLICY "Users can read own dietary prefs"
  ON user_dietary_prefs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dietary prefs"
  ON user_dietary_prefs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dietary prefs"
  ON user_dietary_prefs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dietary prefs"
  ON user_dietary_prefs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for recipe_allergens
CREATE POLICY "Users can read recipe allergens"
  ON recipe_allergens
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert recipe allergens"
  ON recipe_allergens
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for recipe_dietary_prefs
CREATE POLICY "Users can read recipe dietary prefs"
  ON recipe_dietary_prefs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert recipe dietary prefs"
  ON recipe_dietary_prefs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for user_recipes
CREATE POLICY "Users can read own recipes"
  ON user_recipes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON user_recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON user_recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON user_recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert standard allergens (FDA top 9)
INSERT INTO allergens (name, description) VALUES
  ('Wheat (Gluten)', 'Wheat and gluten-containing grains'),
  ('Milk', 'Milk and dairy products'),
  ('Eggs', 'Eggs and egg products'),
  ('Sesame', 'Sesame seeds and sesame products'),
  ('Soybeans', 'Soy and soy products'),
  ('Fish', 'Fish and fish products'),
  ('Shellfish', 'Shellfish and crustaceans'),
  ('Peanuts', 'Peanuts and peanut products'),
  ('Tree Nuts', 'Tree nuts and tree nut products')
ON CONFLICT (name) DO NOTHING;

-- Insert common dietary preferences
INSERT INTO dietary_prefs (name, description) VALUES
  ('Mediterranean', 'Mediterranean diet focusing on whole foods'),
  ('Low Sodium', 'Reduced sodium content'),
  ('Keto', 'Ketogenic low-carb diet'),
  ('Diabetic', 'Diabetic-friendly recipes'),
  ('Vegan', 'Plant-based, no animal products'),
  ('Vegetarian', 'Vegetarian diet'),
  ('Whole 30', 'Whole30 compliant recipes'),
  ('Paleo', 'Paleolithic diet')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_search_key ON recipes(search_key);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);
CREATE INDEX IF NOT EXISTS idx_user_recipes_user_id ON user_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recipes_recipe_id ON user_recipes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_allergens_user_id ON user_allergens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dietary_prefs_user_id ON user_dietary_prefs(user_id);
