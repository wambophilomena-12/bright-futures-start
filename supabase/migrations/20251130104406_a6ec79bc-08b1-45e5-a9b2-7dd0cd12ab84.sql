-- Add category-specific platform service fees
ALTER TABLE public.referral_settings
DROP COLUMN IF EXISTS platform_service_fee,
ADD COLUMN trip_service_fee numeric NOT NULL DEFAULT 20.0,
ADD COLUMN event_service_fee numeric NOT NULL DEFAULT 20.0,
ADD COLUMN hotel_service_fee numeric NOT NULL DEFAULT 20.0,
ADD COLUMN attraction_service_fee numeric NOT NULL DEFAULT 20.0,
ADD COLUMN adventure_place_service_fee numeric NOT NULL DEFAULT 20.0;

-- Add platform referral commission rate (percentage of service fee allocated to referrals)
ALTER TABLE public.referral_settings
ADD COLUMN IF NOT EXISTS platform_referral_commission_rate numeric NOT NULL DEFAULT 5.0;