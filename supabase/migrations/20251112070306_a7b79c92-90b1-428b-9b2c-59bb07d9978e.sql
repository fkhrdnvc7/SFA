-- Create payroll status enum
CREATE TYPE public.payroll_status AS ENUM ('tolangan', 'tolanmagan', 'qisman');

-- Create payroll_records table for tracking monthly payments
CREATE TABLE public.payroll_records (
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

-- RLS policies for payroll_records
CREATE POLICY "Seamstresses can view their own payroll records"
  ON public.payroll_records FOR SELECT
  USING (
    seamstress_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY "Admins and managers can manage payroll records"
  ON public.payroll_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_payroll_records_updated_at
  BEFORE UPDATE ON public.payroll_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_payroll_records_seamstress ON public.payroll_records(seamstress_id);
CREATE INDEX idx_payroll_records_date ON public.payroll_records(year, month);