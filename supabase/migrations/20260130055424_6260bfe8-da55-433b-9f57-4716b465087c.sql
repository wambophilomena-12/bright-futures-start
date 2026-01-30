-- Add child_entry_fee column to adventure_places table for storing child entrance fee
ALTER TABLE public.adventure_places 
ADD COLUMN IF NOT EXISTS child_entry_fee numeric DEFAULT 0;