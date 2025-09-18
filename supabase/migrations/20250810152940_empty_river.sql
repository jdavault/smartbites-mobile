/*
  # Fix file_uploads INSERT policy

  1. Security Changes
    - Drop existing INSERT policy that may be too restrictive
    - Create new INSERT policy that allows restaurant owners to upload files
    - Ensure the policy checks that the user owns the restaurant they're uploading for

  2. Policy Details
    - Allow authenticated users to insert file upload records
    - Verify that the restaurant_id belongs to a restaurant owned by the authenticated user
    - Use proper RLS policy structure for INSERT operations
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Allow owners to insert file uploads" ON file_uploads;

-- Create new INSERT policy for file uploads
CREATE POLICY "Restaurant owners can insert file uploads"
  ON file_uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM restaurants 
      WHERE restaurants.id = file_uploads.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );