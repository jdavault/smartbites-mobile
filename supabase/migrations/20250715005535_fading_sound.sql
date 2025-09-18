/*
  # Add new fields to restaurants table

  1. New Columns Added
    - `description` (text) - Restaurant description and allergen-friendly info
    - `price_range` (text) - Price range indicator (e.g., '$', '$$', '$$$')
    - `hours` (jsonb) - Operating hours for each day of the week
    - `website` (text) - Restaurant website URL
    - `image` (text) - Main restaurant image URL
    - `gallery` (text[]) - Array of gallery image URLs
    - `specialties` (text[]) - Array of specialty offerings
    - `safety_protocols` (text[]) - Array of safety protocols

  2. Notes
    - Using JSONB for hours to store structured day/time data
    - Using text arrays for gallery, specialties, and safety_protocols
    - All new fields are nullable to maintain compatibility
*/

-- Add description field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'description'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN description text;
  END IF;
END $$;

-- Add price_range field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'price_range'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN price_range text;
  END IF;
END $$;

-- Add hours field (JSONB for structured data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'hours'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN hours jsonb;
  END IF;
END $$;

-- Add website field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'website'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN website text;
  END IF;
END $$;

-- Add image field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'image'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN image text;
  END IF;
END $$;

-- Add gallery field (array of text)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'gallery'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN gallery text[];
  END IF;
END $$;

-- Add specialties field (array of text)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN specialties text[];
  END IF;
END $$;

-- Add safety_protocols field (array of text)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'safety_protocols'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN safety_protocols text[];
  END IF;
END $$;