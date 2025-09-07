/*
  # Add cooking method column to recipes table

  1. Changes
    - Add `cooking_method` column to `recipes` table
    - Set default value to 'Bake' for existing recipes
    - Add check constraint to ensure valid cooking methods

  2. Valid Cooking Methods
    - Bake, Boil, Grill, Braise, Steam, Fry, Stew, Sous vide, Slow cooker, Instant Pot, Microwave, Air Fryer
*/

-- Add cooking_method column to recipes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'cooking_method'
  ) THEN
    ALTER TABLE recipes ADD COLUMN cooking_method text DEFAULT 'Bake';
  END IF;
END $$;

-- Add check constraint for valid cooking methods
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'recipes_cooking_method_check'
  ) THEN
    ALTER TABLE recipes ADD CONSTRAINT recipes_cooking_method_check 
    CHECK (cooking_method IN (
      'Bake', 'Boil', 'Grill', 'Braise', 'Steam', 'Fry', 'Stew', 
      'Sous vide', 'Slow cooker', 'Instant Pot', 'Microwave', 'Air Fryer'
    ));
  END IF;
END $$;