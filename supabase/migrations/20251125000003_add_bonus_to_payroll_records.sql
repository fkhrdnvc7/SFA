-- ============================================
-- Add bonus fields to payroll_records
-- ============================================

ALTER TABLE public.payroll_records
ADD COLUMN IF NOT EXISTS bonus_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_note TEXT;

UPDATE public.payroll_records
SET bonus_amount = COALESCE(bonus_amount, 0);

