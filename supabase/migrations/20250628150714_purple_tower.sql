/*
  # Create events table

  1. New Tables
    - `events`
      - `id` (uuid, primary key) - Unique identifier for event
      - `user_id` (uuid, foreign key) - References users table
      - `title` (text, not null) - Event title
      - `description` (text, nullable) - Event description
      - `event_date` (date, not null) - Date of the event
      - `event_time` (text, not null) - Time of the event (HH:MM format)
      - `location` (text, nullable) - Event location
      - `event_type` (text, not null) - Type of event (casual, formal, sport, party)
      - `icon` (text, not null) - Icon for the event
      - `status` (text, not null) - Status of outfit preparation (ready, preparing, generate)
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp

  2. Security
    - Enable RLS on `events` table
    - Add policies for authenticated users to manage their own events
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time text NOT NULL,
  location text,
  event_type text NOT NULL CHECK (event_type IN ('casual', 'formal', 'sport', 'party')),
  icon text NOT NULL DEFAULT '📅',
  status text NOT NULL DEFAULT 'preparing' CHECK (status IN ('ready', 'preparing', 'generate')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own events"
  ON events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS events_user_id_idx ON events(user_id);
CREATE INDEX IF NOT EXISTS events_date_idx ON events(event_date DESC);
CREATE INDEX IF NOT EXISTS events_type_idx ON events(event_type);
CREATE INDEX IF NOT EXISTS events_status_idx ON events(status);