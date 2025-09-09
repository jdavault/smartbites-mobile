-- 20250907_restaurants.sql
-- Migration for SmartBites for Restaurants schema
-- This file excludes recipe- and user-related tables from 'public'

drop extension if exists "pg_net";

create extension if not exists "moddatetime" with schema "public";

-- Enums
create type "public"."file_type" as enum ('pdf', 'csv');
create type "public"."restaurant_status" as enum ('pending', 'approved', 'rejected');
create type "public"."upload_status" as enum ('pending', 'processed', 'failed');
create type "public"."verification_status" as enum ('pending', 'approved', 'rejected');

-- New restaurant-related tables
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

-- Indexes and constraints
create unique index cooking_methods_name_key on public.cooking_methods (name);
create unique index cooking_methods_pkey on public.cooking_methods (id);

create unique index cuisine_types_name_key on public.cuisine_types (name);
create unique index cuisine_types_pkey on public.cuisine_types (id);

create unique index menu_categories_name_key on public.menu_categories (name);
create unique index menu_categories_pkey on public.menu_categories (id);

create unique index menu_item_allergens_pkey on public.menu_item_allergens (menu_item_id, allergen_id);

create unique index menu_items_pkey on public.menu_items (id);

create unique index restaurant_onboarding_notes_pkey on public.restaurant_onboarding_notes (id);

create unique index restaurant_users_pkey on public.restaurant_users (id);
create unique index restaurant_users_restaurant_id_user_id_key on public.restaurant_users (restaurant_id, user_id);

create unique index restaurants_email_key on public.restaurants (email);
create unique index restaurants_pkey on public.restaurants (id);

create unique index reviews_pkey on public.reviews (id);

-- Add PK/FK
alter table "public"."cooking_methods" add constraint cooking_methods_pkey primary key using index cooking_methods_pkey;
alter table "public"."cuisine_types" add constraint cuisine_types_pkey primary key using index cuisine_types_pkey;
alter table "public"."menu_categories" add constraint menu_categories_pkey primary key using index menu_categories_pkey;
alter table "public"."menu_item_allergens" add constraint menu_item_allergens_pkey primary key using index menu_item_allergens_pkey;
alter table "public"."menu_items" add constraint menu_items_pkey primary key using index menu_items_pkey;
alter table "public"."restaurant_onboarding_notes" add constraint restaurant_onboarding_notes_pkey primary key using index restaurant_onboarding_notes_pkey;
alter table "public"."restaurant_users" add constraint restaurant_users_pkey primary key using index restaurant_users_pkey;
alter table "public"."restaurants" add constraint restaurants_pkey primary key using index restaurants_pkey;
alter table "public"."reviews" add constraint reviews_pkey primary key using index reviews_pkey;

-- Foreign keys (auth.users reference stays)
alter table "public"."menu_item_allergens" add constraint menu_item_allergens_allergen_id_fkey foreign key (allergen_id) references allergens(id) on delete cascade not valid;
alter table "public"."menu_item_allergens" add constraint menu_item_allergens_menu_item_id_fkey foreign key (menu_item_id) references menu_items(id) on delete cascade not valid;

alter table "public"."menu_items" add constraint menu_items_menu_category_id_fkey foreign key (menu_category_id) references menu_categories(id) on delete set null not valid;
alter table "public"."menu_items" add constraint menu_items_restaurant_id_fkey foreign key (restaurant_id) references restaurants(id) on delete cascade not valid;

alter table "public"."restaurant_onboarding_notes" add constraint restaurant_onboarding_notes_restaurant_id_fkey foreign key (restaurant_id) references restaurants(id) on delete cascade not valid;
alter table "public"."restaurant_onboarding_notes" add constraint restaurant_onboarding_notes_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade not valid;

alter table "public"."restaurant_users" add constraint restaurant_users_restaurant_id_fkey foreign key (restaurant_id) references restaurants(id) on delete cascade not valid;
alter table "public"."restaurant_users" add constraint restaurant_users_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade not valid;

alter table "public"."restaurants" add constraint restaurants_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade not valid;

alter table "public"."reviews" add constraint reviews_menu_item_id_fkey foreign key (menu_item_id) references menu_items(id) on delete set null not valid;
alter table "public"."reviews" add constraint reviews_restaurant_id_fkey foreign key (restaurant_id) references restaurants(id) on delete cascade not valid;

-- Sample check constraint
alter table "public"."reviews" add constraint reviews_rating_check check (rating >= 1 and rating <= 5) not valid;

-- Example trigger for updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_menu_items_updated_at before update on public.menu_items
for each row execute function update_updated_at_column();

create trigger trg_onboarding_notes_updated_at before update on public.restaurant_onboarding_notes
for each row execute function moddatetime('updated_at');

create trigger update_restaurants_updated_at before update on public.restaurants
for each row execute function update_updated_at_column();

-- Policies: (keep just restaurant tables — you can expand as needed)
create policy "Public read access to restaurants"
on "public"."restaurants"
for select
to public
using (true);

create policy "Public read access to reviews"
on "public"."reviews"
for select
to public
using (true);
