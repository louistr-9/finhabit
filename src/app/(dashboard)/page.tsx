import { redirect } from 'next/navigation';
import { getCachedUser } from '@/utils/supabase/server';
import DashboardClient from './DashboardClient';
import { getBalanceHubData, getWeeklyOverview } from './finance/actions';
import { getDashboardHabitStats, getHabitAchievements } from './habit/actions';

export default async function DashboardPage() {
  const user = await getCachedUser();

  if (!user) {
    redirect('/login');
  }

  const displayName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Người dùng';
  const avatarUrl = user.user_metadata?.avatar_url ?? null;
  const email = user.email ?? '';

  // Fetch real data
  const [balanceHub, weeklyChart, habitStats, achievements] = await Promise.all([
    getBalanceHubData(),
    getWeeklyOverview(),
    getDashboardHabitStats(),
    getHabitAchievements()
  ]);

  const overviewData = {
    chartData: weeklyChart,
    quickStats: {
      balance: balanceHub.balance || 0,
      monthlySpent: balanceHub.monthlySpent || 0,
      habitCount: `${habitStats.doneCount}/${habitStats.total}`,
      streak: achievements.currentStreak || 0,
    },
    habits: habitStats.habits,
  };

  return (
    <DashboardClient 
      displayName={displayName} 
      avatarUrl={avatarUrl} 
      email={email} 
      overviewData={overviewData} 
    />
  );
}
