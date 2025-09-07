drop extension if exists "pg_net";

create extension if not exists "moddatetime" with schema "public";

create type "public"."file_type" as enum ('pdf', 'csv');

create type "public"."restaurant_status" as enum ('pending', 'approved', 'rejected');

create type "public"."upload_status" as enum ('pending', 'processed', 'failed');

create type "public"."verification_status" as enum ('pending', 'approved', 'rejected');

drop policy "Users can insert recipe allergens" on "public"."recipe_allergens";

drop policy "Users can read recipe allergens" on "public"."recipe_allergens";

drop policy "Users can insert recipe dietary prefs" on "public"."recipe_dietary_prefs";

drop policy "Users can read recipe dietary prefs" on "public"."recipe_dietary_prefs";

drop policy "Anyone can insert recipes" on "public"."recipes";

drop policy "Anyone can read recipes" on "public"."recipes";

drop policy "Anyone can update recipes" on "public"."recipes";

drop policy "Users can delete own recipes" on "public"."user_recipes";

drop policy "Users can insert own recipes" on "public"."user_recipes";

drop policy "Users can read own recipes" on "public"."user_recipes";

drop policy "Users can update own recipes" on "public"."user_recipes";

drop policy "Anyone can read allergens" on "public"."allergens";

drop policy "Anyone can read dietary preferences" on "public"."dietary_prefs";

drop policy "Users can update own allergens" on "public"."user_allergens";

drop policy "Users can update own dietary prefs" on "public"."user_dietary_prefs";

drop policy "Users can update own profile" on "public"."user_profiles";

alter table "public"."recipe_allergens" drop constraint "recipe_allergens_recipe_id_allergen_id_key";

alter table "public"."recipe_dietary_prefs" drop constraint "recipe_dietary_prefs_recipe_id_dietary_pref_id_key";

alter table "public"."recipes" drop constraint "recipes_cooking_method_check";

alter table "public"."recipes" drop constraint "recipes_difficulty_check";

alter table "public"."user_recipes" drop constraint "user_recipes_recipe_id_fkey";

alter table "public"."user_recipes" drop constraint "user_recipes_user_id_fkey";

alter table "public"."user_recipes" drop constraint "user_recipes_user_id_recipe_id_key";

alter table "public"."recipe_allergens" drop constraint "recipe_allergens_allergen_id_fkey";

alter table "public"."recipe_dietary_prefs" drop constraint "recipe_dietary_prefs_dietary_pref_id_fkey";

alter table "public"."recipes" drop constraint "recipes_pkey";

alter table "public"."user_recipes" drop constraint "user_recipes_pkey";

alter table "public"."recipe_allergens" drop constraint "recipe_allergens_pkey";

alter table "public"."recipe_dietary_prefs" drop constraint "recipe_dietary_prefs_pkey";

drop index if exists "public"."recipe_allergens_recipe_id_allergen_id_key";

drop index if exists "public"."recipe_dietary_prefs_recipe_id_dietary_pref_id_key";

drop index if exists "public"."recipes_pkey";

drop index if exists "public"."user_recipes_pkey";

drop index if exists "public"."user_recipes_user_id_recipe_id_key";

drop index if exists "public"."idx_recipes_created_at";

drop index if exists "public"."recipe_allergens_pkey";

drop index if exists "public"."recipe_dietary_prefs_pkey";


  create table "public"."cooking_methods" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."cooking_methods" enable row level security;


  create table "public"."cuisine_types" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."cuisine_types" enable row level security;


  create table "public"."menu_categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."menu_categories" enable row level security;


  create table "public"."menu_item_allergens" (
    "menu_item_id" uuid not null,
    "allergen_id" uuid not null
      );


alter table "public"."menu_item_allergens" enable row level security;


  create table "public"."menu_items" (
    "id" uuid not null default gen_random_uuid(),
    "restaurant_id" uuid not null,
    "name" text not null,
    "description" text,
    "category" text,
    "price" numeric(10,2),
    "is_verified" boolean default false,
    "verification_status" verification_status default 'pending'::verification_status,
    "verification_notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "image" text,
    "dietary_tags" text[],
    "menu_category_id" uuid
      );


