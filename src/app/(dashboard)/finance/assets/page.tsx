import { redirect } from 'next/navigation';
import { getCachedUser, createClient } from '@/utils/supabase/server';
import AssetsClient from './AssetsClient';
import type { Asset } from './actions';
import { getBalanceHubData } from '../actions';

export const metadata = {
  title: 'Tài sản | FinHabit',
  description: 'Quản lý và theo dõi các tài sản bạn đang sở hữu.',
};

export default async function AssetsPage() {
  const user = await getCachedUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching assets:', error);
  }

  const initialAssets = (data || []) as Asset[];
  const balanceData = await getBalanceHubData();

  return (
    <AssetsClient initialAssets={initialAssets} cashBalance={balanceData.balance} />
  );
}
