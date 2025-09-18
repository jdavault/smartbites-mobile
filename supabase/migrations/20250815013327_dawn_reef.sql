/*
  # Fix menu items public access

  1. Security Changes
    - Add public read access policy for verified menu items
    - Ensure menu item images are accessible to anonymous users
    - Keep existing authenticated user policies intact

  2. Changes
    - Add policy for public/anon users to read verified menu items with allergen data
    - This allows the MenuSearch and RestaurantDetail pages to work for non-logged-in users
*/

-- Enable RLS on menu_items if not already enabled
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Add policy for public read access to verified menu items
CREATE POLICY "Public can read verified menu items with allergens"
  ON menu_items
  FOR SELECT
  TO public
  USING (is_verified = true);

-- Also ensure menu_item_allergens can be read publicly for verified items
ALTER TABLE menu_item_allergens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read allergens for verified menu items"
  ON menu_item_allergens
  FOR SELECT
  TO public
  USING (
    menu_item_id IN (
      SELECT id FROM menu_items WHERE is_verified = true
    )
  );