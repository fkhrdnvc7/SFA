-- ============================================
-- Complete Database Migration for Supabase
-- Barcha jadvallar va sozlamalar
-- ============================================

-- 1. Create user roles enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('ADMIN', 'MANAGER', 'SEAMSTRESS');
  END IF;
END;
$$;

-- 2. Create users/profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role public.user_role NOT NULL DEFAULT 'SEAMSTRESS',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create operations table (catalog of sewing operations)
CREATE TABLE IF NOT EXISTS public.operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  default_price NUMERIC(12, 2) DEFAULT 0,
  unit TEXT DEFAULT 'dona',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on operations
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

-- 4. Create job status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE public.job_status AS ENUM ('ochiq', 'yopiq');
  END IF;
END;
$$;

-- 5. Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  status public.job_status NOT NULL DEFAULT 'ochiq',
  notes TEXT,
  total_estimated_amount NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 6. Create job_items table
CREATE TABLE IF NOT EXISTS public.job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  seamstress_id UUID REFERENCES public.profiles(id),
  operation_id UUID NOT NULL REFERENCES public.operations(id),
  color TEXT,
  size TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL,
  bonus_amount NUMERIC(12, 2) DEFAULT 0,
  bonus_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on job_items
ALTER TABLE public.job_items ENABLE ROW LEVEL SECURITY;

-- 7. Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  job_id UUID REFERENCES public.jobs(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time_in TIMESTAMP WITH TIME ZONE,
  time_out TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- 8. Create payroll status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payroll_status') THEN
    CREATE TYPE public.payroll_status AS ENUM ('tolangan', 'tolanmagan', 'qisman');
  END IF;
END;
$$;

-- 9. Create payroll_records table
CREATE TABLE IF NOT EXISTS public.payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seamstress_id UUID NOT NULL REFERENCES public.profiles(id),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status public.payroll_status NOT NULL DEFAULT 'tolanmagan',
  payment_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(seamstress_id, month, year)
);

-- Enable RLS on payroll_records
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

-- 10. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 11. Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 12. Create colors table
CREATE TABLE IF NOT EXISTS public.colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on colors
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;

-- 13. Create sizes table
CREATE TABLE IF NOT EXISTS public.sizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sizes
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;

-- 14. Create incoming_jobs table
CREATE TABLE IF NOT EXISTS public.incoming_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  defective_items INTEGER DEFAULT 0,
  extra_work INTEGER DEFAULT 0,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS on incoming_jobs
ALTER TABLE public.incoming_jobs ENABLE ROW LEVEL SECURITY;

-- 15. Create outgoing_jobs table
CREATE TABLE IF NOT EXISTS public.outgoing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incoming_job_id UUID NOT NULL REFERENCES public.incoming_jobs(id) ON DELETE CASCADE,
  quantity_sent INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS on outgoing_jobs
ALTER TABLE public.outgoing_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Functions
-- ============================================

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Yangi foydalanuvchi'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'SEAMSTRESS')
  );
  RETURN NEW;
END;
$$;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id;
$$;

-- ============================================
-- Triggers
-- ============================================

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payroll_records_updated_at ON public.payroll_records;
CREATE TRIGGER update_payroll_records_updated_at
  BEFORE UPDATE ON public.payroll_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLS Policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

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

-- Operations policies
DROP POLICY IF EXISTS "Everyone can view operations" ON public.operations;
DROP POLICY IF EXISTS "Admins and managers can manage operations" ON public.operations;

CREATE POLICY "Everyone can view operations"
  ON public.operations FOR SELECT
  USING (true);

CREATE POLICY "Admins and managers can manage operations"
  ON public.operations FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

-- Jobs policies
DROP POLICY IF EXISTS "Everyone can view jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins and managers can manage jobs" ON public.jobs;

CREATE POLICY "Everyone can view jobs"
  ON public.jobs FOR SELECT
  USING (true);

CREATE POLICY "Admins and managers can manage jobs"
  ON public.jobs FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

-- Job items policies
DROP POLICY IF EXISTS "Seamstresses can view their own job items" ON public.job_items;
DROP POLICY IF EXISTS "Admins and managers can manage job items" ON public.job_items;

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

