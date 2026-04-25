import { FinanceClient } from './FinanceClient';
import { getBalanceHubData, getMonthlyTransactions } from './actions';
import { applyDueRecurringTransactions, getRecurringTransactions } from './recurringActions';
import { createClient } from '@/utils/supabase/server';

export const metadata = {
  title: 'Tài chính | FinHabit',
  description: 'Quản trị dòng tiền hiệu quả với góc nhìn tổng quan mới.',
};

export default async function FinancePage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Auto-apply any due recurring rules first, then fetch data
  await applyDueRecurringTransactions();

  const [balanceHubData, monthlyTxs, recurringList] = await Promise.all([
    getBalanceHubData(),
    getMonthlyTransactions(year, month),
    getRecurringTransactions(),
  ]);
  
  // Fetch saving assets for the dropdown
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  let savingAssets: any[] = [];
  
  if (user.user) {
    const { data } = await supabase
      .from('assets')
      .select('id, name, value')
      .eq('user_id', user.user.id)
      .eq('type', 'saving')
      .order('created_at', { ascending: false });
    savingAssets = data || [];
  }

  return (
    <FinanceClient 
      initialBalanceInfo={balanceHubData}
      initialTransactions={monthlyTxs}
      initialYear={year}
      initialMonth={month}
      initialRecurring={recurringList}
      savingAssets={savingAssets}
    />
  );
}
