/*
  # Insert Sample Data for Restaurants, Menu Items, and Allergen Associations

  1. Restaurant Data
    - Insert Bella's Italian Bistro with complete profile
    - Uses your user UUID and all new fields

  2. Menu Item Data
    - Insert Honey Glazed Cauliflower
    - Links to the restaurant we just created
    - Includes image and dietary tags

  3. Allergen Associations
    - Links the menu item to Milk, Wheat, and Eggs allergens
    - Uses the actual allergen UUIDs from your database
*/

-- Insert restaurant data
INSERT INTO restaurants (
  user_id,
  name,
  contact_name,
  email,
  phone,
  address,
  city,
  state,
  zip_code,
  cuisine_type,
  status,
  created_at,
  updated_at,
  description,
  price_range,
  hours,
  website,
  image,
  gallery,
  specialties,
  safety_protocols
) VALUES (
  '76395f22-34fa-4359-9b7d-537bb4a4b359',
  'Bella''s Italian Bistro',
  'Joe Davault',
  'joe.davault@gmail.com',
  '(555) 123-4567',
  '123 Main St',
  'Phoenix',
  'AZ',
  '85024',
  'Italian',
  'approved',
  '2024-07-15 17:23:45+00',
  '2024-07-15 17:23:45+00',
  'Authentic Italian cuisine with a focus on allergen-friendly dining. Our chefs are trained in cross-contamination prevention and we maintain separate preparation areas for allergen-free dishes.',
  '$$',
  '{
    "Monday": "11:00 AM - 10:00 PM",
    "Tuesday": "11:00 AM - 10:00 PM",
    "Wednesday": "11:00 AM - 10:00 PM",
    "Thursday": "11:00 AM - 10:00 PM",
    "Friday": "11:00 AM - 11:00 PM",
    "Saturday": "10:00 AM - 11:00 PM",
    "Sunday": "10:00 AM - 9:00 PM"
  }'::jsonb,
  'https://bellasitalianbistro.com',
  'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY[
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  ARRAY['Gluten-Free', 'Dairy-Free', 'Vegan Options', 'Nut-Free Kitchen'],
  ARRAY[
    'Separate preparation areas for allergen-free dishes',
    'Dedicated gluten-free fryer',
    'Staff trained in allergen awareness',
    'Color-coded utensils for different allergens',
    'Detailed ingredient tracking system'
  ]
);

-- Get the restaurant ID for the menu item
DO $$
DECLARE
  restaurant_uuid uuid;
  menu_item_uuid uuid;
BEGIN
  -- Get the restaurant ID
  SELECT id INTO restaurant_uuid 
  FROM restaurants 
  WHERE email = 'joe.davault@gmail.com';

  -- Insert menu item
  INSERT INTO menu_items (
    restaurant_id,
    name,
    description,
    category,
    price,
    is_verified,
    verification_status,
    verification_notes,
    created_at,
    updated_at,
    image,
    dietary_tags
  ) VALUES (
    restaurant_uuid,
    'Honey Glazed Cauliflower',
    'This sweet and savory glazed cauliflower recipe is a delightful and flavorful side dish that is perfect for any occasion.',
    'Vegetables',
    12.99,
    true,
    'approved',
    'looks good',
    '2024-07-15 17:23:45+00',
    '2024-07-15 17:23:45+00',
    'https://nyc.cloud.appwrite.io/v1/storage/buckets/68368e5d00312b9245cb/files/686b623200123c173249/view?project=68351744000a63ee4a53&mode=admin&auto=compress&cs=tinysrgb&w=300',
    ARRAY['Gluten-Free', 'Vegetarian']
  ) RETURNING id INTO menu_item_uuid;

  -- Insert allergen associations
  -- Milk allergen
  INSERT INTO menu_item_allergens (menu_item_id, allergen_id)
  VALUES (menu_item_uuid, '129c4980-6f88-473f-b026-6f1b41c171ab');

  -- Wheat allergen  
  INSERT INTO menu_item_allergens (menu_item_id, allergen_id)
  VALUES (menu_item_uuid, '0392dd4c-983f-4caf-a3e5-bd06fd6d8410');

  -- Eggs allergen
  INSERT INTO menu_item_allergens (menu_item_id, allergen_id)
  VALUES (menu_item_uuid, '59fb8077-8983-4030-b827-f1544f8d01d9');

END $$;