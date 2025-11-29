-- Add amenities and activities columns to attractions table
ALTER TABLE attractions 
ADD COLUMN IF NOT EXISTS amenities jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS activities jsonb DEFAULT '[]'::jsonb;