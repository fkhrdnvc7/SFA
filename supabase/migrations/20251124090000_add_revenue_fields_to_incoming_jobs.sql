-- Add revenue tracking fields for incoming jobs
ALTER TABLE public.incoming_jobs
ADD COLUMN IF NOT EXISTS client_price_per_unit NUMERIC(12, 2) DEFAULT 0;

ALTER TABLE public.incoming_jobs
ADD COLUMN IF NOT EXISTS worker_cost_per_unit NUMERIC(12, 2) DEFAULT 0;

