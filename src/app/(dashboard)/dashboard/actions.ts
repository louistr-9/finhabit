'use server';

import { createClient, getCachedUser } from '@/utils/supabase/server';
import { getDailyHabits, getHabitAchievements } from '../habit/actions';

// Helper to get consistent date string for VN (GMT+7)
function getVNTime(date: Date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
}


export async function getDashboardOverview() {
  const supabase = await createClient();
  const user = await getCachedUser();

  if (!user) {
    return {
      chartData: [],
      quickStats: { balance: 0, monthlySpent: 0, totalSavings: 0, habitCount: '0/0', streak: 0 },
      habits: []
    };
  }

  const todayStr = getVNTime();
  const [yearStr, monthStr] = todayStr.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);


  // 1. Fetch habits for today
  const habits = await getDailyHabits(todayStr);
  const doneHabitsCount = habits.filter(h => h.done).length;
  const totalHabits = habits.length;

  // 2. Fetch transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, type, date')
    .order('date', { ascending: true });

  // Lấy số dư ban đầu từ user metadata
  const initialBalance = Number(user.user_metadata?.initial_balance) || 0;

  let balance = initialBalance;
  let monthlySpent = 0;
  let totalSavings = 0;

  // For Chart (Last 7 days)
  const last7DaysMap = new Map<string, { income: number; spend: number; saving: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = getVNTime(d);
    last7DaysMap.set(dateKey, { income: 0, spend: 0, saving: 0 });
  }


  if (transactions) {
    transactions.forEach(t => {
      // Balance
      if (t.type === 'income') {
        balance += t.amount;
      } else {
        balance -= t.amount;
        if (t.type === 'saving') {
          totalSavings += t.amount;
        }
      }

      // Monthly Spent
      const [y, m] = t.date.split('-');
      if (parseInt(y) === year && parseInt(m) === month && t.type === 'expense') {
        monthlySpent += t.amount;
      }

      // Chart Data
      if (last7DaysMap.has(t.date)) {
        const current = last7DaysMap.get(t.date)!;
        if (t.type === 'income') current.income += t.amount;
        else if (t.type === 'saving') current.saving += t.amount;
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
      spend: values.spend,
      saving: values.saving
    };
  });

  const achievements = await getHabitAchievements();

  return {
    chartData,
    quickStats: {
      balance,
      monthlySpent: monthlySpent || 0,
      totalSavings: totalSavings || 0,
      habitCount: `${doneHabitsCount}/${totalHabits}`,
      streak: achievements.currentStreak || 0,
      monthlyBudget: Number(user.user_metadata?.monthly_budget) || 0,
    },
    habits
  };

}
