-- ============================================
-- Add tasks, expenses, and enhance job_items
-- ============================================

-- 1. Create task status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE public.task_status AS ENUM ('bajarilmagan', 'qisman', 'bajarilgan');
  END IF;
END;
$$;

-- 2. Create daily_tasks table
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seamstress_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_description TEXT NOT NULL,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.task_status NOT NULL DEFAULT 'bajarilmagan',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on daily_tasks
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

-- 3. Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 4. Add date and order_number to job_items
ALTER TABLE public.job_items
ADD COLUMN IF NOT EXISTS item_date DATE DEFAULT CURRENT_DATE;

ALTER TABLE public.job_items
ADD COLUMN IF NOT EXISTS order_number INTEGER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_job_items_date ON public.job_items(item_date);
CREATE INDEX IF NOT EXISTS idx_job_items_seamstress ON public.job_items(seamstress_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_seamstress_date ON public.daily_tasks(seamstress_id, task_date);

-- Function to generate order number per job and date
CREATE OR REPLACE FUNCTION public.get_next_order_number(p_job_id UUID, p_item_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_order INTEGER;
BEGIN
  SELECT COALESCE(MAX(order_number), 0) INTO v_max_order
  FROM public.job_items
  WHERE job_id = p_job_id
    AND COALESCE(item_date, DATE(created_at)) = COALESCE(p_item_date, DATE(created_at));
  
  RETURN v_max_order + 1;
END;
$$;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Agar order_number NULL bo'lsa yoki job/sana o'zgarganda yangi tartib raqam ber
  IF NEW.order_number IS NULL
     OR (TG_OP = 'UPDATE' AND (OLD.job_id IS DISTINCT FROM NEW.job_id OR OLD.item_date IS DISTINCT FROM NEW.item_date)) THEN
    NEW.order_number := public.get_next_order_number(NEW.job_id, COALESCE(NEW.item_date, DATE(NEW.created_at)));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_order_number ON public.job_items;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT OR UPDATE ON public.job_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();

-- Trigger for updating updated_at on daily_tasks
DROP TRIGGER IF EXISTS update_daily_tasks_updated_at ON public.daily_tasks;
CREATE TRIGGER update_daily_tasks_updated_at
  BEFORE UPDATE ON public.daily_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS Policies
-- ============================================

-- Daily tasks policies
DROP POLICY IF EXISTS "Seamstresses can view their own tasks" ON public.daily_tasks;
DROP POLICY IF EXISTS "Admins and managers can view all tasks" ON public.daily_tasks;
DROP POLICY IF EXISTS "Admins and managers can manage tasks" ON public.daily_tasks;
DROP POLICY IF EXISTS "Seamstresses can update their own task status" ON public.daily_tasks;

CREATE POLICY "Seamstresses can view their own tasks"
  ON public.daily_tasks FOR SELECT
  USING (
    seamstress_id = auth.uid() OR
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

CREATE POLICY "Admins and managers can view all tasks"
  ON public.daily_tasks FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

CREATE POLICY "Admins and managers can manage tasks"
  ON public.daily_tasks FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

CREATE POLICY "Seamstresses can update their own task status"
  ON public.daily_tasks FOR UPDATE
  USING (seamstress_id = auth.uid())
  WITH CHECK (seamstress_id = auth.uid());

-- Expenses policies
DROP POLICY IF EXISTS "Everyone can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins and managers can manage expenses" ON public.expenses;

CREATE POLICY "Everyone can view expenses"
  ON public.expenses FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

CREATE POLICY "Admins and managers can manage expenses"
  ON public.expenses FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

