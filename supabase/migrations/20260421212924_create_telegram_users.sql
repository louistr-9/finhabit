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
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'telegram_users' AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access" ON public.telegram_users
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Index for fast lookup by chat_id
CREATE INDEX IF NOT EXISTS idx_telegram_users_chat_id ON public.telegram_users(telegram_chat_id);
