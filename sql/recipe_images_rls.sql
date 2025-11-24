-- =====================================================
-- Production RLS Policies for recipe-images bucket
-- Extracted from production database
-- =====================================================

-- Enable RLS on storage tables
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets_analytics DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- Drop existing recipe-images policies (clean slate)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete recipe images" ON storage.objects;

-- =====================================================
-- Create policies for recipe-images bucket
-- =====================================================

-- SELECT: Anyone can view recipe images (public read)
CREATE POLICY "Anyone can view recipe images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'recipe-images'::text);

-- INSERT: Authenticated users can upload recipe images
CREATE POLICY "Authenticated users can upload recipe images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recipe-images'::text);

-- UPDATE: Authenticated users can update recipe images
CREATE POLICY "Authenticated users can update recipe images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'recipe-images'::text)
WITH CHECK (bucket_id = 'recipe-images'::text);

-- DELETE: Authenticated users can delete recipe images
CREATE POLICY "Authenticated users can delete recipe images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'recipe-images'::text);

-- =====================================================
-- Verify policies
-- =====================================================
SELECT 
  policyname,
  cmd,
  roles::text,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%recipe images%'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ recipe-images RLS policies applied successfully!';
  RAISE NOTICE '📦 Bucket: recipe-images';
  RAISE NOTICE '🔓 Public: SELECT (anyone can view)';
  RAISE NOTICE '🔒 Authenticated: INSERT, UPDATE, DELETE';
END $$;