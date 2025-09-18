/*
  # Fix file_uploads RLS policy for restaurant users

  1. Security Changes
    - Drop existing INSERT policy that's causing issues
    - Create new INSERT policy that checks restaurant_users association
    - Allow users to insert file uploads for restaurants they're associated with

  This fixes the 403 Unauthorized error when uploading documents during restaurant signup.
*/

-- Drop the existing problematic INSERT policy
DROP POLICY IF EXISTS "Allow file uploads for restaurant owners" ON file_uploads;

-- Create a new INSERT policy that checks restaurant_users association
CREATE POLICY "Restaurant users can upload files"
  ON file_uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM restaurant_users 
      WHERE restaurant_id = file_uploads.restaurant_id
    )
  );