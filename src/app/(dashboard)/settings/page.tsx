import { getCachedUser } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { SettingsClient } from './SettingsClient';

export const metadata = {
  title: 'Tài khoản | FinHabit',
};

export default async function SettingsPage() {
  const user = await getCachedUser();

  if (!user) {
    redirect('/login');
  }

  const initialData = {
    fullName: user.user_metadata?.full_name || '',
    avatarUrl: user.user_metadata?.avatar_url || '',
    initialBalance: user.user_metadata?.initial_balance || 0,
    monthlyBudget: user.user_metadata?.monthly_budget || 0,
    email: user.email || '',
  };

  return <SettingsClient initialData={initialData} />;
}
