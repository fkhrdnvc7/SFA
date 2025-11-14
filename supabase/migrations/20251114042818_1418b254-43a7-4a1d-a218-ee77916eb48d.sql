-- Add UPDATE policy for users to update their own attendance
CREATE POLICY "Users can update their own attendance"
ON public.attendance
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());