-- Add user_id, first_name, last_name, company_name to employers table
ALTER TABLE public.employers
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Update existing records: name -> company_name
UPDATE public.employers
SET company_name = name
WHERE company_name IS NULL;

-- Make company_name NOT NULL
ALTER TABLE public.employers
  ALTER COLUMN company_name SET NOT NULL;

-- Add index for user_id
CREATE INDEX IF NOT EXISTS idx_employers_user_id ON public.employers(user_id);

-- Add RLS policy for employers with user_id to see their own data
CREATE POLICY "Employers see their own data"
ON public.employers FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('ADMIN', 'MANAGER')
  )
);

-- Add RLS policy for incoming_jobs for employers to see their jobs
CREATE POLICY "Employers see their own incoming jobs"
ON public.incoming_jobs FOR SELECT
USING (
  employer_id IN (
    SELECT id FROM public.employers
    WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('ADMIN', 'MANAGER', 'ISH_BERUVCHI')
  )
);

-- Allow employers to update their own jobs (approval)
CREATE POLICY "Employers update their incoming jobs"
ON public.incoming_jobs FOR UPDATE
USING (
  employer_id IN (
    SELECT id FROM public.employers
    WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('ADMIN', 'MANAGER')
  )
);
