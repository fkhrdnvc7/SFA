-- ============================================
-- Update existing job_items: add dates and order numbers
-- ============================================

-- 1. Update item_date for existing records (use created_at date if item_date is NULL)
UPDATE public.job_items
SET item_date = DATE(created_at)
WHERE item_date IS NULL;

-- 2. Generate order numbers for all existing records grouped by job and date
-- Har bir ish va sana kombinatsiyasi uchun tartib raqami 1 dan boshlanadi
DO $$
DECLARE
  rec RECORD;
  v_current_job UUID;
  v_current_date DATE;
  v_order_counter INTEGER;
BEGIN
  -- Loop through all job_items ordered by job, date va created_at
  FOR rec IN 
    SELECT id, job_id, COALESCE(item_date, DATE(created_at)) AS effective_date, created_at
    FROM public.job_items
    ORDER BY job_id, COALESCE(item_date, DATE(created_at)), created_at
  LOOP
    -- If this is a new job or new date, reset counter to 1
    IF v_current_job IS NULL OR v_current_job != rec.job_id OR v_current_date IS DISTINCT FROM rec.effective_date THEN
      v_current_job := rec.job_id;
      v_current_date := rec.effective_date;
      v_order_counter := 1;
    ELSE
      v_order_counter := v_order_counter + 1;
    END IF;
    
    -- Update order number for this record
    UPDATE public.job_items
    SET order_number = v_order_counter
    WHERE id = rec.id;
  END LOOP;
END;
$$;

