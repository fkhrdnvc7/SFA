# Ish Beruvchi Sistemasi - Database Setup Instructions

## IMPORTANT: Bu qadamlarni qo'lda bajarish kerak!

### 1. Database Migration Apply Qilish

1. Supabase Dashboard'ga kiring: https://supabase.com/dashboard
2. O'z project'ingizni tanlang (SFA Tailoring)
3. Chap sidebar'dan **SQL Editor** ni oching
4. **New query** tugmasini bosing
5. Quyidagi migration faylini ko'chirib olib SQL Editor'ga joylashtiring va **Run** bosing:

**Fayl:** `supabase/migrations/20250624000000_employer_approval_workflow.sql`

```sql
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
```

### 2. Ish Beruvchi User Account Yaratish

Migration'dan keyin ish beruvchi uchun user account yaratish kerak:

#### Option A: SQL orqali (Tezroq)

Supabase SQL Editor'da quyidagi query'ni run qiling:

```sql
-- 1. Birinchi auth.users'da user yaratish kerak (bu Supabase Dashboard'dan qiling)
-- Authentication -> Users -> Add user
-- Email: test@employer.com
-- Password: test123456
-- Auto Confirm: Yes

-- 2. Profiles'da ISH_BERUVCHI role bilan profile yaratish
-- (user yaratilgandan keyin avtomatik yaratiladi, faqat role'ni update qilish kerak)

-- User ID'ni olish (email orqali)
SELECT id, email FROM auth.users WHERE email = 'test@employer.com';

-- Role'ni ISH_BERUVCHI'ga o'zgartirish
UPDATE public.profiles 
SET role = 'ISH_BERUVCHI' 
WHERE email = 'test@employer.com';

-- 3. Employer bilan bog'lash
-- Avval employer ID'ni topish
SELECT id, name FROM public.employers;

-- Employer'ga user_id qo'shish (employer_id_ni o'zgartiring!)
UPDATE public.employers
SET user_id = (SELECT id FROM auth.users WHERE email = 'test@employer.com')
WHERE name = 'Test Employer'; -- Employer nomini o'zgartiring
```

#### Option B: Dashboard orqali (Qadamma-qadam)

1. **Authentication -> Users -> Add user**
   - Email: test@employer.com
   - Password: test123456
   - Auto Confirm: Yes
   - Create User

2. **Table Editor -> profiles**
   - Find the user you just created (test@employer.com)
   - Edit the row
   - Change `role` to `ISH_BERUVCHI`
   - Save

3. **Table Editor -> employers**
   - Find the employer company
   - Edit the row
   - Set `user_id` to the user ID you created
   - Save

### 3. Test Qilish

1. Logout qiling (agar login bo'lsangiz)
2. Login qiling: test@employer.com / test123456
3. Avtomatik `/employer-dashboard` ga yo'naltirilishi kerak
4. Admin sifatida incoming job yarating va shu ish beruvchini tanlang
5. Ish beruvchi dashboard'da notification va pending job ko'rinishi kerak

### 4. Troubleshooting

**Agar notification ko'rinmasa:**
- Browser console'ni tekshiring (F12 -> Console)
- Network tab'da notification fetch qilinayotganini tekshiring
- Supabase Table Editor'da `notifications` table'ni ochib, notification yaratilganini tekshiring

**Agar dashboard bo'sh bo'lsa:**
- RLS policies to'g'ri ishlaganini tekshiring
- Console'da xatolik bormi tekshiring
- Employer'ning `user_id` to'g'ri bog'langanini tekshiring

**Agar approval qilganda xatolik chiqsa:**
- RLS policy "Employers approve their jobs" to'g'ri apply qilinganini tekshiring
- Browser console'da error message'ni o'qing

### 5. Production'ga Deploy Qilishdan Oldin

- [ ] Migration test muhitda test qilingan
- [ ] Barcha RLS policies test qilingan
- [ ] Ish beruvchi login/approve workflow test qilingan
- [ ] Notification system ishlayapti
- [ ] Backup olingan (muhim!)

## Quick Test Commands

```sql
-- Check if migration applied successfully
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employers' 
AND column_name IN ('user_id', 'telegram_chat_id', 'telegram_username');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'incoming_jobs' 
AND column_name IN ('approval_status', 'employer_price_per_unit');

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('employers', 'incoming_jobs');

-- Check if test user exists
SELECT u.email, p.role, p.full_name 
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'test@employer.com';
```
