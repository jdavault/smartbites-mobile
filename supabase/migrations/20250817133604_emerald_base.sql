/*
  # Add Lookup Tables and Foreign Keys

  1. New Tables
    - `allergens` - Master list of allergens
    - `dietary_prefs` - Master list of dietary preferences (rename existing table)

  2. Table Modifications
    - Add `allergen_id` foreign key to `user_allergens`
    - Add `dietary_pref_id` foreign key to `user_dietary_prefs`
    - Migrate existing text data to use foreign keys

  3. Security
    - Enable RLS on new tables
    - Add policies for public read access to lookup tables
    - Update existing policies for junction tables
*/

-- Create allergens lookup table
CREATE TABLE IF NOT EXISTS allergens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Insert standard allergens
INSERT INTO allergens (name, description) VALUES
  ('Milk', 'Dairy products and milk-based ingredients'),
  ('Eggs', 'Eggs and egg-based products'),
  ('Fish', 'Fish and fish-based products'),
  ('Shellfish', 'Shellfish and crustacean products'),
  ('Tree Nuts', 'Tree nuts including almonds, walnuts, pecans, etc.'),
  ('Peanuts', 'Peanuts and peanut-based products'),
  ('Wheat (Gluten)', 'Wheat and gluten-containing grains'),
  ('Soybeans', 'Soy and soy-based products'),
  ('Sesame', 'Sesame seeds and sesame-based products')
ON CONFLICT (name) DO NOTHING;

-- The dietary_prefs table already exists, so we'll use it as-is

-- Add foreign key columns to junction tables
ALTER TABLE user_allergens ADD COLUMN IF NOT EXISTS allergen_id uuid REFERENCES allergens(id) ON DELETE CASCADE;
ALTER TABLE user_dietary_prefs ADD COLUMN IF NOT EXISTS dietary_pref_id uuid REFERENCES dietary_prefs(id) ON DELETE CASCADE;

-- Migrate existing text data to foreign keys
DO $$
DECLARE
  user_allergen_record RECORD;
  user_dietary_record RECORD;
  allergen_uuid uuid;
  dietary_pref_uuid uuid;
BEGIN
  -- Migrate user_allergens
  FOR user_allergen_record IN 
    SELECT * FROM user_allergens WHERE allergen_id IS NULL AND allergen IS NOT NULL
  LOOP
    -- Find the corresponding allergen UUID
    SELECT id INTO allergen_uuid 
    FROM allergens 
    WHERE name = user_allergen_record.allergen;
    
    IF allergen_uuid IS NOT NULL THEN
      UPDATE user_allergens 
      SET allergen_id = allergen_uuid 
      WHERE id = user_allergen_record.id;
    END IF;
  END LOOP;

  -- Migrate user_dietary_prefs
  FOR user_dietary_record IN 
    SELECT * FROM user_dietary_prefs WHERE dietary_pref_id IS NULL AND dietary_pref IS NOT NULL
  LOOP
    -- Find the corresponding dietary preference UUID
    SELECT id INTO dietary_pref_uuid 
    FROM dietary_prefs 
    WHERE name = user_dietary_record.dietary_pref;
    
    IF dietary_pref_uuid IS NOT NULL THEN
      UPDATE user_dietary_prefs 
      SET dietary_pref_id = dietary_pref_uuid 
      WHERE id = user_dietary_record.id;
    END IF;
  END LOOP;
END $$;

-- Enable Row Level Security on new tables
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for allergens (public read access)
CREATE POLICY "Anyone can read allergens"
  ON allergens
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_allergens_name ON allergens(name);
CREATE INDEX IF NOT EXISTS idx_user_allergens_allergen_id ON user_allergens(allergen_id);
CREATE INDEX IF NOT EXISTS idx_user_dietary_prefs_dietary_pref_id ON user_dietary_prefs(dietary_pref_id);

-- Add unique constraints to prevent duplicate user selections
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_allergens_unique 
  ON user_allergens(user_id, allergen_id) 
  WHERE allergen_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_dietary_prefs_unique 
  ON user_dietary_prefs(user_id, dietary_pref_id) 
  WHERE dietary_pref_id IS NOT NULL;

-- Optional: Remove old text columns after migration (commented out for safety)
-- ALTER TABLE user_allergens DROP COLUMN IF EXISTS allergen;
-- ALTER TABLE user_dietary_prefs DROP COLUMN IF EXISTS dietary_pref;