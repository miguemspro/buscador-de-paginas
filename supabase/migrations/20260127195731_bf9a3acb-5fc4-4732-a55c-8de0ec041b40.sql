-- Fix admin_users RLS policy to properly block public reads
-- The current policy uses RESTRICTIVE but needs proper authentication check

-- Drop the current permissive SELECT policy
DROP POLICY IF EXISTS "Admin users readable by service role only" ON public.admin_users;

-- Create a proper blocking SELECT policy that only allows service role
-- For SELECT operations, we use USING clause
CREATE POLICY "Block public read on admin_users"
ON public.admin_users
FOR SELECT
TO authenticated, anon
USING (false);

-- Ensure service role still has access (handled by RLS bypass)
-- Note: Service role automatically bypasses RLS, so we don't need explicit policy