-- Drop existing constraint first
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_booking_type_check;

-- Fix 1: Update existing 'event' booking types to 'attraction'
UPDATE public.bookings 
SET booking_type = 'attraction' 
WHERE booking_type = 'event';

-- Fix 2: Add activities column to trips table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trips' AND column_name = 'activities'
    ) THEN
        ALTER TABLE public.trips ADD COLUMN activities jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Fix 3: Add activities column to hotels table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hotels' AND column_name = 'activities'
    ) THEN
        ALTER TABLE public.hotels ADD COLUMN activities jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Fix 4: Add opening_hours and closing_hours to hotels if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hotels' AND column_name = 'opening_hours'
    ) THEN
        ALTER TABLE public.hotels ADD COLUMN opening_hours text;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hotels' AND column_name = 'closing_hours'
    ) THEN
        ALTER TABLE public.hotels ADD COLUMN closing_hours text;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hotels' AND column_name = 'days_opened'
    ) THEN
        ALTER TABLE public.hotels ADD COLUMN days_opened text[];
    END IF;
END $$;

-- Fix 5: Add operating hours to adventure_places if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'adventure_places' AND column_name = 'opening_hours'
    ) THEN
        ALTER TABLE public.adventure_places ADD COLUMN opening_hours text;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'adventure_places' AND column_name = 'closing_hours'
    ) THEN
        ALTER TABLE public.adventure_places ADD COLUMN closing_hours text;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'adventure_places' AND column_name = 'days_opened'
    ) THEN
        ALTER TABLE public.adventure_places ADD COLUMN days_opened text[];
    END IF;
END $$;

-- Fix 6: Drop and recreate creator_booking_summary view to remove auth.users dependency
DROP VIEW IF EXISTS public.creator_booking_summary;

CREATE VIEW public.creator_booking_summary AS
SELECT 
    b.id,
    b.item_id,
    b.booking_type,
    b.status,
    b.payment_status,
    b.slots_booked,
    b.total_amount,
    b.created_at,
    b.updated_at,
    b.user_id,
    b.is_guest_booking,
    b.booking_details,
    b.payment_method,
    CASE
        WHEN b.guest_name IS NOT NULL THEN left(b.guest_name, 1) || repeat('*', GREATEST(length(b.guest_name) - 1, 3))
        ELSE NULL
    END AS guest_name_masked,
    CASE
        WHEN b.status = 'confirmed' THEN b.guest_email
        ELSE NULL
    END AS guest_email_limited,
    CASE
        WHEN b.status = 'confirmed' THEN b.guest_phone
        ELSE NULL
    END AS guest_phone_limited
FROM public.bookings b;

-- Fix 7: Add proper RLS policy for creator_booking_summary view
ALTER VIEW public.creator_booking_summary SET (security_invoker = on);

-- Fix 8: Add RLS policy to allow creators to view their bookings
DROP POLICY IF EXISTS "Creators can view bookings for their items" ON public.bookings;

CREATE POLICY "Creators can view bookings for their items"
ON public.bookings
FOR SELECT
USING (
    -- User can see their own bookings
    (auth.uid() = user_id) 
    OR 
    -- Or bookings for items they created
    EXISTS (
        SELECT 1 FROM public.trips WHERE trips.id = item_id AND trips.created_by = auth.uid()
        UNION ALL
        SELECT 1 FROM public.hotels WHERE hotels.id = item_id AND hotels.created_by = auth.uid()
        UNION ALL
        SELECT 1 FROM public.adventure_places WHERE adventure_places.id = item_id AND adventure_places.created_by = auth.uid()
        UNION ALL
        SELECT 1 FROM public.attractions WHERE attractions.id = item_id AND attractions.created_by = auth.uid()
    )
);

-- Fix 9: Add proper check constraint for booking_type
ALTER TABLE public.bookings 
ADD CONSTRAINT booking_type_check 
CHECK (booking_type IN ('trip', 'hotel', 'adventure_place', 'attraction'));

-- Fix 10: Add proper check constraints for status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'booking_status_check'
    ) THEN
        ALTER TABLE public.bookings 
        ADD CONSTRAINT booking_status_check 
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));
    END IF;
END $$;

-- Fix 11: Add proper check constraints for payment_status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'payment_status_check'
    ) THEN
        ALTER TABLE public.bookings 
        ADD CONSTRAINT payment_status_check 
        CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'));
    END IF;
END $$;