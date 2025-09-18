/*
  # Fix file_uploads INSERT policy

  1. Security Changes
    - Drop existing INSERT policy that may be causing issues
    - Create new INSERT policy that properly allows restaurant owners to upload files
    - Ensure the policy correctly validates restaurant ownership

  The issue is that the current INSERT policy may not be properly checking
  the restaurant ownership relationship during the signup process.
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Restaurant owners can insert file uploads" ON file_uploads;

-- Create a new INSERT policy that works correctly
CREATE POLICY "Allow file uploads for restaurant owners"
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