-- Attendance policies
DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can insert their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can update their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins and managers can manage all attendance" ON public.attendance;

CREATE POLICY "Users can view their own attendance"
  ON public.attendance FOR SELECT
  USING (
    user_id = auth.uid() OR
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

CREATE POLICY "Users can insert their own attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own attendance"
  ON public.attendance FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins and managers can manage all attendance"
  ON public.attendance FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

-- Payroll records policies
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

-- Settings policies
DROP POLICY IF EXISTS "Everyone can view settings" ON public.settings;
DROP POLICY IF EXISTS "Only admins can manage settings" ON public.settings;

CREATE POLICY "Everyone can view settings"
  ON public.settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage settings"
  ON public.settings FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'ADMIN'
  );

-- Audit logs policies
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;

CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'ADMIN'
  );

-- Colors policies
DROP POLICY IF EXISTS "Everyone can view colors" ON public.colors;
DROP POLICY IF EXISTS "Admins and managers can manage colors" ON public.colors;

CREATE POLICY "Everyone can view colors"
  ON public.colors FOR SELECT
  USING (true);

CREATE POLICY "Admins and managers can manage colors"
  ON public.colors FOR ALL
  USING (get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER'));

-- Sizes policies
DROP POLICY IF EXISTS "Everyone can view sizes" ON public.sizes;
DROP POLICY IF EXISTS "Admins and managers can manage sizes" ON public.sizes;

CREATE POLICY "Everyone can view sizes"
  ON public.sizes FOR SELECT
  USING (true);

CREATE POLICY "Admins and managers can manage sizes"
  ON public.sizes FOR ALL
  USING (get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER'));

-- Incoming jobs policies
DROP POLICY IF EXISTS "Everyone can view incoming jobs" ON public.incoming_jobs;
DROP POLICY IF EXISTS "Admins and managers can manage incoming jobs" ON public.incoming_jobs;

CREATE POLICY "Everyone can view incoming jobs"
ON public.incoming_jobs
FOR SELECT
USING (true);

CREATE POLICY "Admins and managers can manage incoming jobs"
ON public.incoming_jobs
FOR ALL
USING (get_user_role(auth.uid()) = ANY (ARRAY['ADMIN'::user_role, 'MANAGER'::user_role]));

-- Outgoing jobs policies
DROP POLICY IF EXISTS "Everyone can view outgoing jobs" ON public.outgoing_jobs;
DROP POLICY IF EXISTS "Admins and managers can manage outgoing jobs" ON public.outgoing_jobs;

CREATE POLICY "Everyone can view outgoing jobs"
ON public.outgoing_jobs
FOR SELECT
USING (true);

CREATE POLICY "Admins and managers can manage outgoing jobs"
ON public.outgoing_jobs
FOR ALL
USING (get_user_role(auth.uid()) = ANY (ARRAY['ADMIN'::user_role, 'MANAGER'::user_role]));

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payroll_records_seamstress ON public.payroll_records(seamstress_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_date ON public.payroll_records(year, month);

-- ============================================
-- Seed Data
-- ============================================

-- Seed operations from spreadsheet
INSERT INTO public.operations (code, name, default_price) VALUES
  ('op001', 'танага замок', 5000),
  ('op002', 'танага ёқа а/в', 4500),
  ('op003', 'ичги ёқага аптачка улаш а/в', 3000),
  ('op004', 'ёқа тепаси а/в', 3500),
  ('op005', 'ёқа тепа 0.1 с/т', 2500),
  ('op006', 'аптачка тикиш с/т', 2000),
  ('op007', 'йелка а/в', 4000),
  ('op008', 'йелка с/т', 3000),
  ('op009', 'ёқа танага а/в', 3500),
  ('op010', 'тесма с/т', 2500),
  ('op011', 'йенг а/в', 4000),
  ('op012', 'йенг с/т', 3000),
  ('op013', 'бакавой а/в', 3500),
  ('op014', 'йенг манжет а/в', 3000),
  ('op015', 'етак манжет а/в', 3000),
  ('op016', 'етак манжет с/т', 2500)
ON CONFLICT (code) DO NOTHING;

