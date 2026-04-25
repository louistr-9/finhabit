-- Create debts table
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('lent', 'borrowed')) NOT NULL,
    contact_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    paid_amount NUMERIC NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    notes TEXT,
    group_name TEXT,
    status TEXT CHECK (status IN ('active', 'completed')) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add debt_id to transactions to link payments
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Policies for debts
CREATE POLICY "Users can only view their own debts"
    ON public.debts FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own debts"
    ON public.debts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own debts"
    ON public.debts FOR UPDATE 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own debts"
    ON public.debts FOR DELETE 
    USING (auth.uid() = user_id);