alter table "public"."menu_items" enable row level security;


  create table "public"."restaurant_onboarding_notes" (
    "id" uuid not null default gen_random_uuid(),
    "restaurant_id" uuid not null,
    "user_id" uuid not null,
    "raw_text" text,
    "raw_json" jsonb,
    "format" text not null,
    "status" text not null default 'new'::text,
    "error_message" text,
    "parsed_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."restaurant_onboarding_notes" enable row level security;


  create table "public"."restaurant_users" (
    "id" uuid not null default gen_random_uuid(),
    "restaurant_id" uuid not null,
    "user_id" uuid not null,
    "role" text not null default 'staff'::text,
    "contact_name" text not null,
    "email" text not null,
    "phone" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."restaurant_users" enable row level security;


  create table "public"."restaurants" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "name" text not null,
    "contact_name" text not null,
    "email" text not null,
    "phone" text not null,
    "address" text not null,
    "city" text not null,
    "state" text not null,
    "zip_code" text not null,
    "cuisine_type" text not null,
    "status" restaurant_status default 'pending'::restaurant_status,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "description" text,
    "price_range" text,
    "hours" jsonb,
    "website" text,
    "image" text,
    "gallery" text[],
    "specialties" text[],
    "safety_protocols" text[],
    "allowed_domains" text[] default '{}'::text[],
    "allowed_emails" text[] default '{}'::text[],
    "status_notes" text
      );


alter table "public"."restaurants" enable row level security;


  create table "public"."reviews" (
    "id" uuid not null default gen_random_uuid(),
    "restaurant_id" uuid not null,
    "menu_item_id" uuid,
    "customer_name" text not null,
    "customer_email" text,
    "rating" integer not null,
    "comment" text,
    "response" text,
    "responded_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."reviews" enable row level security;

alter table "public"."recipe_allergens" drop column "created_at";

alter table "public"."recipe_allergens" drop column "id";

alter table "public"."recipe_dietary_prefs" drop column "created_at";

alter table "public"."recipe_dietary_prefs" drop column "id";

alter table "public"."recipes" alter column "allergens_included" drop default;

alter table "public"."recipes" alter column "cook_time" drop default;

alter table "public"."recipes" alter column "cooking_method" drop default;

alter table "public"."recipes" alter column "description" drop default;

alter table "public"."recipes" alter column "head_note" drop default;

alter table "public"."recipes" alter column "ingredients" set default '[]'::jsonb;

alter table "public"."recipes" alter column "ingredients" set data type jsonb using "ingredients"::jsonb;

alter table "public"."recipes" alter column "instructions" set default '[]'::jsonb;

alter table "public"."recipes" alter column "instructions" set data type jsonb using "instructions"::jsonb;

alter table "public"."recipes" alter column "notes" drop default;

alter table "public"."recipes" alter column "nutrition_info" drop default;

alter table "public"."recipes" alter column "prep_time" drop default;

alter table "public"."recipes" alter column "search_key" drop default;

alter table "public"."recipes" alter column "search_query" drop default;

alter table "public"."recipes" alter column "tags" set default '[]'::jsonb;

alter table "public"."recipes" alter column "tags" set data type jsonb using "tags"::jsonb;

alter table "public"."user_allergens" add column "allergen_id" uuid;

alter table "public"."user_dietary_prefs" add column "dietary_pref_id" uuid;

alter table "public"."user_profiles" alter column "address1" drop default;

alter table "public"."user_profiles" alter column "address2" drop default;

alter table "public"."user_profiles" alter column "city" drop default;

alter table "public"."user_profiles" alter column "first_name" drop default;

alter table "public"."user_profiles" alter column "last_name" drop default;

alter table "public"."user_profiles" alter column "phone" drop default;

alter table "public"."user_profiles" alter column "state" drop default;

alter table "public"."user_profiles" alter column "zip" drop default;

alter table "public"."user_recipes" drop column "created_at";

alter table "public"."user_recipes" drop column "id";

alter table "public"."user_recipes" drop column "updated_at";

CREATE UNIQUE INDEX cooking_methods_name_key ON public.cooking_methods USING btree (name);

CREATE UNIQUE INDEX cooking_methods_pkey ON public.cooking_methods USING btree (id);

CREATE UNIQUE INDEX cuisine_types_name_key ON public.cuisine_types USING btree (name);

CREATE UNIQUE INDEX cuisine_types_pkey ON public.cuisine_types USING btree (id);

CREATE INDEX idx_menu_categories_name ON public.menu_categories USING btree (name);

CREATE INDEX idx_menu_items_category_id ON public.menu_items USING btree (menu_category_id);

CREATE INDEX idx_menu_items_restaurant_id ON public.menu_items USING btree (restaurant_id);

CREATE INDEX idx_menu_items_verified ON public.menu_items USING btree (is_verified);

CREATE INDEX idx_onboarding_notes_restaurant_id ON public.restaurant_onboarding_notes USING btree (restaurant_id);

CREATE INDEX idx_onboarding_notes_user_id ON public.restaurant_onboarding_notes USING btree (user_id);

CREATE INDEX idx_recipe_allergens_allergen_id ON public.recipe_allergens USING btree (allergen_id);

CREATE INDEX idx_recipe_allergens_recipe_id ON public.recipe_allergens USING btree (recipe_id);

CREATE INDEX idx_recipe_dietary_prefs_dietary_pref_id ON public.recipe_dietary_prefs USING btree (dietary_pref_id);

CREATE INDEX idx_recipe_dietary_prefs_recipe_id ON public.recipe_dietary_prefs USING btree (recipe_id);

CREATE INDEX idx_restaurant_users_restaurant_id ON public.restaurant_users USING btree (restaurant_id);

CREATE INDEX idx_restaurant_users_user_id ON public.restaurant_users USING btree (user_id);

CREATE INDEX idx_restaurants_allowed_domains ON public.restaurants USING gin (allowed_domains);

CREATE INDEX idx_restaurants_allowed_emails ON public.restaurants USING gin (allowed_emails);

CREATE INDEX idx_restaurants_status ON public.restaurants USING btree (status);

CREATE INDEX idx_restaurants_user_id ON public.restaurants USING btree (user_id);

CREATE INDEX idx_reviews_restaurant_id ON public.reviews USING btree (restaurant_id);

CREATE INDEX idx_user_allergens_allergen ON public.user_allergens USING btree (allergen);

CREATE INDEX idx_user_allergens_allergen_id ON public.user_allergens USING btree (allergen_id);

CREATE UNIQUE INDEX idx_user_allergens_unique ON public.user_allergens USING btree (user_id, allergen_id) WHERE (allergen_id IS NOT NULL);

CREATE INDEX idx_user_dietary_prefs_dietary_pref_id ON public.user_dietary_prefs USING btree (dietary_pref_id);

CREATE INDEX idx_user_dietary_prefs_pref ON public.user_dietary_prefs USING btree (dietary_pref);

CREATE UNIQUE INDEX idx_user_dietary_prefs_unique ON public.user_dietary_prefs USING btree (user_id, dietary_pref_id) WHERE (dietary_pref_id IS NOT NULL);

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);

CREATE UNIQUE INDEX menu_categories_name_key ON public.menu_categories USING btree (name);

CREATE UNIQUE INDEX menu_categories_pkey ON public.menu_categories USING btree (id);

CREATE UNIQUE INDEX menu_item_allergens_pkey ON public.menu_item_allergens USING btree (menu_item_id, allergen_id);

CREATE UNIQUE INDEX menu_items_pkey ON public.menu_items USING btree (id);

CREATE UNIQUE INDEX recipes_new_pkey ON public.recipes USING btree (id);

CREATE UNIQUE INDEX recipes_search_key_unique ON public.recipes USING btree (search_key);

CREATE UNIQUE INDEX restaurant_onboarding_notes_pkey ON public.restaurant_onboarding_notes USING btree (id);

CREATE UNIQUE INDEX restaurant_users_pkey ON public.restaurant_users USING btree (id);

CREATE UNIQUE INDEX restaurant_users_restaurant_id_user_id_key ON public.restaurant_users USING btree (restaurant_id, user_id);

CREATE UNIQUE INDEX restaurants_email_key ON public.restaurants USING btree (email);

CREATE UNIQUE INDEX restaurants_pkey ON public.restaurants USING btree (id);

CREATE UNIQUE INDEX reviews_pkey ON public.reviews USING btree (id);

CREATE UNIQUE INDEX user_recipes_new_pkey ON public.user_recipes USING btree (user_id, recipe_id);

CREATE INDEX idx_recipes_created_at ON public.recipes USING btree (created_at DESC);

CREATE UNIQUE INDEX recipe_allergens_pkey ON public.recipe_allergens USING btree (recipe_id, allergen_id);

CREATE UNIQUE INDEX recipe_dietary_prefs_pkey ON public.recipe_dietary_prefs USING btree (recipe_id, dietary_pref_id);

alter table "public"."cooking_methods" add constraint "cooking_methods_pkey" PRIMARY KEY using index "cooking_methods_pkey";

alter table "public"."cuisine_types" add constraint "cuisine_types_pkey" PRIMARY KEY using index "cuisine_types_pkey";

alter table "public"."menu_categories" add constraint "menu_categories_pkey" PRIMARY KEY using index "menu_categories_pkey";

alter table "public"."menu_item_allergens" add constraint "menu_item_allergens_pkey" PRIMARY KEY using index "menu_item_allergens_pkey";

alter table "public"."menu_items" add constraint "menu_items_pkey" PRIMARY KEY using index "menu_items_pkey";

alter table "public"."recipes" add constraint "recipes_new_pkey" PRIMARY KEY using index "recipes_new_pkey";

alter table "public"."restaurant_onboarding_notes" add constraint "restaurant_onboarding_notes_pkey" PRIMARY KEY using index "restaurant_onboarding_notes_pkey";

alter table "public"."restaurant_users" add constraint "restaurant_users_pkey" PRIMARY KEY using index "restaurant_users_pkey";

alter table "public"."restaurants" add constraint "restaurants_pkey" PRIMARY KEY using index "restaurants_pkey";

alter table "public"."reviews" add constraint "reviews_pkey" PRIMARY KEY using index "reviews_pkey";

alter table "public"."user_recipes" add constraint "user_recipes_new_pkey" PRIMARY KEY using index "user_recipes_new_pkey";

alter table "public"."recipe_allergens" add constraint "recipe_allergens_pkey" PRIMARY KEY using index "recipe_allergens_pkey";

alter table "public"."recipe_dietary_prefs" add constraint "recipe_dietary_prefs_pkey" PRIMARY KEY using index "recipe_dietary_prefs_pkey";

alter table "public"."cooking_methods" add constraint "cooking_methods_name_key" UNIQUE using index "cooking_methods_name_key";

alter table "public"."cuisine_types" add constraint "cuisine_types_name_key" UNIQUE using index "cuisine_types_name_key";

alter table "public"."menu_categories" add constraint "menu_categories_name_key" UNIQUE using index "menu_categories_name_key";

alter table "public"."menu_item_allergens" add constraint "menu_item_allergens_allergen_id_fkey" FOREIGN KEY (allergen_id) REFERENCES allergens(id) ON DELETE CASCADE not valid;

alter table "public"."menu_item_allergens" validate constraint "menu_item_allergens_allergen_id_fkey";

alter table "public"."menu_item_allergens" add constraint "menu_item_allergens_menu_item_id_fkey" FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE not valid;

alter table "public"."menu_item_allergens" validate constraint "menu_item_allergens_menu_item_id_fkey";

alter table "public"."menu_items" add constraint "menu_items_menu_category_id_fkey" FOREIGN KEY (menu_category_id) REFERENCES menu_categories(id) ON DELETE SET NULL not valid;

alter table "public"."menu_items" validate constraint "menu_items_menu_category_id_fkey";

alter table "public"."menu_items" add constraint "menu_items_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE not valid;

alter table "public"."menu_items" validate constraint "menu_items_restaurant_id_fkey";

alter table "public"."recipes" add constraint "recipes_new_difficulty_check" CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text]))) not valid;

