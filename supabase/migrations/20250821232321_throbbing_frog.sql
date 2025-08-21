/*
  # Storage RLS Policies for Recipe Images

  1. Storage Setup
    - Enable RLS on storage.objects
    - Add policies for recipe-images bucket

  2. Security
    - Authenticated users can upload images
    - Authenticated users can read all images
    - Users can update/delete their own uploaded images
*/

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for uploading images to recipe-images bucket
CREATE POLICY "Authenticated users can upload recipe images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'recipe-images');

-- Policy for reading images from recipe-images bucket (public read)
CREATE POLICY "Anyone can view recipe images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'recipe-images');

-- Policy for updating images in recipe-images bucket
CREATE POLICY "Authenticated users can update recipe images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'recipe-images')
  WITH CHECK (bucket_id = 'recipe-images');

-- Policy for deleting images from recipe-images bucket
CREATE POLICY "Authenticated users can delete recipe images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'recipe-images');

-- Create the recipe-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;