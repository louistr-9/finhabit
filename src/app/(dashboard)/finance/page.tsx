import { FinanceClient } from './FinanceClient';
import { getBalanceHubData, getMonthlyTransactions } from './actions';

export const metadata = {
  title: 'Tài chính | FinHabit',
  description: 'Quản trị dòng tiền hiệu quả với góc nhìn tổng quan mới.',
};

export default async function FinancePage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Fetch initial data on the server
  const [balanceHubData, monthlyTxs] = await Promise.all([
    getBalanceHubData(),
    getMonthlyTransactions(year, month)
  ]);

  return (
    <FinanceClient 
      initialBalanceInfo={balanceHubData}
      initialTransactions={monthlyTxs}
      initialYear={year}
      initialMonth={month}
    />
  );
}