alter table "public"."recipes" validate constraint "recipes_new_difficulty_check";

alter table "public"."recipes" add constraint "recipes_search_key_unique" UNIQUE using index "recipes_search_key_unique";

alter table "public"."restaurant_onboarding_notes" add constraint "ck_notes_has_content" CHECK ((((raw_text IS NOT NULL) AND (btrim(raw_text) <> ''::text)) OR (raw_json IS NOT NULL))) not valid;

alter table "public"."restaurant_onboarding_notes" validate constraint "ck_notes_has_content";

alter table "public"."restaurant_onboarding_notes" add constraint "restaurant_onboarding_notes_format_check" CHECK ((format = ANY (ARRAY['text'::text, 'json'::text]))) not valid;

alter table "public"."restaurant_onboarding_notes" validate constraint "restaurant_onboarding_notes_format_check";

alter table "public"."restaurant_onboarding_notes" add constraint "restaurant_onboarding_notes_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE not valid;

alter table "public"."restaurant_onboarding_notes" validate constraint "restaurant_onboarding_notes_restaurant_id_fkey";

alter table "public"."restaurant_onboarding_notes" add constraint "restaurant_onboarding_notes_status_check" CHECK ((status = ANY (ARRAY['new'::text, 'parsed'::text, 'error'::text]))) not valid;

