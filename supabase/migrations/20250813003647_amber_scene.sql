/*
  # Restructure Recipes Database Schema - Simple Join Table

  1. New Tables
    - `recipes` - Master recipes table without user_id
    - `user_recipes` - Simple join table with user_id, recipe_id, actions

  2. Data Migration
    - Move existing user_recipes data to new structure
    - Preserve all recipe data and user associations

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- First, rename the existing user_recipes table to preserve data
ALTER TABLE IF EXISTS user_recipes RENAME TO user_recipes_backup;

-- Create recipes master table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create simple user_recipes join table
CREATE TABLE IF NOT EXISTS user_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  actions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Migrate existing data from user_recipes_backup to new structure
DO $$
DECLARE
  recipe_record RECORD;
  new_recipe_id uuid;
BEGIN
  -- Only migrate if backup table exists and has data
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_recipes_backup') THEN
    FOR recipe_record IN 
      SELECT * FROM user_recipes_backup
    LOOP
      -- Insert recipe into recipes table
      INSERT INTO recipes (
        title, head_note, description, ingredients, instructions,
        prep_time, cook_time, servings, difficulty, tags,
        search_query, search_key, allergens, dietary_prefs,
        notes, nutrition_info, image, created_at, updated_at
      ) VALUES (
        recipe_record.title, recipe_record.head_note, recipe_record.description,
        recipe_record.ingredients, recipe_record.instructions,
        recipe_record.prep_time, recipe_record.cook_time, recipe_record.servings,
        recipe_record.difficulty, recipe_record.tags,
        recipe_record.search_query, recipe_record.search_key,
        recipe_record.allergens, recipe_record.dietary_prefs,
        recipe_record.notes, recipe_record.nutrition_info, recipe_record.image,
        recipe_record.created_at, recipe_record.updated_at
      ) RETURNING id INTO new_recipe_id;

      -- Create user recipe relationship
      INSERT INTO user_recipes (
        user_id, recipe_id, actions, created_at, updated_at
      ) VALUES (
        recipe_record.user_id,
        new_recipe_id,
        CASE 
          WHEN COALESCE(recipe_record.is_favorite, false) = true 
          THEN '["favorite"]'::jsonb 
          ELSE '[]'::jsonb 
        END,
        recipe_record.created_at,
        recipe_record.updated_at
      );
    END LOOP;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipes (public read for authenticated users)
CREATE POLICY "Authenticated users can read all recipes"
  ON recipes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert recipes"
  ON recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update recipes"
  ON recipes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for user_recipes
CREATE POLICY "Users can read own recipe relationships"
  ON user_recipes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipe relationships"
  ON user_recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipe relationships"
  ON user_recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipe relationships"
  ON user_recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_search_key ON recipes(search_key);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_recipes_allergens ON recipes USING GIN(allergens);
CREATE INDEX IF NOT EXISTS idx_recipes_dietary_prefs ON recipes USING GIN(dietary_prefs);

CREATE INDEX IF NOT EXISTS idx_user_recipes_user_id ON user_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recipes_recipe_id ON user_recipes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_recipes_actions ON user_recipes USING GIN(actions);
CREATE INDEX IF NOT EXISTS idx_user_recipes_user_recipe ON user_recipes(user_id, recipe_id);

-- Add updated_at triggers
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_recipes_updated_at
  BEFORE UPDATE ON user_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Drop backup table after successful migration
-- (Commented out for safety - uncomment after verifying migration)
-- DROP TABLE IF EXISTS user_recipes_backup;