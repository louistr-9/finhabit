import { getDailyHabits } from './actions';
import HabitClient from './HabitClient';

export default async function HabitPage() {
  const currentDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }); // YYYY-MM-DD
  const habits = await getDailyHabits(currentDate);

  return <HabitClient initialHabits={habits} dateStr={currentDate} />;
}
