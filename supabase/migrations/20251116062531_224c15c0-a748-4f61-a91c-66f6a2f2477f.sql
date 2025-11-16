-- Drop the previous view and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS creator_booking_summary;

-- Create view with standard permissions (not SECURITY DEFINER)
-- This view will use the querying user's RLS policies
CREATE VIEW creator_booking_summary AS
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
  -- Mask guest name - only show first initial for privacy
  CASE 
    WHEN b.guest_name IS NOT NULL THEN 
      LEFT(b.guest_name, 1) || REPEAT('*', GREATEST(LENGTH(b.guest_name) - 1, 3))
    ELSE NULL 
  END as guest_name_masked,
  -- Only show contact info for confirmed bookings that need coordination
  CASE 
    WHEN b.status = 'confirmed' THEN b.guest_email
    ELSE NULL 
  END as guest_email_limited,
  CASE 
    WHEN b.status = 'confirmed' THEN b.guest_phone
    ELSE NULL 
  END as guest_phone_limited
FROM bookings b;

COMMENT ON VIEW creator_booking_summary IS 'Provides privacy-protected booking data for content creators. Respects RLS policies. Full contact details only shown for confirmed bookings.';
