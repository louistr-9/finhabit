-- Kích hoạt extension (tuỳ chọn nhưng RẤT quan trọng cho uuid)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bảng Giao dịch (Finance)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bảng Habits (Thói quen)
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bảng Habit Logs (Lịch sử điểm danh thói quen theo ngày)
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(habit_id, date) -- Mỗi thói quen 1 ngày chỉ điểm danh 1 lần
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for transactions
CREATE POLICY "Users can only view their own transactions"
    ON public.transactions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own transactions"
    ON public.transactions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own transactions"
    ON public.transactions FOR UPDATE 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own transactions"
    ON public.transactions FOR DELETE 
    USING (auth.uid() = user_id);

-- Policies for habits
CREATE POLICY "Users can only view their own habits"
    ON public.habits FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own habits"
    ON public.habits FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own habits"
    ON public.habits FOR UPDATE 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own habits"
    ON public.habits FOR DELETE 
    USING (auth.uid() = user_id);

-- Policies for habit_logs
CREATE POLICY "Users can only view their own habit logs"
    ON public.habit_logs FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own habit logs"
    ON public.habit_logs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own habit logs"
    ON public.habit_logs FOR UPDATE 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own habit logs"
    ON public.habit_logs FOR DELETE 
    USING (auth.uid() = user_id);
