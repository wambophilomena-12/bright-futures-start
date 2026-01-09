-- Fix RLS policies with overly permissive "WITH CHECK (true)"

-- 1. payments: Only Edge Functions (service role) insert payments
-- The mpesa-stk-push edge function uses service role, so we restrict to service_role
DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;
CREATE POLICY "Service role can insert payments"
ON public.payments FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- 2. referral_commissions: Only inserted by database trigger (runs as definer)
-- No client-side inserts needed - restrict to service_role only
DROP POLICY IF EXISTS "System can insert commissions" ON public.referral_commissions;
CREATE POLICY "Service role can insert commissions"
ON public.referral_commissions FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- 3. referral_tracking: Users tracking referral clicks - must be authenticated
DROP POLICY IF EXISTS "Anyone can insert referral tracking" ON public.referral_tracking;
CREATE POLICY "Authenticated users can insert referral tracking"
ON public.referral_tracking FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. reschedule_log: Only the booking owner can insert reschedule logs
DROP POLICY IF EXISTS "System can insert reschedule logs" ON public.reschedule_log;
CREATE POLICY "Users can insert their own reschedule logs"
ON public.reschedule_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. search_queries: Analytics - both guests and authenticated users
-- Restrict to ensure user_id matches if provided, or session_id for guests
DROP POLICY IF EXISTS "Anyone can insert search queries" ON public.search_queries;
CREATE POLICY "Users can insert search queries"
ON public.search_queries FOR INSERT
WITH CHECK (
  -- Authenticated user inserting their own query
  (auth.uid() IS NOT NULL AND user_id = auth.uid() AND session_id IS NULL)
  OR
  -- Guest user with session_id only (no user_id)
  (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL)
);

-- 6. manual_entries: Used by hosts AND public guests via shareable booking links
-- This intentionally allows public access for the shareable booking feature
-- Keep permissive but add a comment explaining the business requirement
DROP POLICY IF EXISTS "Anyone can insert manual entries" ON public.manual_entries;
CREATE POLICY "Anyone can insert manual entries for shareable booking links"
ON public.manual_entries FOR INSERT
WITH CHECK (
  -- Hosts creating entries for their items
  (auth.uid() IS NOT NULL AND created_by = auth.uid())
  OR
  -- Public guests via shareable booking links (created_by will be null)
  (created_by IS NULL AND guest_name IS NOT NULL AND guest_contact IS NOT NULL)
);