DO $$
DECLARE
  restaurant_uuid uuid;
  menu_item_uuid uuid;
BEGIN
  -- Look up restaurant by email
  SELECT id INTO restaurant_uuid
  FROM restaurants
  WHERE email = 'joe.davault@gmail.com';

  -- Look up menu item
  SELECT id INTO menu_item_uuid
  FROM menu_items
  WHERE name = 'Honey Glazed Cauliflower' AND restaurant_id = restaurant_uuid;

  -- Insert sample reviews
  INSERT INTO reviews (
    restaurant_id, menu_item_id, customer_name, customer_email, rating,
    comment, response, created_at, responded_at
  )
  VALUES 
  (
    restaurant_uuid, menu_item_uuid,
    'Sarah M.', 'sarahm@gmail.com', 5,
    'Amazing gluten-free pizza! My celiac daughter was so happy.',
    'Thank you for the nice comments',
    now(), now()
  ),
  (
    restaurant_uuid, menu_item_uuid,
    'Gregg Summey', 'gsummey@gmail.com', 5,
    'Amazing gluten-free pizza! Awesome safe option.',
    'Thank you for the nice comments',
    now(), now()
  )
  ON CONFLICT DO NOTHING;
END $$;
