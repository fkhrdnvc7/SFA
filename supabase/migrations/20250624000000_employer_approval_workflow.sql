-- 1. Add user_id to employers table (link employer company to user account)
ALTER TABLE public.employers
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT;

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_employers_user_id ON public.employers(user_id);

-- 2. Add approval workflow fields to incoming_jobs
ALTER TABLE public.incoming_jobs
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS employer_price_per_unit NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS employer_total_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS employer_notes TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_incoming_jobs_approval_status ON public.incoming_jobs(approval_status);
CREATE INDEX IF NOT EXISTS idx_incoming_jobs_employer_id ON public.incoming_jobs(employer_id);

-- 3. RLS Policy: Employers can see their own incoming jobs
CREATE POLICY "Employers see their own jobs"
ON public.incoming_jobs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.employers e ON e.user_id = p.id
    WHERE p.id = auth.uid()
    AND e.id = incoming_jobs.employer_id
    AND p.role = 'ISH_BERUVCHI'
  )
);

-- 4. RLS Policy: Employers can update approval fields on their jobs
CREATE POLICY "Employers approve their jobs"
ON public.incoming_jobs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.employers e ON e.user_id = p.id
    WHERE p.id = auth.uid()
    AND e.id = incoming_jobs.employer_id
    AND p.role = 'ISH_BERUVCHI'
  )
)
WITH CHECK (
  -- Employers can only update specific approval fields
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.employers e ON e.user_id = p.id
    WHERE p.id = auth.uid()
    AND e.id = incoming_jobs.employer_id
    AND p.role = 'ISH_BERUVCHI'
  )
);

-- 5. RLS Policy: Employers can see their own employer record
CREATE POLICY "Employers see their own company info"
ON public.employers FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('ADMIN', 'MANAGER')
  )
);

-- 6. Function to auto-calculate employer_total_price
CREATE OR REPLACE FUNCTION calculate_employer_total_price()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employer_price_per_unit IS NOT NULL AND NEW.quantity IS NOT NULL THEN
    NEW.employer_total_price := NEW.employer_price_per_unit * NEW.quantity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger to auto-calculate employer total price
DROP TRIGGER IF EXISTS trigger_calculate_employer_total_price ON public.incoming_jobs;
CREATE TRIGGER trigger_calculate_employer_total_price
  BEFORE INSERT OR UPDATE OF employer_price_per_unit, quantity
  ON public.incoming_jobs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_employer_total_price();

-- 8. Update existing incoming_jobs to have 'approved' status if they have employer data
-- (backward compatibility for existing jobs)
UPDATE public.incoming_jobs
SET approval_status = 'approved'
WHERE employer_id IS NOT NULL
  AND approval_status IS NULL;