alter table "public"."restaurant_onboarding_notes" validate constraint "restaurant_onboarding_notes_status_check";

alter table "public"."restaurant_onboarding_notes" add constraint "restaurant_onboarding_notes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."restaurant_onboarding_notes" validate constraint "restaurant_onboarding_notes_user_id_fkey";

alter table "public"."restaurant_users" add constraint "restaurant_users_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE not valid;

alter table "public"."restaurant_users" validate constraint "restaurant_users_restaurant_id_fkey";

alter table "public"."restaurant_users" add constraint "restaurant_users_restaurant_id_user_id_key" UNIQUE using index "restaurant_users_restaurant_id_user_id_key";

alter table "public"."restaurant_users" add constraint "restaurant_users_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."restaurant_users" validate constraint "restaurant_users_user_id_fkey";

alter table "public"."restaurants" add constraint "restaurants_email_key" UNIQUE using index "restaurants_email_key";

alter table "public"."restaurants" add constraint "restaurants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."restaurants" validate constraint "restaurants_user_id_fkey";

alter table "public"."reviews" add constraint "reviews_menu_item_id_fkey" FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL not valid;

alter table "public"."reviews" validate constraint "reviews_menu_item_id_fkey";

alter table "public"."reviews" add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_rating_check";

alter table "public"."reviews" add constraint "reviews_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_restaurant_id_fkey";

alter table "public"."user_allergens" add constraint "user_allergens_allergen_id_fkey" FOREIGN KEY (allergen_id) REFERENCES allergens(id) ON DELETE CASCADE not valid;

alter table "public"."user_allergens" validate constraint "user_allergens_allergen_id_fkey";

alter table "public"."user_dietary_prefs" add constraint "user_dietary_prefs_dietary_pref_id_fkey" FOREIGN KEY (dietary_pref_id) REFERENCES dietary_prefs(id) ON DELETE CASCADE not valid;

alter table "public"."user_dietary_prefs" validate constraint "user_dietary_prefs_dietary_pref_id_fkey";

alter table "public"."user_recipes" add constraint "user_recipes_new_recipe_id_fkey" FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE not valid;

alter table "public"."user_recipes" validate constraint "user_recipes_new_recipe_id_fkey";

alter table "public"."user_recipes" add constraint "user_recipes_new_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_recipes" validate constraint "user_recipes_new_user_id_fkey";

alter table "public"."recipe_allergens" add constraint "recipe_allergens_allergen_id_fkey" FOREIGN KEY (allergen_id) REFERENCES allergens(id) ON DELETE RESTRICT not valid;

alter table "public"."recipe_allergens" validate constraint "recipe_allergens_allergen_id_fkey";

alter table "public"."recipe_dietary_prefs" add constraint "recipe_dietary_prefs_dietary_pref_id_fkey" FOREIGN KEY (dietary_pref_id) REFERENCES dietary_prefs(id) ON DELETE RESTRICT not valid;

alter table "public"."recipe_dietary_prefs" validate constraint "recipe_dietary_prefs_dietary_pref_id_fkey";

set check_function_bodies = off;

