-- Optimize Finance Views with Security Invoker (Applies RLS automatically)

-- 1. Tổng quan tài chính người dùng (số dư, tổng tiết kiệm, v.v.)
CREATE OR REPLACE VIEW public.user_financial_overview WITH (security_invoker = true) AS
SELECT 
    user_id,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
    COALESCE(SUM(CASE WHEN type = 'saving' THEN amount ELSE 0 END), 0) AS total_savings
FROM public.transactions
GROUP BY user_id;

-- 2. Tổng quan tài chính theo tháng (Dùng cho Balance Hub)
CREATE OR REPLACE VIEW public.monthly_transaction_summary WITH (security_invoker = true) AS
SELECT 
    user_id,
    EXTRACT(YEAR FROM date) AS year,
    EXTRACT(MONTH FROM date) AS month,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS monthly_income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS monthly_expense,
    COALESCE(SUM(CASE WHEN type = 'saving' THEN amount ELSE 0 END), 0) AS monthly_saving
FROM public.transactions
GROUP BY user_id, EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date);

-- 3. Tổng quan tài chính theo ngày (Dùng cho Chart 7 ngày)
CREATE OR REPLACE VIEW public.daily_transaction_summary WITH (security_invoker = true) AS
SELECT 
    user_id,
    date AS tx_date,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS daily_income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS daily_expense,
    COALESCE(SUM(CASE WHEN type = 'saving' THEN amount ELSE 0 END), 0) AS daily_saving
FROM public.transactions
GROUP BY user_id, date;
