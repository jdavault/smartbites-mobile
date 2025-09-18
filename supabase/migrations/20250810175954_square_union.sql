/*
  # Simplify file_uploads RLS policy

  1. Security Changes
    - Drop existing complex INSERT policy
    - Create simple policy allowing restaurant owners to upload files
    - Use direct restaurant ownership check via restaurants.user_id

  This fixes the 403 Unauthorized error during document uploads by ensuring
  authenticated users can insert file records for restaurants they own.
*/

-- Drop the existing problematic INSERT policy
DROP POLICY IF EXISTS "Restaurant users can upload files" ON file_uploads;

-- Create a simple, direct policy for restaurant owners
CREATE POLICY "Restaurant owners can upload files"
  ON file_uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    restaurant_id IN (
      SELECT id FROM restaurants 
      WHERE user_id = auth.uid()
    )
  );