create or replace view "public"."recipe_meta" as  SELECT r.id,
    r.title,
    r.head_note,
    r.description,
    r.ingredients,
    r.instructions,
    r.prep_time,
    r.cook_time,
    r.servings,
    r.difficulty,
    r.tags,
    r.search_query,
    r.search_key,
    r.notes,
    r.nutrition_info,
    r.image,
    r.created_at,
    r.updated_at,
    r.allergens_included,
    COALESCE(array_agg(DISTINCT ra.allergen_id) FILTER (WHERE (ra.allergen_id IS NOT NULL)), '{}'::uuid[]) AS allergen_ids,
    COALESCE(array_agg(DISTINCT rd.dietary_pref_id) FILTER (WHERE (rd.dietary_pref_id IS NOT NULL)), '{}'::uuid[]) AS dietary_ids
   FROM ((recipes r
     LEFT JOIN recipe_allergens ra ON ((ra.recipe_id = r.id)))
     LEFT JOIN recipe_dietary_prefs rd ON ((rd.recipe_id = r.id)))
  GROUP BY r.id;


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."cooking_methods" to "anon";

grant insert on table "public"."cooking_methods" to "anon";

grant references on table "public"."cooking_methods" to "anon";

grant select on table "public"."cooking_methods" to "anon";

grant trigger on table "public"."cooking_methods" to "anon";

grant truncate on table "public"."cooking_methods" to "anon";

grant update on table "public"."cooking_methods" to "anon";

grant delete on table "public"."cooking_methods" to "authenticated";

grant insert on table "public"."cooking_methods" to "authenticated";

grant references on table "public"."cooking_methods" to "authenticated";

grant select on table "public"."cooking_methods" to "authenticated";

grant trigger on table "public"."cooking_methods" to "authenticated";

grant truncate on table "public"."cooking_methods" to "authenticated";

grant update on table "public"."cooking_methods" to "authenticated";

grant delete on table "public"."cooking_methods" to "service_role";

grant insert on table "public"."cooking_methods" to "service_role";

grant references on table "public"."cooking_methods" to "service_role";

grant select on table "public"."cooking_methods" to "service_role";

grant trigger on table "public"."cooking_methods" to "service_role";

grant truncate on table "public"."cooking_methods" to "service_role";

grant update on table "public"."cooking_methods" to "service_role";

grant delete on table "public"."cuisine_types" to "anon";

grant insert on table "public"."cuisine_types" to "anon";

grant references on table "public"."cuisine_types" to "anon";

grant select on table "public"."cuisine_types" to "anon";

grant trigger on table "public"."cuisine_types" to "anon";

grant truncate on table "public"."cuisine_types" to "anon";

grant update on table "public"."cuisine_types" to "anon";

grant delete on table "public"."cuisine_types" to "authenticated";

grant insert on table "public"."cuisine_types" to "authenticated";

grant references on table "public"."cuisine_types" to "authenticated";

grant select on table "public"."cuisine_types" to "authenticated";

grant trigger on table "public"."cuisine_types" to "authenticated";

grant truncate on table "public"."cuisine_types" to "authenticated";

grant update on table "public"."cuisine_types" to "authenticated";

grant delete on table "public"."cuisine_types" to "service_role";

grant insert on table "public"."cuisine_types" to "service_role";

grant references on table "public"."cuisine_types" to "service_role";

grant select on table "public"."cuisine_types" to "service_role";

grant trigger on table "public"."cuisine_types" to "service_role";

grant truncate on table "public"."cuisine_types" to "service_role";

grant update on table "public"."cuisine_types" to "service_role";

grant delete on table "public"."menu_categories" to "anon";

grant insert on table "public"."menu_categories" to "anon";

grant references on table "public"."menu_categories" to "anon";

grant select on table "public"."menu_categories" to "anon";

grant trigger on table "public"."menu_categories" to "anon";

grant truncate on table "public"."menu_categories" to "anon";

grant update on table "public"."menu_categories" to "anon";

grant delete on table "public"."menu_categories" to "authenticated";

grant insert on table "public"."menu_categories" to "authenticated";

grant references on table "public"."menu_categories" to "authenticated";

grant select on table "public"."menu_categories" to "authenticated";

grant trigger on table "public"."menu_categories" to "authenticated";

grant truncate on table "public"."menu_categories" to "authenticated";

grant update on table "public"."menu_categories" to "authenticated";

grant delete on table "public"."menu_categories" to "service_role";

grant insert on table "public"."menu_categories" to "service_role";

grant references on table "public"."menu_categories" to "service_role";

grant select on table "public"."menu_categories" to "service_role";

grant trigger on table "public"."menu_categories" to "service_role";

grant truncate on table "public"."menu_categories" to "service_role";

grant update on table "public"."menu_categories" to "service_role";

grant delete on table "public"."menu_item_allergens" to "anon";

grant insert on table "public"."menu_item_allergens" to "anon";

grant references on table "public"."menu_item_allergens" to "anon";

grant select on table "public"."menu_item_allergens" to "anon";

grant trigger on table "public"."menu_item_allergens" to "anon";

grant truncate on table "public"."menu_item_allergens" to "anon";

grant update on table "public"."menu_item_allergens" to "anon";

grant delete on table "public"."menu_item_allergens" to "authenticated";

grant insert on table "public"."menu_item_allergens" to "authenticated";

grant references on table "public"."menu_item_allergens" to "authenticated";

grant select on table "public"."menu_item_allergens" to "authenticated";

grant trigger on table "public"."menu_item_allergens" to "authenticated";

grant truncate on table "public"."menu_item_allergens" to "authenticated";

