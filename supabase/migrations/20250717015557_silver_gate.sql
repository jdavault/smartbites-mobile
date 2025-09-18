UPDATE restaurants 
SET 
  status = 'approved',
  description = 'Authentic Asian cuisine with allergen-friendly dining.',
  price_range = '$$',
  hours = '{
    "Monday": "11:00 AM - 10:00 PM",
    "Tuesday": "11:00 AM - 10:00 PM", 
    "Wednesday": "11:00 AM - 10:00 PM",
    "Thursday": "11:00 AM - 10:00 PM",
    "Friday": "11:00 AM - 11:00 PM",
    "Saturday": "10:00 AM - 11:00 PM",
    "Sunday": "10:00 AM - 9:00 PM"
  }'::jsonb,
  website = 'https://spice-route-eating.com',
  image = 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
  gallery = ARRAY[
    'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
    'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg',
    'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg'
  ],
  specialties = ARRAY['Gluten-Free', 'Dairy-Free', 'Vegan Options', 'Nut-Free Kitchen'],
  safety_protocols = ARRAY[
    'Separate prep areas for allergen-free dishes',
    'Dedicated gluten-free fryer',
    'Staff trained in allergen awareness'
  ],
  updated_at = now()
WHERE email = 'spiceroute@gmail.com'; -- safer unique key than UUID
