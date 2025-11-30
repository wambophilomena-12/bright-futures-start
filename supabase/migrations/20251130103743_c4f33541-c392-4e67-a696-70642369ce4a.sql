-- Add category-specific commission rates to referral_settings
ALTER TABLE public.referral_settings 
  DROP COLUMN IF EXISTS booking_commission_rate;

ALTER TABLE public.referral_settings
  ADD COLUMN trip_commission_rate numeric NOT NULL DEFAULT 5.0,
  ADD COLUMN event_commission_rate numeric NOT NULL DEFAULT 5.0,
  ADD COLUMN hotel_commission_rate numeric NOT NULL DEFAULT 5.0,
  ADD COLUMN attraction_commission_rate numeric NOT NULL DEFAULT 5.0,
  ADD COLUMN adventure_place_commission_rate numeric NOT NULL DEFAULT 5.0;