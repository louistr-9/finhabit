import { redirect } from 'next/navigation';
import { getCachedUser } from '@/utils/supabase/server';
import DashboardClient from '../DashboardClient';
import { getDashboardOverview } from './actions';

export default async function DashboardPage() {
  const user = await getCachedUser();

  if (!user) {
    redirect('/login');
  }

  const overviewData = await getDashboardOverview();

  const displayName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Người dùng';
  const avatarUrl = user.user_metadata?.avatar_url ?? null;
  const email = user.email ?? '';

  return (
    <DashboardClient 
      displayName={displayName} 
      avatarUrl={avatarUrl} 
      email={email}
      overviewData={overviewData} 
    />
  );
}
