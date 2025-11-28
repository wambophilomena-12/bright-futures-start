-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can update their own verification if rejected" ON host_verifications;

-- Create a new policy that allows users to update their rejected verifications
-- USING checks the existing row (must be rejected and belong to user)
-- WITH CHECK only verifies ownership (allows status change to pending)
CREATE POLICY "Users can update their own verification if rejected"
ON host_verifications
FOR UPDATE
USING ((auth.uid() = user_id) AND (status = 'rejected'))
WITH CHECK (auth.uid() = user_id);