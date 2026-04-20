import { redirect } from 'next/navigation';
import { getCachedUser } from '@/utils/supabase/server';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const user = await getCachedUser();

  if (!user) {
    redirect('/login');
  }

  const displayName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Người dùng';
  const avatarUrl = user.user_metadata?.avatar_url ?? null;
  const email = user.email ?? '';

  const mockOverviewData = {
    chartData: [
      { name: 'T2', spend: 400000, income: 1000000 },
      { name: 'T3', spend: 300000, income: 0 },
      { name: 'T4', spend: 500000, income: 200000 },
      { name: 'T5', spend: 200000, income: 0 },
      { name: 'T6', spend: 600000, income: 0 },
      { name: 'T7', spend: 1000000, income: 0 },
      { name: 'CN', spend: 1200000, income: 0 },
    ],
    quickStats: {
      balance: 15000000,
      monthlySpent: 4200000,
      habitCount: '4/5',
      streak: 14,
    },
    habits: [
      { id: '1', name: 'Đọc sách 30 phút', icon: 'BookOpen', color: 'text-indigo-500', bg: 'bg-indigo-50', streak: 14, done: true },
      { id: '2', name: 'Tập thể dục', icon: 'Dumbbell', color: 'text-orange-500', bg: 'bg-orange-50', streak: 5, done: false },
      { id: '3', name: 'Uống đủ 2L nước', icon: 'Droplets', color: 'text-cyan-500', bg: 'bg-cyan-50', streak: 21, done: true },
    ]
  };

  return <DashboardClient displayName={displayName} avatarUrl={avatarUrl} email={email} overviewData={mockOverviewData} />;
}
