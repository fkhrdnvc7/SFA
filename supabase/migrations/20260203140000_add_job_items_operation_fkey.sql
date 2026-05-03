-- PostgREST embedded selects (job_items -> operations) require a declared FK.
-- Agar jadval Table Editor orqali yaratilgan bo'lsa, FK bo'lmasligi mumkin — bu holda PGRST200 chiqadi.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_items_operation_id_fkey'
  ) THEN
    ALTER TABLE public.job_items
      ADD CONSTRAINT job_items_operation_id_fkey
      FOREIGN KEY (operation_id) REFERENCES public.operations(id);
  END IF;
END $$;
