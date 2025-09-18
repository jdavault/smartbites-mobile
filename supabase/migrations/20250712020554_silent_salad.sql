/*
  # SmartBites Database Schema

  1. New Tables
    - `restaurants`
      - `id` (uuid, primary key)
      - `name` (text)
      - `contact_name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `address` (text)
      - `city` (text)
      - `state` (text)
      - `zip_code` (text)
      - `cuisine_type` (text)
      - `status` (enum: pending, approved, rejected)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

    - `menu_items`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key)
      - `name` (text)
      - `description` (text)
      - `category` (text)
      - `price` (decimal)
      - `is_verified` (boolean)
      - `verification_status` (enum: pending, approved, rejected)
      - `verification_notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `allergens`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)

    - `menu_item_allergens`
      - `menu_item_id` (uuid, foreign key)
      - `allergen_id` (uuid, foreign key)
      - Primary key: (menu_item_id, allergen_id)

    - `reviews`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key)
      - `menu_item_id` (uuid, foreign key, nullable)
      - `customer_name` (text)
      - `customer_email` (text)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `response` (text, nullable)
      - `responded_at` (timestamp, nullable)
      - `created_at` (timestamp)

    - `file_uploads`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key)
      - `file_name` (text)
      - `file_path` (text)
      - `file_type` (enum: pdf, csv)
      - `upload_status` (enum: pending, processed, failed)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for restaurants to access only their own data
    - Add policies for admins to access all data
    - Add policies for public read access to approved content
*/

-- Create custom types
CREATE TYPE restaurant_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE file_type AS ENUM ('pdf', 'csv');
CREATE TYPE upload_status AS ENUM ('pending', 'processed', 'failed');

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  cuisine_type text NOT NULL,
  status restaurant_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create allergens table
CREATE TABLE IF NOT EXISTS allergens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Insert standard allergens
INSERT INTO allergens (name, description) VALUES
  ('Milk', 'Contains dairy products including milk, cheese, butter, yogurt'),
  ('Eggs', 'Contains eggs or egg products'),
  ('Fish', 'Contains fish or fish products'),
  ('Shellfish', 'Contains crustacean shellfish like shrimp, crab, lobster'),
  ('Tree Nuts', 'Contains tree nuts like almonds, walnuts, pecans'),
  ('Peanuts', 'Contains peanuts or peanut products'),
  ('Wheat', 'Contains wheat or wheat products including gluten'),
  ('Soybeans', 'Contains soy or soy products'),
  ('Sesame', 'Contains sesame seeds or sesame products')
ON CONFLICT (name) DO NOTHING;

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  price decimal(10,2),
  is_verified boolean DEFAULT false,
  verification_status verification_status DEFAULT 'pending',
  verification_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create menu_item_allergens junction table
CREATE TABLE IF NOT EXISTS menu_item_allergens (
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  allergen_id uuid REFERENCES allergens(id) ON DELETE CASCADE,
  PRIMARY KEY (menu_item_id, allergen_id)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment text,
  response text,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create file_uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type file_type NOT NULL,
  upload_status upload_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;

-- Policies for restaurants table
CREATE POLICY "Restaurants can read own data"
  ON restaurants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Restaurants can update own data"
  ON restaurants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create restaurant"
  ON restaurants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all restaurants"
  ON restaurants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@smartbites.com'
    )
  );

-- Policies for menu_items table
CREATE POLICY "Restaurants can manage own menu items"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can read verified menu items"
  ON menu_items
  FOR SELECT
  TO anon, authenticated
  USING (is_verified = true);

CREATE POLICY "Admins can manage all menu items"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@smartbites.com'
    )
  );

-- Policies for menu_item_allergens table
CREATE POLICY "Restaurants can manage own menu item allergens"
  ON menu_item_allergens
  FOR ALL
  TO authenticated
  USING (
    menu_item_id IN (
      SELECT mi.id FROM menu_items mi
      JOIN restaurants r ON mi.restaurant_id = r.id
      WHERE r.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can read allergens for verified items"
  ON menu_item_allergens
  FOR SELECT
  TO anon, authenticated
  USING (
    menu_item_id IN (
      SELECT id FROM menu_items WHERE is_verified = true
    )
  );

CREATE POLICY "Admins can manage all menu item allergens"
  ON menu_item_allergens
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@smartbites.com'
    )
  );

-- Policies for reviews table
CREATE POLICY "Restaurants can read own reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurants can update own review responses"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create reviews"
  ON reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can read reviews"
  ON reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage all reviews"
  ON reviews
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@smartbites.com'
    )
  );

-- Policies for file_uploads table
CREATE POLICY "Restaurants can manage own uploads"
  ON file_uploads
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all uploads"
  ON file_uploads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@smartbites.com'
    )
  );

-- Policies for allergens table (read-only for most users)
CREATE POLICY "Anyone can read allergens"
  ON allergens
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage allergens"
  ON allergens
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@smartbites.com'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON restaurants(status);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_verified ON menu_items(is_verified);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_restaurant_id ON file_uploads(restaurant_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();