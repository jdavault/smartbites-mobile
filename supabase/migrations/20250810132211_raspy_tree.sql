/*
  # Add status_notes column to restaurants table

  1. Changes
    - Add `status_notes` column to `restaurants` table
    - Column allows null values for existing records
    - Text type for storing admin notes about restaurant status

  2. Purpose
    - Allow admins to add notes when approving/rejecting restaurants
    - Track reasoning for status decisions
    - Improve restaurant management workflow
*/

-- Add status_notes column to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS status_notes text;