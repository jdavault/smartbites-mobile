/*
  # Create menu_item_dietary_prefs junction table

  1. New Tables
    - `menu_item_dietary_prefs`
      - `menu_item_id` (uuid, foreign key to menu_items)
      - `dietary_pref_id` (uuid, foreign key to dietary_prefs)
      - Primary key on both columns (composite)

  2. Security
    - Enable RLS on `menu_item_dietary_prefs` table
    - Add policies for public read access
    - Add policies for authenticated users to manage their restaurant's menu item dietary preferences

  3. Indexes
    - Index on menu_item_id for efficient lookups
    - Index on dietary_pref_id for efficient reverse lookups
*/

-- Create the junction table
CREATE TABLE IF NOT EXISTS menu_item_dietary_prefs (
  menu_item_id uuid NOT NULL,
  dietary_pref_id uuid NOT NULL,
  PRIMARY KEY (menu_item_id, dietary_pref_id)
);

-- Add foreign key constraints
ALTER TABLE menu_item_dietary_prefs 
ADD CONSTRAINT menu_item_dietary_prefs_menu_item_id_fkey 
FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE;

ALTER TABLE menu_item_dietary_prefs 
ADD CONSTRAINT menu_item_dietary_prefs_dietary_pref_id_fkey 
FOREIGN KEY (dietary_pref_id) REFERENCES dietary_prefs(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_item_dietary_prefs_menu_item_id 
ON menu_item_dietary_prefs(menu_item_id);

CREATE INDEX IF NOT EXISTS idx_menu_item_dietary_prefs_dietary_pref_id 
ON menu_item_dietary_prefs(dietary_pref_id);

-- Enable RLS
ALTER TABLE menu_item_dietary_prefs ENABLE ROW LEVEL SECURITY;

-- Public can read dietary preferences for verified menu items
CREATE POLICY "Public can read dietary prefs for verified menu items"
  ON menu_item_dietary_prefs
  FOR SELECT
  TO public
  USING (
    menu_item_id IN (
      SELECT id FROM menu_items WHERE is_verified = true
    )
  );

-- Authenticated users can read dietary preferences for verified menu items
CREATE POLICY "Authenticated can read dietary prefs for verified menu items"
  ON menu_item_dietary_prefs
  FOR SELECT
  TO authenticated
  USING (
    menu_item_id IN (
      SELECT id FROM menu_items WHERE is_verified = true
    )
  );

-- Restaurant owners can manage their own menu item dietary preferences
CREATE POLICY "Restaurants can manage own menu item dietary prefs"
  ON menu_item_dietary_prefs
  FOR ALL
  TO authenticated
  USING (
    menu_item_id IN (
      SELECT mi.id 
      FROM menu_items mi
      JOIN restaurants r ON mi.restaurant_id = r.id
      WHERE r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    menu_item_id IN (
      SELECT mi.id 
      FROM menu_items mi
      JOIN restaurants r ON mi.restaurant_id = r.id
      WHERE r.user_id = auth.uid()
    )
  );

-- Admins can manage all menu item dietary preferences
CREATE POLICY "Admins can manage all menu item dietary prefs"
  ON menu_item_dietary_prefs
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') ~~ '%@smartbites.menu' OR
    (auth.jwt() ->> 'email') ~~ '%@davault.dev'
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') ~~ '%@smartbites.menu' OR
    (auth.jwt() ->> 'email') ~~ '%@davault.dev'
  );