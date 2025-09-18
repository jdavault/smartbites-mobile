/*
  # Remove RLS from file_uploads table

  1. Changes
    - Disable RLS on file_uploads table
    - Drop all existing policies
    - Allow unrestricted access since buckets are public

  2. Security
    - Public bucket access for file uploads
    - No RLS restrictions needed
*/

-- Disable RLS on file_uploads table
ALTER TABLE file_uploads DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can manage all uploads" ON file_uploads;
DROP POLICY IF EXISTS "Restaurant owners can upload files" ON file_uploads;
DROP POLICY IF EXISTS "Restaurant owners can view their uploads" ON file_uploads;
DROP POLICY IF EXISTS "Restaurants can manage own uploads" ON file_uploads;
DROP POLICY IF EXISTS "Users can insert file uploads for their restaurants" ON file_uploads;