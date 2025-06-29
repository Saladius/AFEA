/*
  # Add style and weather columns to clothes table

  1. Changes
    - Add `style_tags` column (text array) for style-related tags
    - Add `weather_tags` column (text array) for weather-related tags  
    - Add `formality` column (text) with check constraint for formality levels

  2. Security
    - No RLS changes needed as existing policies will cover new columns
*/

ALTER TABLE clothes 
  ADD COLUMN IF NOT EXISTS style_tags text[] NULL,
  ADD COLUMN IF NOT EXISTS weather_tags text[] NULL,
  ADD COLUMN IF NOT EXISTS formality text NULL CHECK (formality IN ('casual','formal','sport','business'));