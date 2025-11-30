-- Update existing 'item_share' referral types to 'booking' for consistency
UPDATE public.referral_tracking
SET referral_type = 'booking'
WHERE referral_type = 'item_share';

-- Update any existing host referrals to ensure item_id and item_type are NULL
UPDATE public.referral_tracking
SET item_id = NULL, item_type = NULL
WHERE referral_type = 'host';

-- Add the check constraint with proper referral type validation:
-- - For 'booking' referrals: item_id and item_type must be present and item_type must be valid
-- - For 'host' referrals: item_id and item_type should be null
ALTER TABLE public.referral_tracking
  ADD CONSTRAINT referral_tracking_item_validation CHECK (
    (referral_type = 'host' AND item_id IS NULL AND item_type IS NULL) OR
    (referral_type = 'booking' AND item_id IS NOT NULL AND item_type IS NOT NULL AND item_type IN ('trip', 'event', 'hotel', 'attraction', 'adventure', 'adventure_place'))
  );

-- Update comments to reflect the referral type distinction
COMMENT ON COLUMN public.referral_tracking.item_id IS 'UUID of the item being referred (trip, hotel, attraction, etc.). Required for booking referrals, NULL for host referrals.';
COMMENT ON COLUMN public.referral_tracking.item_type IS 'Type of item being referred. Required for booking referrals, NULL for host referrals. Must match valid item types when present.';