-- Add NOT NULL constraints to ensure item_id and item_type are always present
-- This is critical for the referral link system to work correctly
ALTER TABLE public.referral_tracking 
  ALTER COLUMN item_id SET NOT NULL,
  ALTER COLUMN item_type SET NOT NULL;

-- Add check constraint to ensure item_type is one of the valid types
ALTER TABLE public.referral_tracking
  ADD CONSTRAINT valid_item_type CHECK (
    item_type IN ('trip', 'event', 'hotel', 'attraction', 'adventure', 'adventure_place')
  );

-- Add index on (item_id, item_type) for faster lookups when tracking referral clicks
CREATE INDEX IF NOT EXISTS idx_referral_tracking_item 
  ON public.referral_tracking(item_id, item_type);

-- Add index on referrer_id for faster commission calculations
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer 
  ON public.referral_tracking(referrer_id);

-- Add comment explaining the purpose
COMMENT ON COLUMN public.referral_tracking.item_id IS 'UUID of the item being referred (trip, hotel, attraction, etc.). Used in referral URLs as path parameter.';
COMMENT ON COLUMN public.referral_tracking.item_type IS 'Type of item being referred. Must match valid item types in the system.';