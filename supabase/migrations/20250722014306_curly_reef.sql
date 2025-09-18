/*
  # Add Restaurant Access Control

  1. New Columns
    - `allowed_domains` (text[]) - Array of email domains allowed to join
    - `allowed_emails` (text[]) - Array of specific emails allowed to join
  
  2. New Table
    - `restaurant_users` - Junction table for users associated with restaurants
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `role` (text) - Role of user (owner, manager, staff)
      - `contact_name` (text)
      - `email` (text)
      - `phone` (text)
      - `created_at` (timestamp)

  3. Security
    - Enable RLS on `restaurant_users` table
    - Add policies for restaurant user management
*/

-- Add access control columns to restaurants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'allowed_domains'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN allowed_domains text[] DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'allowed_emails'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN allowed_emails text[] DEFAULT '{}';
  END IF;
END $$;

-- Create restaurant_users junction table
CREATE TABLE IF NOT EXISTS restaurant_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff',
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, user_id)
);

-- Enable RLS
ALTER TABLE restaurant_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurant_users
CREATE POLICY "Users can read own restaurant associations"
  ON restaurant_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Restaurant owners can read their restaurant users"
  ON restaurant_users
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all restaurant users"
  ON restaurant_users
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') LIKE '%@smartbites.com' OR
    (auth.jwt() ->> 'email') LIKE '%@gmail.com' OR
    (auth.jwt() ->> 'email') LIKE '%@your-domain.com'
  );

CREATE POLICY "Users can join restaurants"
  ON restaurant_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_users_restaurant_id ON restaurant_users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_user_id ON restaurant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_allowed_domains ON restaurants USING GIN(allowed_domains);
CREATE INDEX IF NOT EXISTS idx_restaurants_allowed_emails ON restaurants USING GIN(allowed_emails);