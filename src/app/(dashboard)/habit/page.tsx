import { getDailyHabits } from './actions';
import HabitClient from './HabitClient';

export default async function HabitPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }); // YYYY-MM-DD
  const selectedDate = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;

  const habits = await getDailyHabits(selectedDate);

  return <HabitClient initialHabits={habits} dateStr={selectedDate} />;
}
