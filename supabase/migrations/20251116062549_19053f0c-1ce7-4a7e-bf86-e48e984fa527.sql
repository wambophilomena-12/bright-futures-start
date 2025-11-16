-- Check and remove any security definer views
-- First, get all views that might have security definer
DO $$
DECLARE
    v_view RECORD;
BEGIN
    FOR v_view IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname LIKE '%booking%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', v_view.schemaname, v_view.viewname);
    END LOOP;
END $$;

-- Recreate the view cleanly without any security definer
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
  CASE 
    WHEN b.guest_name IS NOT NULL THEN 
      LEFT(b.guest_name, 1) || REPEAT('*', GREATEST(LENGTH(b.guest_name) - 1, 3))
    ELSE NULL 
  END as guest_name_masked,
  CASE 
    WHEN b.status = 'confirmed' THEN b.guest_email
    ELSE NULL 
  END as guest_email_limited,
  CASE 
    WHEN b.status = 'confirmed' THEN b.guest_phone
    ELSE NULL 
  END as guest_phone_limited
FROM bookings b;

COMMENT ON VIEW creator_booking_summary IS 'Privacy-protected booking data for content creators. Contact details only shown for confirmed bookings.';
