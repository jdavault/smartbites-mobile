/*
  # Insert sample restaurant data

  1. Restaurant Data
    - Uses your user UUID: 76395f22-34fa-4359-9b7d-537bb4a4b359
    - Includes all new fields with realistic data
    - Uses JSONB for hours structure
    - Uses arrays for gallery, specialties, and safety_protocols

  2. Data Structure
    - Complete restaurant profile for Bella's Italian Bistro
    - Allergen-friendly focus with detailed safety protocols
    - Realistic operating hours and contact information
*/

-- Insert restaurant data with your user UUID
INSERT INTO restaurants (
  id,
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
  description,
  price_range,
  hours,
  website,
  image,
  gallery,
  specialties,
  safety_protocols,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '76395f22-34fa-4359-9b7d-537bb4a4b359',
  'Bella''s Italian Bistro',
  'Joe Davault',
  'joe.davault@gmail.com',
  '(555) 123-4567',
  '123 Main St',
  'San Francisco',
  'CA',
  '75217',
  'Italian',
  'approved',
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
  ],
  '2024-07-15 17:23:45+00',
  '2024-07-15 17:23:45+00'
) ON CONFLICT (email) DO NOTHING;