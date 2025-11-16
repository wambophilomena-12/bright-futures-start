-- Create a view that provides limited booking data to content creators
-- This implements data minimization while preserving functionality

CREATE OR REPLACE VIEW creator_booking_summary AS
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
  END as guest_phone_limited,
  -- Full access fields (non-sensitive)
  b.payment_method
FROM bookings b;

-- Grant appropriate access to the view
GRANT SELECT ON creator_booking_summary TO authenticated;

COMMENT ON VIEW creator_booking_summary IS 'Provides privacy-protected booking data for content creators. Full contact details only shown for confirmed bookings requiring coordination.';
