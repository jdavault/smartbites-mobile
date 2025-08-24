/*
  # Create recipe_meta view for efficient recipe filtering

  1. View Structure
    - Aggregates recipe data with allergen and dietary preference IDs
    - Uses PostgreSQL arrays for efficient subset matching
    - Enables simple @> operator queries for filtering

  2. Benefits
    - Single query instead of complex joins and filtering
    - PostgreSQL handles the subset logic natively
    - Much cleaner and more performant code
*/

create or replace view recipe_meta as
select
  r.*,
  coalesce(array_agg(distinct ra.allergen_id) filter (where ra.allergen_id is not null), '{}') as allergen_ids,
  coalesce(array_agg(distinct rd.dietary_pref_id) filter (where rd.dietary_pref_id is not null), '{}') as dietary_ids
from recipes r
left join recipe_allergens ra on ra.recipe_id = r.id
left join recipe_dietary_prefs rd on rd.recipe_id = r.id
group by r.id;