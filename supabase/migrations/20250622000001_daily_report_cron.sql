-- Kunlik Telegram hisobot uchun pg_cron (ixtiyoriy)
-- Supabase Dashboard > Database > Extensions da pg_cron va pg_net yoqilgan bo'lishi kerak.
-- YOUR_PROJECT va YOUR_ANON_KEY ni loyiha .env dagi qiymatlar bilan almashtiring.

-- SELECT cron.schedule(
--   'sfa-daily-report',
--   '0 3 * * *',
--   $$
--     SELECT net.http_post(
--       url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-daily-report',
--       headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb,
--       body := '{}'::jsonb
--     )
--   $$
-- );

-- Yoki Supabase Dashboard > Edge Functions > Cron orqali:
-- URL: https://YOUR_PROJECT.supabase.co/functions/v1/send-daily-report
-- Schedule: 0 3 * * *  (UTC 03:00 = Toshkent 08:00)
