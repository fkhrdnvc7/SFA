-- Add mobile UI improvements to incoming_jobs
ALTER TABLE public.incoming_jobs
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add index for better mobile performance
CREATE INDEX IF NOT EXISTS idx_incoming_jobs_is_favorite ON public.incoming_jobs(is_favorite) WHERE is_favorite = true;

-- Price history table
CREATE TABLE IF NOT EXISTS public.job_price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name TEXT NOT NULL,
  employer_id UUID REFERENCES public.employers(id) ON DELETE CASCADE,
  price_per_unit NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  total_price NUMERIC(12, 2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_price_history_job_name ON public.job_price_history(job_name);
CREATE INDEX IF NOT EXISTS idx_job_price_history_employer ON public.job_price_history(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_price_history_date ON public.job_price_history(date DESC);

-- Trigger to automatically save price history when job is approved
CREATE OR REPLACE FUNCTION save_job_price_history()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.approval_status = 'approved' AND NEW.employer_price_per_unit IS NOT NULL THEN
    INSERT INTO public.job_price_history (
      job_name,
      employer_id,
      price_per_unit,
      quantity,
      total_price,
      date
    ) VALUES (
      NEW.job_name,
      NEW.employer_id,
      NEW.employer_price_per_unit,
      NEW.quantity,
      NEW.employer_total_price,
      NEW.date
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_save_job_price_history ON public.incoming_jobs;
CREATE TRIGGER trigger_save_job_price_history
  AFTER UPDATE OF approval_status
  ON public.incoming_jobs
  FOR EACH ROW
  EXECUTE FUNCTION save_job_price_history();

-- Add RLS policies for price history
CREATE POLICY "Employers see their own price history"
ON public.job_price_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.employers e ON e.user_id = p.id
    WHERE p.id = auth.uid()
    AND e.id = job_price_history.employer_id
    AND p.role = 'ISH_BERUVCHI'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('ADMIN', 'MANAGER')
  )
);

-- Notification read status table
CREATE TABLE IF NOT EXISTS public.notification_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON public.notification_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_notification ON public.notification_reads(notification_id);

-- RLS for notification reads
CREATE POLICY "Users manage their own notification reads"
ON public.notification_reads FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
