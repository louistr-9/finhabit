'use server';

import { createClient } from '@/utils/supabase/server';
import { getDailyHabits } from '../habit/actions';

export async function getDashboardOverview() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      chartData: [],
      quickStats: { balance: 0, monthlySpent: 0, habitCount: '0/0', streak: 0 },
      habits: []
    };
  }

  const currentDate = new Date();
  // Ensure we use VN timezone for date boundaries if needed
  const offset = 7 * 60 * 60 * 1000;
  const localCurrentDate = new Date(currentDate.getTime() + offset);
  
  const year = localCurrentDate.getUTCFullYear();
  const month = localCurrentDate.getUTCMonth() + 1;
  const todayStr = localCurrentDate.toISOString().split('T')[0];

  // 1. Fetch habits for today
  const habits = await getDailyHabits(todayStr);
  const doneHabitsCount = habits.filter(h => h.done).length;
  const totalHabits = habits.length;

  // 2. Fetch transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, type, date')
    .order('date', { ascending: true });

  let balance = 0;
  let monthlySpent = 0;

  // For Chart (Last 7 days)
  const last7DaysMap = new Map<string, { income: number; spend: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(localCurrentDate.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = d.toISOString().split('T')[0];
    last7DaysMap.set(dateKey, { income: 0, spend: 0 });
  }

  if (transactions) {
    transactions.forEach(t => {
      // Balance
      if (t.type === 'income') balance += t.amount;
      else balance -= t.amount;

      // Monthly Spent
      const [y, m] = t.date.split('-');
      if (parseInt(y) === year && parseInt(m) === month && t.type === 'expense') {
        monthlySpent += t.amount;
      }

      // Chart Data
      if (last7DaysMap.has(t.date)) {
        const current = last7DaysMap.get(t.date)!;
        if (t.type === 'income') current.income += t.amount;
        else current.spend += t.amount;
        last7DaysMap.set(t.date, current);
      }
    });
  }

  const chartData = Array.from(last7DaysMap.entries()).map(([dateStr, values]) => {
    // Convert 'YYYY-MM-DD' to short string like 'T2', 'T3', or just '15/4'
    const d = new Date(dateStr);
    const dayName = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
    return {
      name: dayName,
      income: values.income,
      spend: values.spend
    };
  });

  return {
    chartData,
    quickStats: {
      balance,
      monthlySpent,
      habitCount: `${doneHabitsCount}/${totalHabits}`,
      streak: 0 // Simplification for now
    },
    habits
  };
}
