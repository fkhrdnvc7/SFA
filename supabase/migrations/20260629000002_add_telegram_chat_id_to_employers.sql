-- Add telegram_chat_id to employers table for sending notifications
ALTER TABLE public.employers
ADD COLUMN telegram_chat_id TEXT;

-- Add comment
COMMENT ON COLUMN public.employers.telegram_chat_id IS 'Telegram chat ID for sending notifications to employer when jobs are sent out';
