/*
  # SmartBites App Database Schema

  1. New Tables
    - `dietary_prefs` - Master list of dietary preferences
    - `user_profiles` - User personal information and settings
    - `user_allergens` - User's allergen restrictions (many-to-many with allergens table)
    - `user_dietary_prefs` - User's dietary preferences (many-to-many with dietary_prefs table)
    - `user_recipes` - User's saved recipe collection

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Ensure users can only access their own records

  3. Indexes and Constraints
    - Primary keys and foreign key relationships
    - Indexes for common query patterns
    - Unique constraints where appropriate
*/

-- Create dietary_prefs master table
CREATE TABLE IF NOT EXISTS dietary_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Insert standard dietary preferences
INSERT INTO dietary_prefs (name, description) VALUES
  ('Vegan', 'Plant-based diet excluding all animal products'),
  ('Vegetarian', 'Diet excluding meat but may include dairy and eggs'),
  ('Gluten-Free', 'Diet excluding gluten-containing grains'),
  ('Dairy-Free', 'Diet excluding milk and dairy products'),
  ('Keto', 'High-fat, low-carbohydrate ketogenic diet'),
  ('Paleo', 'Diet based on foods available during Paleolithic era'),
  ('Low-Carb', 'Diet restricting carbohydrate consumption'),
  ('High-Protein', 'Diet emphasizing protein-rich foods')
ON CONFLICT (name) DO NOTHING;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  first_name text,
  last_name text,
  address1 text,
  address2 text,
  city text,
  state text,
  zip text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_allergens junction table
CREATE TABLE IF NOT EXISTS user_allergens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  allergen text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, allergen)
);

-- Create user_dietary_prefs junction table
CREATE TABLE IF NOT EXISTS user_dietary_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dietary_pref text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, dietary_pref)
);

-- Create user_recipes table
CREATE TABLE IF NOT EXISTS user_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  head_note text,
  description text,
  ingredients jsonb DEFAULT '[]'::jsonb,
  instructions jsonb DEFAULT '[]'::jsonb,
  prep_time text,
  cook_time text,
  servings integer DEFAULT 4,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'easy',
  tags jsonb DEFAULT '[]'::jsonb,
  search_query text,
  search_key text,
  allergens jsonb DEFAULT '[]'::jsonb,
  dietary_prefs jsonb DEFAULT '[]'::jsonb,
  notes text,
  nutrition_info text,
  image text,
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE dietary_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dietary_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dietary_prefs (public read access)
CREATE POLICY "Anyone can read dietary preferences"
  ON dietary_prefs
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- RLS Policies for user_profiles
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
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_allergens
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
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own allergens"
  ON user_allergens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_dietary_prefs
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
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dietary prefs"
  ON user_dietary_prefs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_recipes
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
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON user_recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_allergens_user_id ON user_allergens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_allergens_allergen ON user_allergens(allergen);
CREATE INDEX IF NOT EXISTS idx_user_dietary_prefs_user_id ON user_dietary_prefs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dietary_prefs_pref ON user_dietary_prefs(dietary_pref);
CREATE INDEX IF NOT EXISTS idx_user_recipes_user_id ON user_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recipes_created_at ON user_recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_recipes_is_favorite ON user_recipes(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_user_recipes_search_key ON user_recipes(search_key);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_recipes_updated_at
  BEFORE UPDATE ON user_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();