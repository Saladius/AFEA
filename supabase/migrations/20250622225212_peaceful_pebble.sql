/*
  # Create clothes table

  1. New Tables
    - `clothes`
      - `id` (uuid, primary key) - Unique identifier for clothing item
      - `user_id` (uuid, foreign key) - References users table
      - `image_url` (text, not null) - URL to clothing item image
      - `type` (text, not null) - Type of clothing (top, bottom, shoes, etc.)
      - `color` (text, nullable) - Primary color of the item
      - `season` (text, nullable) - Suitable season (spring, summer, fall, winter, all)
      - `size` (text, nullable) - Size of the clothing item
      - `material` (text, nullable) - Material composition
      - `style` (text, nullable) - Style category (casual, formal, sport, etc.)
      - `brand` (text, nullable) - Brand name
      - `model` (text, nullable) - Model or product name
      - `tags` (text[], nullable) - Array of additional tags
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp

  2. Security
    - Enable RLS on `clothes` table
    - Add policies for authenticated users to manage their own clothes
*/

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

CREATE POLICY "Users can read own clothes"
  ON clothes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clothes"
  ON clothes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clothes"
  ON clothes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clothes"
  ON clothes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS clothes_user_id_idx ON clothes(user_id);
CREATE INDEX IF NOT EXISTS clothes_type_idx ON clothes(type);
CREATE INDEX IF NOT EXISTS clothes_created_at_idx ON clothes(created_at DESC);