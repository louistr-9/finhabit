'use server';

import { createClient, getCachedUser } from '@/utils/supabase/server';

const CATEGORY_COLORS: Record<string, string> = {
  'Thiết yếu': '#2563EB', // blue-600
  'Ăn uống': '#D97706', // amber-600
  'Mua sắm': '#9333EA', // purple-600
  'Di chuyển': '#F97316', // orange-500
  'Giải trí': '#EC4899', // pink-500
  'Sức khỏe': '#F43F5E', // rose-500
  'Khác': '#64748B', // slate-500
};

export async function getReportData(year: number, month: number) {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) return { expenseData: [], monthlyData: [] };

  // Fetch all transactions to build historical and current month data
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('amount, type, category, date')
    .order('date', { ascending: true });

  if (error || !transactions) {
    console.error('Error fetching report data:', error);
    return { expenseData: [], monthlyData: [] };
  }

  // 1. Build Expense Data for the current month
  const expenseDataMap = new Map<string, number>();
  
  transactions.forEach(t => {
    const d = new Date(t.date);
    if (d.getFullYear() === year && (d.getMonth() + 1) === month && t.type === 'expense') {
      const current = expenseDataMap.get(t.category) || 0;
      expenseDataMap.set(t.category, current + t.amount);
    }
  });

  const expenseData = Array.from(expenseDataMap.entries()).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Khác']
  })).sort((a, b) => b.value - a.value);

  // 2. Build Monthly Data for the Bar Chart (Last 4-6 months)
  // Just group by YYYY-MM
  const monthlyMap = new Map<string, { thu: number; chi: number }>();
  
  transactions.forEach(t => {
    const [y, m] = t.date.split('-');
    const key = `${y}-${m}`;
    const entry = monthlyMap.get(key) || { thu: 0, chi: 0 };
    if (t.type === 'income') entry.thu += t.amount;
    else entry.chi += t.amount;
    monthlyMap.set(key, entry);
  });

  // Sort chronologically and take last 6 
  const sortedMonths = Array.from(monthlyMap.keys()).sort();
  const recentMonths = sortedMonths.slice(-6);

  const monthlyData = recentMonths.map(key => {
    const [y, m] = key.split('-');
    return {
      name: `T${parseInt(m)}`,
      thu: monthlyMap.get(key)!.thu,
      chi: monthlyMap.get(key)!.chi
    };
  });

  return { expenseData, monthlyData };
}
