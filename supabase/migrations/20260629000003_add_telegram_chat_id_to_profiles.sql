-- Add telegram_chat_id to profiles table for seamstresses to check their work via Telegram bot
ALTER TABLE public.profiles
ADD COLUMN telegram_chat_id TEXT;

-- Add comment
COMMENT ON COLUMN public.profiles.telegram_chat_id IS 'Telegram chat ID for seamstress to check their work via bot';

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id ON public.profiles(telegram_chat_id);
