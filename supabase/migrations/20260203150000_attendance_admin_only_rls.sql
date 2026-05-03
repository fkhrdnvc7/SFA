-- Davomat: faqat ADMIN ko'radi va keldi-ketdini belgilaydi (tikuvchilar uchun emas).

DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can insert their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can update their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins and managers can manage all attendance" ON public.attendance;

CREATE POLICY "Admins can select attendance"
  ON public.attendance FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'ADMIN');

CREATE POLICY "Admins can insert attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (public.get_user_role(auth.uid()) = 'ADMIN');

CREATE POLICY "Admins can update attendance"
  ON public.attendance FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'ADMIN')
  WITH CHECK (public.get_user_role(auth.uid()) = 'ADMIN');

CREATE POLICY "Admins can delete attendance"
  ON public.attendance FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'ADMIN');