grant update on table "public"."menu_item_allergens" to "authenticated";

grant delete on table "public"."menu_item_allergens" to "service_role";

grant insert on table "public"."menu_item_allergens" to "service_role";

grant references on table "public"."menu_item_allergens" to "service_role";

grant select on table "public"."menu_item_allergens" to "service_role";

grant trigger on table "public"."menu_item_allergens" to "service_role";

grant truncate on table "public"."menu_item_allergens" to "service_role";

grant update on table "public"."menu_item_allergens" to "service_role";

grant delete on table "public"."menu_items" to "anon";

grant insert on table "public"."menu_items" to "anon";

grant references on table "public"."menu_items" to "anon";

grant select on table "public"."menu_items" to "anon";

grant trigger on table "public"."menu_items" to "anon";

grant truncate on table "public"."menu_items" to "anon";

grant update on table "public"."menu_items" to "anon";

grant delete on table "public"."menu_items" to "authenticated";

grant insert on table "public"."menu_items" to "authenticated";

grant references on table "public"."menu_items" to "authenticated";

grant select on table "public"."menu_items" to "authenticated";

grant trigger on table "public"."menu_items" to "authenticated";

grant truncate on table "public"."menu_items" to "authenticated";

grant update on table "public"."menu_items" to "authenticated";

grant delete on table "public"."menu_items" to "service_role";

grant insert on table "public"."menu_items" to "service_role";

grant references on table "public"."menu_items" to "service_role";

grant select on table "public"."menu_items" to "service_role";

grant trigger on table "public"."menu_items" to "service_role";

grant truncate on table "public"."menu_items" to "service_role";

grant update on table "public"."menu_items" to "service_role";

grant delete on table "public"."restaurant_onboarding_notes" to "anon";

grant insert on table "public"."restaurant_onboarding_notes" to "anon";

grant references on table "public"."restaurant_onboarding_notes" to "anon";

grant select on table "public"."restaurant_onboarding_notes" to "anon";

grant trigger on table "public"."restaurant_onboarding_notes" to "anon";

grant truncate on table "public"."restaurant_onboarding_notes" to "anon";

grant update on table "public"."restaurant_onboarding_notes" to "anon";

grant delete on table "public"."restaurant_onboarding_notes" to "authenticated";

grant insert on table "public"."restaurant_onboarding_notes" to "authenticated";

grant references on table "public"."restaurant_onboarding_notes" to "authenticated";

grant select on table "public"."restaurant_onboarding_notes" to "authenticated";

grant trigger on table "public"."restaurant_onboarding_notes" to "authenticated";

grant truncate on table "public"."restaurant_onboarding_notes" to "authenticated";

grant update on table "public"."restaurant_onboarding_notes" to "authenticated";

grant delete on table "public"."restaurant_onboarding_notes" to "service_role";

grant insert on table "public"."restaurant_onboarding_notes" to "service_role";

grant references on table "public"."restaurant_onboarding_notes" to "service_role";

grant select on table "public"."restaurant_onboarding_notes" to "service_role";

grant trigger on table "public"."restaurant_onboarding_notes" to "service_role";

grant truncate on table "public"."restaurant_onboarding_notes" to "service_role";

grant update on table "public"."restaurant_onboarding_notes" to "service_role";

grant delete on table "public"."restaurant_users" to "anon";

grant insert on table "public"."restaurant_users" to "anon";

grant references on table "public"."restaurant_users" to "anon";

grant select on table "public"."restaurant_users" to "anon";

grant trigger on table "public"."restaurant_users" to "anon";

grant truncate on table "public"."restaurant_users" to "anon";

grant update on table "public"."restaurant_users" to "anon";

grant delete on table "public"."restaurant_users" to "authenticated";

grant insert on table "public"."restaurant_users" to "authenticated";

grant references on table "public"."restaurant_users" to "authenticated";

grant select on table "public"."restaurant_users" to "authenticated";

grant trigger on table "public"."restaurant_users" to "authenticated";

grant truncate on table "public"."restaurant_users" to "authenticated";

grant update on table "public"."restaurant_users" to "authenticated";

grant delete on table "public"."restaurant_users" to "service_role";

grant insert on table "public"."restaurant_users" to "service_role";

grant references on table "public"."restaurant_users" to "service_role";

grant select on table "public"."restaurant_users" to "service_role";

grant trigger on table "public"."restaurant_users" to "service_role";

grant truncate on table "public"."restaurant_users" to "service_role";

grant update on table "public"."restaurant_users" to "service_role";

grant delete on table "public"."restaurants" to "anon";

grant insert on table "public"."restaurants" to "anon";

grant references on table "public"."restaurants" to "anon";

grant select on table "public"."restaurants" to "anon";

grant trigger on table "public"."restaurants" to "anon";

grant truncate on table "public"."restaurants" to "anon";

grant update on table "public"."restaurants" to "anon";

grant delete on table "public"."restaurants" to "authenticated";

grant insert on table "public"."restaurants" to "authenticated";

grant references on table "public"."restaurants" to "authenticated";

grant select on table "public"."restaurants" to "authenticated";

grant trigger on table "public"."restaurants" to "authenticated";

grant truncate on table "public"."restaurants" to "authenticated";

