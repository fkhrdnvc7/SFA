-- ============================================
-- QUICK FIX: RLS Policy va Migration
-- ============================================

-- STEP 1: Check if columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'incoming_jobs'
AND column_name IN ('approval_status', 'employer_price_per_unit');

-- If no results, run the full migration file first!
-- File: supabase/migrations/20250624000000_employer_approval_workflow.sql

-- STEP 2: Temporarily disable RLS to test (ONLY FOR DEBUG)
-- ALTER TABLE public.incoming_jobs DISABLE ROW LEVEL SECURITY;

-- STEP 3: Check current user and employer link
SELECT
    p.id as user_id,
    p.email,
    p.role,
    e.id as employer_id,
    e.name as employer_name,
    e.user_id as employer_user_id
FROM public.profiles p
LEFT JOIN public.employers e ON e.user_id = p.id
WHERE p.id = auth.uid();

-- STEP 4: Check if the job belongs to this employer
SELECT
    ij.id,
    ij.job_name,
    ij.employer_id,
    e.name as employer_name,
    e.user_id as employer_user_id,
    p.email as employer_email
FROM public.incoming_jobs ij
LEFT JOIN public.employers e ON e.id = ij.employer_id
LEFT JOIN public.profiles p ON p.id = e.user_id
WHERE ij.id = 'd497c360-5c4c-49f8-b1b0-cef8ede47921';

-- STEP 5: Manual update test (as employer user)
-- Login as test@employer.com first, then run:
UPDATE public.incoming_jobs
SET
    approval_status = 'approved',
    approved_at = now(),
    approved_by = auth.uid(),
    employer_price_per_unit = 2000
WHERE id = 'd497c360-5c4c-49f8-b1b0-cef8ede47921';

-- STEP 6: Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'incoming_jobs';
