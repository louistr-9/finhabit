-- Bảng liên kết Telegram Chat ID với Supabase User
CREATE TABLE IF NOT EXISTS public.telegram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_chat_id BIGINT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_name TEXT,
  linked_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (Edge Function uses service role key)
CREATE POLICY "Service role full access" ON public.telegram_users
  FOR ALL USING (true) WITH CHECK (true);

-- Index for fast lookup by chat_id
CREATE INDEX idx_telegram_users_chat_id ON public.telegram_users(telegram_chat_id);
