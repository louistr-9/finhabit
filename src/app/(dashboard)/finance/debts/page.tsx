import { redirect } from 'next/navigation';
import { getCachedUser, createClient } from '@/utils/supabase/server';
import DebtsClient from './DebtsClient';
import type { Debt } from './actions';

export const metadata = {
  title: 'Nợ & Cho vay | FinHabit',
  description: 'Quản lý các khoản nợ phải trả và khoản tiền bạn đã cho người khác vay.',
};

export default async function DebtsPage() {
  const user = await getCachedUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch data directly in the Server Component instead of calling a Server Action during render
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching debts:', error);
  }

  const initialDebts = (data || []) as Debt[];

  return (
    <DebtsClient initialDebts={initialDebts} />
  );
}
