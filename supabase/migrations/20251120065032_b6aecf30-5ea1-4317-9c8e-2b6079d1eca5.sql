-- Remove phone_number column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone_number;