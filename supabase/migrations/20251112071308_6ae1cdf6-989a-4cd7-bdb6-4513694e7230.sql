-- Create security definer function to check user role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id;
$$;

-- Drop and recreate profiles policies
DROP POLICY IF EXISTS "Admins and managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

CREATE POLICY "Admins and managers can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'ADMIN'
  );

CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'ADMIN'
  );

-- Drop and recreate operations policies
DROP POLICY IF EXISTS "Admins and managers can manage operations" ON public.operations;

CREATE POLICY "Admins and managers can manage operations"
  ON public.operations FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

-- Drop and recreate jobs policies
DROP POLICY IF EXISTS "Admins and managers can manage jobs" ON public.jobs;

CREATE POLICY "Admins and managers can manage jobs"
  ON public.jobs FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

-- Drop and recreate job_items policies
DROP POLICY IF EXISTS "Admins and managers can manage job items" ON public.job_items;
DROP POLICY IF EXISTS "Seamstresses can view their own job items" ON public.job_items;

CREATE POLICY "Admins and managers can manage job items"
  ON public.job_items FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

CREATE POLICY "Seamstresses can view their own job items"
  ON public.job_items FOR SELECT
  USING (
    seamstress_id = auth.uid() OR
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

-- Drop and recreate attendance policies
DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins and managers can manage all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can insert their own attendance" ON public.attendance;

CREATE POLICY "Users can view their own attendance"
  ON public.attendance FOR SELECT
  USING (
    user_id = auth.uid() OR
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

CREATE POLICY "Users can insert their own attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins and managers can manage all attendance"
  ON public.attendance FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

-- Drop and recreate payroll_records policies
DROP POLICY IF EXISTS "Seamstresses can view their own payroll records" ON public.payroll_records;
DROP POLICY IF EXISTS "Admins and managers can manage payroll records" ON public.payroll_records;

CREATE POLICY "Seamstresses can view their own payroll records"
  ON public.payroll_records FOR SELECT
  USING (
    seamstress_id = auth.uid() OR
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

CREATE POLICY "Admins and managers can manage payroll records"
  ON public.payroll_records FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

-- Drop and recreate settings policies
DROP POLICY IF EXISTS "Only admins can manage settings" ON public.settings;

CREATE POLICY "Only admins can manage settings"
  ON public.settings FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'ADMIN'
  );

-- Drop and recreate audit_logs policies
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;

CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'ADMIN'
  );