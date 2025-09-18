/*
  # Update Allergen Names for Consistency

  1. Updates
    - Change any "Wheat" or "Gluten" allergens to "Wheat (Gluten)"
    - Ensure consistent naming across the platform

  2. Notes
    - Updates existing allergen records to use proper naming
    - Maintains referential integrity with existing menu_item_allergens
*/

-- Update any allergen names that contain "Wheat" or "Gluten" to use "Wheat (Gluten)"
UPDATE allergens 
SET name = 'Wheat (Gluten)'
WHERE name ILIKE '%wheat%' OR name ILIKE '%gluten%';

-- Also update the description to be more specific
UPDATE allergens 
SET description = 'Contains wheat proteins including gluten. Avoid if you have celiac disease or gluten sensitivity.'
WHERE name = 'Wheat (Gluten)';