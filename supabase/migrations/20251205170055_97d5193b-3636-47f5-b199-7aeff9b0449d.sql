-- Add local_name column to hotels table
ALTER TABLE public.hotels 
ADD COLUMN IF NOT EXISTS local_name text;

-- Add local_name column to adventure_places table
ALTER TABLE public.adventure_places 
ADD COLUMN IF NOT EXISTS local_name text;