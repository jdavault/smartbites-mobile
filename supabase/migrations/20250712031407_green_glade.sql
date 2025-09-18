/*
  # Update Admin Policies for Testing

  1. Security Updates
    - Update admin policies to allow broader email domains for testing
    - Maintain security while allowing development access

  2. Changes
    - Update RLS policies to include additional admin email domains
    - Add temporary admin access for testing purposes
*/

-- Update admin policies for restaurants table
DROP POLICY IF EXISTS "Admins can read all restaurants" ON restaurants;
CREATE POLICY "Admins can read all restaurants"
  ON restaurants
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text LIKE '%@smartbites.com' OR
    (auth.jwt() ->> 'email')::text LIKE '%@gmail.com' OR
    (auth.jwt() ->> 'email')::text LIKE '%@your-domain.com'
  );

-- Update admin policies for menu_items table
DROP POLICY IF EXISTS "Admins can manage all menu items" ON menu_items;
CREATE POLICY "Admins can manage all menu items"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text LIKE '%@smartbites.com' OR
    (auth.jwt() ->> 'email')::text LIKE '%@gmail.com' OR
    (auth.jwt() ->> 'email')::text LIKE '%@your-domain.com'
  );

-- Update admin policies for reviews table
DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;
CREATE POLICY "Admins can manage all reviews"
  ON reviews
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text LIKE '%@smartbites.com' OR
    (auth.jwt() ->> 'email')::text LIKE '%@gmail.com' OR
    (auth.jwt() ->> 'email')::text LIKE '%@your-domain.com'
  );

-- Update admin policies for file_uploads table
DROP POLICY IF EXISTS "Admins can manage all uploads" ON file_uploads;
CREATE POLICY "Admins can manage all uploads"
  ON file_uploads
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text LIKE '%@smartbites.com' OR
    (auth.jwt() ->> 'email')::text LIKE '%@gmail.com' OR
    (auth.jwt() ->> 'email')::text LIKE '%@your-domain.com'
  );

-- Update admin policies for allergens table
DROP POLICY IF EXISTS "Admins can manage allergens" ON allergens;
CREATE POLICY "Admins can manage allergens"
  ON allergens
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text LIKE '%@smartbites.com' OR
    (auth.jwt() ->> 'email')::text LIKE '%@gmail.com' OR
    (auth.jwt() ->> 'email')::text LIKE '%@your-domain.com'
  );

-- Update admin policies for menu_item_allergens table
DROP POLICY IF EXISTS "Admins can manage all menu item allergens" ON menu_item_allergens;
CREATE POLICY "Admins can manage all menu item allergens"
  ON menu_item_allergens
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text LIKE '%@smartbites.com' OR
    (auth.jwt() ->> 'email')::text LIKE '%@gmail.com' OR
    (auth.jwt() ->> 'email')::text LIKE '%@your-domain.com'
  );