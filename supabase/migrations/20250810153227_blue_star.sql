/*
  # Fix file_uploads RLS policy for INSERT operations

  1. Policy Updates
    - Drop existing restrictive INSERT policy if it exists
    - Create new INSERT policy that allows restaurant owners to upload files
    - Ensure the policy checks that the user owns the restaurant they're uploading for

  2. Security
    - Maintains security by only allowing restaurant owners to upload files for their own restaurants
    - Uses the restaurants table to verify ownership through user_id
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Restaurant owners can insert file uploads" ON file_uploads;

-- Create new INSERT policy that allows restaurant owners to upload files
CREATE POLICY "Restaurant owners can insert file uploads"
  ON file_uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = file_uploads.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Also ensure we have a SELECT policy for restaurant owners
DROP POLICY IF EXISTS "Restaurant owners can view their uploads" ON file_uploads;

CREATE POLICY "Restaurant owners can view their uploads"
  ON file_uploads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = file_uploads.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );