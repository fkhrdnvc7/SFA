-- ============================================
-- Add completed_at column to jobs
-- ============================================

ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Set completed_at for existing closed jobs if missing
UPDATE public.jobs
SET completed_at = COALESCE(completed_at, updated_at)
WHERE status = 'yopiq' AND completed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_completed_at ON public.jobs(completed_at);

