-- Create incoming_jobs table (Kelgan ishlar)
CREATE TABLE public.incoming_jobs (
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

-- Create outgoing_jobs table (Ketgan ishlar)
CREATE TABLE public.outgoing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incoming_job_id UUID NOT NULL REFERENCES public.incoming_jobs(id) ON DELETE CASCADE,
  quantity_sent INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.incoming_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outgoing_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for incoming_jobs
CREATE POLICY "Everyone can view incoming jobs"
ON public.incoming_jobs
FOR SELECT
USING (true);

CREATE POLICY "Admins and managers can manage incoming jobs"
ON public.incoming_jobs
FOR ALL
USING (get_user_role(auth.uid()) = ANY (ARRAY['ADMIN'::user_role, 'MANAGER'::user_role]));

-- RLS policies for outgoing_jobs
CREATE POLICY "Everyone can view outgoing jobs"
ON public.outgoing_jobs
FOR SELECT
USING (true);

CREATE POLICY "Admins and managers can manage outgoing jobs"
ON public.outgoing_jobs
FOR ALL
USING (get_user_role(auth.uid()) = ANY (ARRAY['ADMIN'::user_role, 'MANAGER'::user_role]));