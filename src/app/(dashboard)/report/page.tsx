import { getReportData } from './actions';
import ReportClient from './ReportClient';

export default async function ReportPage() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { expenseData, monthlyData } = await getReportData(year, month);

  return <ReportClient initialExpenseData={expenseData} initialMonthlyData={monthlyData} />;
}
