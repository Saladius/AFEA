/*
  # Create outfit_suggestions table

  1. New Tables
    - `outfit_suggestions`
      - `id` (uuid, primary key) - Unique identifier for outfit suggestion
      - `user_id` (uuid, foreign key) - References users table
      - `clothes_ids` (uuid[], not null) - Array of clothing item IDs that make up the outfit
      - `suggestion_date` (date, not null) - Date for which the outfit is suggested
      - `context` (text, nullable) - Context or occasion for the outfit (casual, work, formal, etc.)
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `outfit_suggestions` table
    - Add policies for authenticated users to manage their own outfit suggestions
*/

CREATE TABLE IF NOT EXISTS outfit_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clothes_ids uuid[] NOT NULL,
  suggestion_date date NOT NULL,
  context text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE outfit_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own outfit suggestions"
  ON outfit_suggestions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfit suggestions"
  ON outfit_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outfit suggestions"
  ON outfit_suggestions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own outfit suggestions"
  ON outfit_suggestions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS outfit_suggestions_user_id_idx ON outfit_suggestions(user_id);
CREATE INDEX IF NOT EXISTS outfit_suggestions_date_idx ON outfit_suggestions(suggestion_date DESC);