/*
  # Add new fields to menu_items table

  1. New Columns Added
    - `image` (text) - Menu item image URL
    - `dietary_tags` (text[]) - Array of dietary tags like 'Gluten-Free', 'Vegetarian'

  2. Notes
    - Using text array for dietary_tags to store multiple tags
    - All new fields are nullable to maintain compatibility
    - Allergens are already handled via the menu_item_allergens junction table
*/

-- Add image field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'image'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN image text;
  END IF;
END $$;

-- Add dietary_tags field (array of text)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'dietary_tags'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN dietary_tags text[];
  END IF;
END $$;