grant update on table "public"."restaurants" to "authenticated";

grant delete on table "public"."restaurants" to "service_role";

grant insert on table "public"."restaurants" to "service_role";

grant references on table "public"."restaurants" to "service_role";

grant select on table "public"."restaurants" to "service_role";

grant trigger on table "public"."restaurants" to "service_role";

grant truncate on table "public"."restaurants" to "service_role";

grant update on table "public"."restaurants" to "service_role";

grant delete on table "public"."reviews" to "anon";

grant insert on table "public"."reviews" to "anon";

grant references on table "public"."reviews" to "anon";

grant select on table "public"."reviews" to "anon";

grant trigger on table "public"."reviews" to "anon";

grant truncate on table "public"."reviews" to "anon";

grant update on table "public"."reviews" to "anon";

grant delete on table "public"."reviews" to "authenticated";

grant insert on table "public"."reviews" to "authenticated";

grant references on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "authenticated";

grant trigger on table "public"."reviews" to "authenticated";

grant truncate on table "public"."reviews" to "authenticated";

grant update on table "public"."reviews" to "authenticated";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant references on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant trigger on table "public"."reviews" to "service_role";

grant truncate on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";


  create policy "Admins can manage allergens"
  on "public"."allergens"
  as permissive
  for all
  to authenticated
using ((((auth.jwt() ->> 'email'::text) ~~ '%@smartbites.com'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@gmail.com'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@your-domain.com'::text)));



  create policy "Public read access to allergens"
  on "public"."allergens"
  as permissive
  for select
  to public
using (true);



  create policy "Authenticated can delete cooking_methods"
  on "public"."cooking_methods"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "Authenticated can insert cooking_methods"
  on "public"."cooking_methods"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Authenticated can update cooking_methods"
  on "public"."cooking_methods"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "Public can read cooking_methods"
  on "public"."cooking_methods"
  as permissive
  for select
  to public
using (true);



  create policy "Anyone can read cuisine types"
  on "public"."cuisine_types"
  as permissive
  for select
  to public
using (true);



  create policy "menu_categories_delete_authenticated_only"
  on "public"."menu_categories"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "menu_categories_insert_authenticated_only"
  on "public"."menu_categories"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "menu_categories_select_public"
  on "public"."menu_categories"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can manage all menu item allergens"
  on "public"."menu_item_allergens"
  as permissive
  for all
  to authenticated
using ((((auth.jwt() ->> 'email'::text) ~~ '%@smartbites.com'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@gmail.com'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@your-domain.com'::text)));



  create policy "Public can read allergens for verified items"
  on "public"."menu_item_allergens"
  as permissive
  for select
  to anon, authenticated
using ((menu_item_id IN ( SELECT menu_items.id
   FROM menu_items
  WHERE (menu_items.is_verified = true))));



  create policy "Public can read allergens for verified menu items"
  on "public"."menu_item_allergens"
  as permissive
  for select
  to public
using ((menu_item_id IN ( SELECT menu_items.id
   FROM menu_items
  WHERE (menu_items.is_verified = true))));



  create policy "Public read access to menu item allergens"
  on "public"."menu_item_allergens"
  as permissive
  for select
  to public
using (true);



  create policy "Restaurants can manage own menu item allergens"
  on "public"."menu_item_allergens"
  as permissive
  for all
  to authenticated
using ((menu_item_id IN ( SELECT mi.id
   FROM (menu_items mi
     JOIN restaurants r ON ((mi.restaurant_id = r.id)))
  WHERE (r.user_id = auth.uid()))));



  create policy "Admins can manage all menu items"
  on "public"."menu_items"
  as permissive
  for all
  to authenticated
