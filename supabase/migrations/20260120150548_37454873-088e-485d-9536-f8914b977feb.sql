
-- Fix 1: playbook_history - Add RLS policies for INSERT, UPDATE, DELETE
-- Block direct INSERT/UPDATE/DELETE (only service role should manage this)
CREATE POLICY "Block direct insert on playbook_history" 
ON public.playbook_history 
FOR INSERT 
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Block direct update on playbook_history" 
ON public.playbook_history 
FOR UPDATE 
TO anon, authenticated
USING (false);

CREATE POLICY "Block direct delete on playbook_history" 
ON public.playbook_history 
FOR DELETE 
TO anon, authenticated
USING (false);

-- Fix 2: analytics_events - Restrict SELECT to own events only
-- First drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read analytics events" ON public.analytics_events;

-- Create restrictive policy - users can only see their own events
CREATE POLICY "Users can only read their own analytics events" 
ON public.analytics_events 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Also update INSERT policy to ensure user_id is set correctly
DROP POLICY IF EXISTS "Authenticated users can insert analytics events" ON public.analytics_events;

CREATE POLICY "Users can insert their own analytics events" 
ON public.analytics_events 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
