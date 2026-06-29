-- Add incoming_job_id to jobs table to link with incoming_jobs
ALTER TABLE public.jobs
ADD COLUMN incoming_job_id UUID REFERENCES public.incoming_jobs(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_jobs_incoming_job_id ON public.jobs(incoming_job_id);

-- Add comment
COMMENT ON COLUMN public.jobs.incoming_job_id IS 'Link to incoming job - when all outgoing jobs complete, this job should be closed';
