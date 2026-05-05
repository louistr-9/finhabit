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

  // 2. Fetch financial overview from SQL Views
  const [
    { data: overview },
    { data: monthlySummary },
    { data: dailySummary }
  ] = await Promise.all([
    supabase.from('user_financial_overview').select('*').eq('user_id', user.id).single(),
    supabase.from('monthly_transaction_summary').select('*').eq('user_id', user.id).eq('year', year).eq('month', month).single(),
    supabase.from('daily_transaction_summary').select('*').eq('user_id', user.id).order('tx_date', { ascending: false }).limit(7)
  ]);

  const initialBalance = Number(user.user_metadata?.initial_balance) || 0;
  
  const totalIncome = Number(overview?.total_income) || 0;
  const totalExpense = Number(overview?.total_expense) || 0;
  const totalSavings = Number(overview?.total_savings) || 0;
  
  // Balance calculation: initial + income - expense - savings
  const balance = initialBalance + totalIncome - totalExpense - totalSavings;
  const monthlySpent = Number(monthlySummary?.monthly_expense) || 0;

  // For Chart (Last 7 days)
  const last7DaysMap = new Map<string, { income: number; spend: number; saving: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = getVNTime(d);
    last7DaysMap.set(dateKey, { income: 0, spend: 0, saving: 0 });
  }

  if (dailySummary) {
    dailySummary.forEach(d => {
      if (last7DaysMap.has(d.tx_date)) {
        last7DaysMap.set(d.tx_date, {
          income: Number(d.daily_income) || 0,
          spend: Number(d.daily_expense) || 0,
          saving: Number(d.daily_saving) || 0
        });
      }
    });
  }

  const chartData = Array.from(last7DaysMap.entries()).map(([dateStr, values]) => {
    // Convert 'YYYY-MM-DD' to short string like 'T2', 'T3', or just '15/4'
    const [y, m, day] = dateStr.split('-');
    const d = new Date(Number(y), Number(m) - 1, Number(day));
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
