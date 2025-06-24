/*
  # Complete Database Setup for Afea App
  
  This migration sets up all required tables for the Afea wardrobe management app:
  1. Users table (extends Supabase auth.users)
  2. Clothes table (wardrobe items)
  3. Outfit suggestions table
  4. Events table (calendar events)
  
  All tables include proper RLS policies and indexes for performance.
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2. CLOTHES TABLE
CREATE TABLE IF NOT EXISTS clothes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  type text NOT NULL,
  color text,
  season text,
  size text,
  material text,
  style text,
  brand text,
  model text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clothes ENABLE ROW LEVEL SECURITY;

-- Clothes policies
DROP POLICY IF EXISTS "Users can read own clothes" ON clothes;
DROP POLICY IF EXISTS "Users can insert own clothes" ON clothes;
DROP POLICY IF EXISTS "Users can update own clothes" ON clothes;
DROP POLICY IF EXISTS "Users can delete own clothes" ON clothes;

CREATE POLICY "Users can read own clothes"
  ON clothes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clothes"
  ON clothes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clothes"
  ON clothes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clothes"
  ON clothes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 3. OUTFIT SUGGESTIONS TABLE
CREATE TABLE IF NOT EXISTS outfit_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clothes_ids uuid[] NOT NULL,
  suggestion_date date NOT NULL,
  context text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE outfit_suggestions ENABLE ROW LEVEL SECURITY;

-- Outfit suggestions policies
DROP POLICY IF EXISTS "Users can read own outfit suggestions" ON outfit_suggestions;
DROP POLICY IF EXISTS "Users can insert own outfit suggestions" ON outfit_suggestions;
DROP POLICY IF EXISTS "Users can update own outfit suggestions" ON outfit_suggestions;
DROP POLICY IF EXISTS "Users can delete own outfit suggestions" ON outfit_suggestions;

CREATE POLICY "Users can read own outfit suggestions"
  ON outfit_suggestions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfit suggestions"
  ON outfit_suggestions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outfit suggestions"
  ON outfit_suggestions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own outfit suggestions"
  ON outfit_suggestions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4. EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time text NOT NULL,
  location text,
  event_type text NOT NULL CHECK (event_type IN ('casual', 'formal', 'sport', 'party')),
  icon text NOT NULL,
  status text NOT NULL DEFAULT 'generate' CHECK (status IN ('ready', 'preparing', 'generate')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Events policies
DROP POLICY IF EXISTS "Users can read own events" ON events;
DROP POLICY IF EXISTS "Users can insert own events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

CREATE POLICY "Users can read own events"
  ON events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- CREATE INDEXES FOR PERFORMANCE
-- Users indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Clothes indexes
CREATE INDEX IF NOT EXISTS clothes_user_id_idx ON clothes(user_id);
CREATE INDEX IF NOT EXISTS clothes_type_idx ON clothes(type);
CREATE INDEX IF NOT EXISTS clothes_created_at_idx ON clothes(created_at DESC);

-- Outfit suggestions indexes
CREATE INDEX IF NOT EXISTS outfit_suggestions_user_id_idx ON outfit_suggestions(user_id);
CREATE INDEX IF NOT EXISTS outfit_suggestions_date_idx ON outfit_suggestions(suggestion_date DESC);

-- Events indexes
CREATE INDEX IF NOT EXISTS events_user_id_idx ON events(user_id);
CREATE INDEX IF NOT EXISTS events_date_idx ON events(event_date);
CREATE INDEX IF NOT EXISTS events_status_idx ON events(status);
CREATE INDEX IF NOT EXISTS events_type_idx ON events(event_type);

-- CREATE STORAGE BUCKET FOR IMAGES
INSERT INTO storage.buckets (id, name, public)
VALUES ('clothes-images', 'clothes-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for clothes images
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'clothes-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'clothes-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'clothes-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to images
CREATE POLICY "Public can view images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'clothes-images');