-- 1. user_role enum ga ISH_BERUVCHI qo'shish
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'ISH_BERUVCHI';

-- 2. employers (ish beruvchilar) jadvalini yaratish
CREATE TABLE IF NOT EXISTS public.employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ADMIN va MANAGER employers ni ko'rishi mumkin"
ON public.employers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('ADMIN', 'MANAGER')
  )
);

CREATE POLICY "ADMIN employers ni boshqarishi mumkin"
ON public.employers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- 3. employer_transactions (ish beruvchi bilan moliyaviy operatsiyalar) jadvali
CREATE TABLE IF NOT EXISTS public.employer_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employers(id) ON DELETE CASCADE,
  incoming_job_id UUID REFERENCES public.incoming_jobs(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('received', 'payment')),
  quantity INTEGER DEFAULT 0,
  price_per_unit NUMERIC(12, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12, 2) DEFAULT 0,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employer_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ADMIN va MANAGER tranzaksiyalarni ko'rishi mumkin"
ON public.employer_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('ADMIN', 'MANAGER')
  )
);

CREATE POLICY "ADMIN va MANAGER tranzaksiya qo'shishi mumkin"
ON public.employer_transactions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('ADMIN', 'MANAGER')
  )
);

CREATE POLICY "ADMIN tranzaksiyani yangilashi mumkin"
ON public.employer_transactions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

CREATE POLICY "ADMIN tranzaksiyani o'chirishi mumkin"
ON public.employer_transactions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- 4. incoming_jobs ga employer_id ustunini qo'shish
ALTER TABLE public.incoming_jobs
  ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES public.employers(id) ON DELETE SET NULL;

-- 5. Notifications (xabarnomalar) jadvali
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info'
    CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_table TEXT,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Foydalanuvchilar o'z xabarnomalarini ko'rishi mumkin"
ON public.notifications FOR SELECT
USING (
  user_id = auth.uid()
  OR (
    user_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'MANAGER')
    )
  )
);

CREATE POLICY "Tizim xabarnoma qo'shishi mumkin"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Foydalanuvchilar xabarnomani o'qilgan deb belgilashi mumkin"
ON public.notifications FOR UPDATE
USING (
  user_id = auth.uid()
  OR (
    user_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'MANAGER')
    )
  )
);

-- 6. Telegram sozlamalari jadvali
CREATE TABLE IF NOT EXISTS public.telegram_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_token TEXT NOT NULL,
  admin_chat_id TEXT NOT NULL,
  webhook_secret TEXT,
  daily_report_time TIME DEFAULT '08:00:00',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Faqat ADMIN telegram sozlamalarini ko'rishi mumkin"
ON public.telegram_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- 7. Updated_at triggerlarini qo'shish
CREATE TRIGGER update_employers_updated_at
  BEFORE UPDATE ON public.employers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employer_transactions_updated_at
  BEFORE UPDATE ON public.employer_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_telegram_settings_updated_at
  BEFORE UPDATE ON public.telegram_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Supabase Realtime notifications uchun yoqish
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
