-- Fix: Remove vulnerable RLS policy that exposes all guest payments to any anonymous user
-- The policy "Guest users can view their own payments" uses USING (user_id IS NULL) 
-- which allows ANY anonymous user to see ALL guest payments

DROP POLICY IF EXISTS "Guest users can view their own payments" ON public.payments;

-- Guest payments should only be accessible via specific checkout_request_id in application code
-- The application already queries by checkout_request_id for payment status tracking
-- No replacement policy needed - authenticated users can still see their own payments via existing policy