using ((((auth.jwt() ->> 'email'::text) ~~ '%@smartbites.menu'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@davault.dev'::text)))
with check ((((auth.jwt() ->> 'email'::text) ~~ '%@smartbites.menu'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@davault.dev'::text)));



  create policy "Public can read verified menu items with allergens"
  on "public"."menu_items"
  as permissive
  for select
  to public
using ((is_verified = true));



  create policy "Public can read verified menu items"
  on "public"."menu_items"
  as permissive
  for select
  to anon, authenticated
using ((is_verified = true));



  create policy "Restaurants can manage own menu items"
  on "public"."menu_items"
  as permissive
  for all
  to authenticated
using ((restaurant_id IN ( SELECT restaurants.id
   FROM restaurants
  WHERE (restaurants.user_id = auth.uid()))));



  create policy "Authenticated users can delete recipe allergens"
  on "public"."recipe_allergens"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "Authenticated users can insert recipe allergens"
  on "public"."recipe_allergens"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Authenticated users can read recipe allergens"
  on "public"."recipe_allergens"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Authenticated users can update recipe allergens"
  on "public"."recipe_allergens"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "Authenticated users can delete recipe dietary prefs"
  on "public"."recipe_dietary_prefs"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "Authenticated users can insert recipe dietary prefs"
  on "public"."recipe_dietary_prefs"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Authenticated users can read recipe dietary prefs"
  on "public"."recipe_dietary_prefs"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Authenticated users can update recipe dietary prefs"
  on "public"."recipe_dietary_prefs"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "Authenticated users can insert recipes"
  on "public"."recipes"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Authenticated users can read all recipes"
  on "public"."recipes"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Authenticated users can update recipes"
  on "public"."recipes"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "notes_delete_owner_only"
  on "public"."restaurant_onboarding_notes"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM restaurants r
  WHERE ((r.id = restaurant_onboarding_notes.restaurant_id) AND (r.user_id = auth.uid())))));



  create policy "notes_insert_owner_or_member"
  on "public"."restaurant_onboarding_notes"
  as permissive
  for insert
  to authenticated
with check ((((EXISTS ( SELECT 1
   FROM restaurants r
  WHERE ((r.id = restaurant_onboarding_notes.restaurant_id) AND (r.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM restaurant_users ru
  WHERE ((ru.restaurant_id = restaurant_onboarding_notes.restaurant_id) AND (ru.user_id = auth.uid()))))) AND (user_id = auth.uid())));



  create policy "notes_read_owner_or_member"
  on "public"."restaurant_onboarding_notes"
  as permissive
  for select
  to authenticated
using (((EXISTS ( SELECT 1
   FROM restaurants r
  WHERE ((r.id = restaurant_onboarding_notes.restaurant_id) AND (r.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM restaurant_users ru
  WHERE ((ru.restaurant_id = restaurant_onboarding_notes.restaurant_id) AND (ru.user_id = auth.uid()))))));



  create policy "notes_update_creator_or_owner"
  on "public"."restaurant_onboarding_notes"
  as permissive
  for update
  to authenticated
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM restaurants r
  WHERE ((r.id = restaurant_onboarding_notes.restaurant_id) AND (r.user_id = auth.uid()))))))
with check (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM restaurants r
  WHERE ((r.id = restaurant_onboarding_notes.restaurant_id) AND (r.user_id = auth.uid()))))));



  create policy "Admins can manage all restaurant users"
  on "public"."restaurant_users"
  as permissive
  for all
  to authenticated
using ((((auth.jwt() ->> 'email'::text) ~~ '%@smartbites.com'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@gmail.com'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@your-domain.com'::text)));



  create policy "Restaurant owners can read their restaurant users"
  on "public"."restaurant_users"
  as permissive
  for select
  to authenticated
using ((restaurant_id IN ( SELECT restaurants.id
   FROM restaurants
  WHERE (restaurants.user_id = auth.uid()))));



  create policy "Users can join restaurants"
  on "public"."restaurant_users"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "Users can read own restaurant associations"
  on "public"."restaurant_users"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "Admins can read all restaurants"
  on "public"."restaurants"
  as permissive
  for all
  to authenticated
using ((((auth.jwt() ->> 'email'::text) ~~ '%@smartbites.com'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@gmail.com'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@your-domain.com'::text)));



  create policy "Anyone can create restaurant"
  on "public"."restaurants"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Authenticated delete"
  on "public"."restaurants"
  as permissive
  for delete
  to authenticated
using ((auth.uid() IS NOT NULL));



  create policy "Authenticated insert"
  on "public"."restaurants"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() IS NOT NULL));



  create policy "Authenticated update"
  on "public"."restaurants"
  as permissive
  for update
  to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));



  create policy "Public read access to restaurants"
  on "public"."restaurants"
  as permissive
  for select
  to public
using (true);



  create policy "Public read access"
  on "public"."restaurants"
  as permissive
  for select
  to public
using (true);



  create policy "Restaurants can read own data"
  on "public"."restaurants"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "Restaurants can update own data"
  on "public"."restaurants"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id));



  create policy "Admins can manage all reviews"
  on "public"."reviews"
  as permissive
  for all
  to authenticated
using ((((auth.jwt() ->> 'email'::text) ~~ '%@smartbites.com'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@gmail.com'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@your-domain.com'::text)));



  create policy "Anyone can create reviews"
  on "public"."reviews"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "Public can read reviews"
  on "public"."reviews"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Public read access to reviews"
  on "public"."reviews"
  as permissive
  for select
  to public
using (true);



  create policy "Restaurants can read own reviews"
  on "public"."reviews"
  as permissive
  for select
  to authenticated
using ((restaurant_id IN ( SELECT restaurants.id
   FROM restaurants
  WHERE (restaurants.user_id = auth.uid()))));



  create policy "Restaurants can update own review responses"
  on "public"."reviews"
  as permissive
  for update
  to authenticated
using ((restaurant_id IN ( SELECT restaurants.id
   FROM restaurants
  WHERE (restaurants.user_id = auth.uid()))));



  create policy "Allow service role to delete user allergens"
  on "public"."user_allergens"
  as permissive
  for delete
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Allow service role to delete user profiles"
  on "public"."user_profiles"
  as permissive
  for delete
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Users can delete own recipe relationships"
  on "public"."user_recipes"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can insert own recipe relationships"
  on "public"."user_recipes"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can read own recipe relationships"
  on "public"."user_recipes"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can update own recipe relationships"
  on "public"."user_recipes"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Anyone can read allergens"
  on "public"."allergens"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Anyone can read dietary preferences"
  on "public"."dietary_prefs"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "Users can update own allergens"
  on "public"."user_allergens"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can update own dietary prefs"
  on "public"."user_dietary_prefs"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can update own profile"
  on "public"."user_profiles"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_onboarding_notes_updated_at BEFORE UPDATE ON public.restaurant_onboarding_notes FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


