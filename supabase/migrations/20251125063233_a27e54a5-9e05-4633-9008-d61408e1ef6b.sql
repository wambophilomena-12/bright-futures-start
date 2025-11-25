-- Remove unique constraint to allow multiple reviews per user per item
ALTER TABLE public.reviews
DROP CONSTRAINT IF EXISTS reviews_user_item_unique;