'use server';

import { createClient, getCachedUser } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { GoogleGenAI } from '@google/genai';

// Helper to get consistent date string for VN (GMT+7)
function getVNTime(date: Date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
}

// Fetch all habits and their log status for a specific date (default today)
export async function getDailyHabits(dateStr?: string) {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) return [];

  let today = dateStr || getVNTime();

  // 1. Fetch habits
  const { data: habits, error: habitsErr } = await supabase
    .from('habits')
    .select('*')
    .order('created_at', { ascending: true });

  if (habitsErr) {
    console.error('Error fetching habits:', habitsErr);
    return [];
  }

  if (!habits || habits.length === 0) return [];

  // 2. Fetch logs for chosen date
  const { data: logs, error: logsErr } = await supabase
    .from('habit_logs')
    .select('habit_id, completed, current_value, date')
    .eq('date', today);

  if (logsErr) {
    console.error('Error fetching habit logs:', logsErr);
    return [];
  }

  // Normalize date comparison: ensure database date matches today string
  const logMap = new Map();
  logs?.forEach(l => {
    const normalizedDate = typeof l.date === 'string' ? l.date.slice(0, 10) : getVNTime(new Date(l.date));
    if (normalizedDate === today) {
      logMap.set(l.habit_id, { done: l.completed, val: l.current_value });
    }
  });

  return habits.map(h => {
    const log = logMap.get(h.id);
    return {
      id: h.id,
      name: h.name,
      group_name: h.group_name || null,
      icon: h.icon || 'BookOpen',
      color: h.color || 'text-indigo-600',
      unit: h.unit || 'lần',
      goal_value: h.goal_value || 1,
      current_value: log?.val || 0,
      done: log?.done || false
    };
  });
}

export async function toggleHabit(habitId: string, isDone: boolean, dateStr?: string) {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) throw new Error('Unauthorized');

  const targetDate = dateStr || getVNTime();

  // If done, we might want to set current_value to goal_value
  // Fetch the habit to know the goal_value
  const { data: habit } = await supabase.from('habits').select('goal_value').eq('id', habitId).single();
  const goal = habit?.goal_value || 1;

  const { error } = await supabase
    .from('habit_logs')
    .upsert(
      { 
        habit_id: habitId, 
        user_id: user.id, 
        date: targetDate, 
        completed: isDone,
        current_value: isDone ? goal : 0
      },
      { onConflict: 'habit_id,date' }
    );

  if (error) {
    console.error('Error toggling habit:', error);
    throw new Error('Could not toggle habit');
  }

  revalidatePath('/dashboard');
  revalidatePath('/habit');
  revalidatePath('/');
}

export async function updateHabitValue(habitId: string, value: number, goal: number, dateStr?: string, forceSkip: boolean = false) {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) throw new Error('Unauthorized');

  const targetDate = dateStr || getVNTime();

  const isDone = forceSkip ? true : value >= (goal || 1);

  const { error } = await supabase
    .from('habit_logs')
    .upsert(
      { 
        habit_id: habitId, 
        user_id: user.id, 
        date: targetDate, 
        current_value: value,
        completed: isDone
      },
      { onConflict: 'habit_id,date' }
    );

  if (error) {
    console.error('Error updating habit value:', error);
    throw new Error('Could not update habit');
  }

  revalidatePath('/dashboard');
  revalidatePath('/habit');
  revalidatePath('/');
}

export async function addHabit(
  name: string, 
  icon: string, 
  color: string, 
  description?: string, 
  frequency?: any, 
  reminderTime?: string, 
  linkedCategory?: string,
  goalValue?: number,
  unit?: string,
  groupName?: string
) {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      name,
      icon,
      color,
      description,
      frequency: frequency || { type: 'daily' },
      reminder_time: reminderTime || null,
      linked_finance_category: linkedCategory || null,
      goal_value: goalValue || 1,
      unit: unit || 'lần',
      group_name: groupName || null
    });

  if (error) {
    console.error('Error adding habit:', error);
    throw new Error('Could not add habit');
  }

  revalidatePath('/habit');
  revalidatePath('/dashboard');
}

export async function aiSuggestHabit(promptInput: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !promptInput.trim()) return null;

  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `Role: Bạn là chuyên gia tư vấn xây dựng thói quen khoa học (Habit Coach).
Task: Dựa trên mong muốn của người dùng, đề xuất 1 thói quen cụ thể.

Danh sách Icon khả dụng: [BookOpen, Dumbbell, Coffee, Heart, Brain, Sparkles, Droplets, Target, Moon, Sun, Apple, Zap, Music, Camera]
Danh sách Màu khả dụng (Tailwind text class): [text-emerald-500, text-indigo-500, text-rose-500, text-amber-500, text-cyan-500, text-violet-500, text-orange-500]

Định dạng đầu ra (JSON duy nhất):
{
  "name": "Tên thói quen (VD: Đọc sách, Tập Gym)",
  "description": "Mục tiêu cụ thể (VD: 10 trang mỗi ngày, 30 phút buổi sáng)",
  "icon": "Tên icon chính xác từ danh sách trên",
  "color": "Tên class màu chính xác từ danh sách trên",
  "goal_value": number (Giá trị mục tiêu nếu có, VD: uống 2L nước -> 2000. Đọc sách -> 1. Mặc định 1),
  "unit": "Đơn vị đo (VD: ml, phút, trang, lần)",
  "group_name": "Tên nhóm thói quen (VD: Thể thao, Học tập, Sức khỏe)",
  "frequency": {"type": "daily"}
}

Ràng buộc:
- Ngôn ngữ: Tiếng Việt.
- KHÔNG trả về văn bản giải thích. Không bọc trong code block.
- JSON phải parse được ngay.

Người dùng nói: "${promptInput}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    let outputText = response.text?.trim() || '{}';
    outputText = outputText.replace(/^```json/, '').replace(/```$/, '').replace(/^```/, '').trim();
    
    const data = JSON.parse(outputText);
    return {
      ...data,
      group_name: data.group_name || ""
    };
  } catch (error) {
    console.error('AI Suggestion Error:', error);
    return null;
  }
}

// Bổ sung helper để tính tổng số habit done cho dashboard / thẻ progress
export async function getDashboardHabitStats(dateStr?: string) {
  const habits = await getDailyHabits(dateStr);
  const doneCount = habits.filter(h => h.done).length;
  const total = habits.length;
  return { 
    habits, // Trả luôn list để hiển thị trên dashboard
    doneCount, 
    total 
  };
}

export async function deleteHabit(id: string) {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting habit:', error);
    throw new Error('Could not delete habit');
  }

  revalidatePath('/habit');
  revalidatePath('/dashboard');
}

export async function updateHabit(
  id: string,
  updates: {
    name?: string;
    icon?: string;
    color?: string;
    description?: string;
    frequency?: any;
    reminder_time?: string;
    linked_finance_category?: string;
    goal_value?: number;
    unit?: string;
    group_name?: string;
  }
) {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating habit:', error);
    throw new Error('Could not update habit');
  }

  revalidatePath('/habit');
  revalidatePath('/dashboard');
}

export async function getHabitMonthlyHistory(habitId: string) {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) return [];

  const todayStr = getVNTime();
  const localToday = new Date(); // Intl handles the zone for the string, but for Date operations we should be careful.
  
  // Fetch last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = getVNTime(thirtyDaysAgo);

  const { data: logs, error } = await supabase
    .from('habit_logs')
    .select('date, current_value, completed')
    .eq('habit_id', habitId)
    .gte('date', startDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching habit history:', error);
    return [];
  }

  return logs || [];
}
export async function getHabitAchievements() {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) return { longestStreak: 0, todayCompletionRate: 0, globalHistory: [] };

  const todayStr = getVNTime();
  const localToday = new Date();
  
  // Fetch all user habits
  const { data: habits } = await supabase
    .from('habits')
    .select('id')
    .eq('user_id', user.id);

  if (!habits || habits.length === 0) {
    return { longestStreak: 0, currentStreak: 0, todayCompletionRate: 0, globalHistory: [] };
  }

  const habitIds = habits.map(h => h.id);

  // Fetch all logs (limit to last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const startDate = getVNTime(ninetyDaysAgo);

  const { data: logs } = await supabase
    .from('habit_logs')
    .select('habit_id, date, completed')
    .in('habit_id', habitIds)
    .gte('date', startDate)
    .order('date', { ascending: false });

  if (!logs) return { longestStreak: 0, todayCompletionRate: 0, globalHistory: [] };

  // 1. Today's Completion Rate
  const todayLogs = logs.filter(l => {
    const dStr = typeof l.date === 'string' ? l.date.slice(0, 10) : getVNTime(new Date(l.date));
    return dStr === todayStr && l.completed;
  });
  const todayCompletionRate = habits.length > 0 ? Math.round((todayLogs.length / habits.length) * 100) : 0;

  // Group SUCCESSFUL habit completions per day
  const completionsPerDay = new Map<string, number>();
  logs.forEach(l => {
    if (l.completed) {
      const dStr = typeof l.date === 'string' ? l.date.slice(0, 10) : getVNTime(new Date(l.date));
      completionsPerDay.set(dStr, (completionsPerDay.get(dStr) || 0) + 1);
    }
  });

  // Determine "Success Days" ( >= 50% completion)
  const successDays: string[] = [];
  completionsPerDay.forEach((count, date) => {
    if (count >= habits.length * 0.5) {
      successDays.push(date);
    }
  });
  
  // Sort descending
  successDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let currentStreak = 0;
  let maxStreak = 0;

  if (successDays.length > 0) {
    // Current Streak Logic
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getVNTime(yesterday);

    const hasToday = successDays.includes(todayStr);
    const hasYesterday = successDays.includes(yesterdayStr);

    if (hasToday || hasYesterday) {
      let checkDate = hasToday ? new Date() : yesterday;
      let isStillConsecutive = true;
      while (isStillConsecutive) {
        const dStr = getVNTime(checkDate);
        if (successDays.includes(dStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          isStillConsecutive = false;
        }
      }
    }

    // Longest Streak Logic
    let tempStreak = 0;
    for (let i = 0; i < successDays.length; i++) {
       if (i === 0) {
         tempStreak = 1;
       } else {
         const d1 = new Date(successDays[i-1]);
         const d2 = new Date(successDays[i]);
         const diff = (d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);
         if (diff === 1) {
           tempStreak++;
         } else {
           maxStreak = Math.max(maxStreak, tempStreak);
           tempStreak = 1;
         }
       }
    }
    maxStreak = Math.max(maxStreak, tempStreak);
  }

  // 3. Global History (Last 35 days)
  const globalHistory = [];
  for (let i = 0; i < 35; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    const dStr = getVNTime(d);
    const count = completionsPerDay.get(dStr) || 0;
    
    const ratio = count / habits.length;
    let level = 0;
    if (ratio >= 0.8) level = 4;
    else if (ratio >= 0.5) level = 3;
    else if (ratio >= 0.2) level = 2;
    else if (ratio > 0) level = 1;

    globalHistory.push({ date: dStr, level, count });
  }

  return {
    longestStreak: maxStreak,
    currentStreak: currentStreak,
    todayCompletionRate,
    globalHistory
  };
}

export async function getGlobalHistory(month: number, year: number) {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) return [];

  // First and last day of month
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  // Fetch all user habits to calculate percentages
  const { data: habits } = await supabase
    .from('habits')
    .select('id')
    .eq('user_id', user.id);

  if (!habits || habits.length === 0) return [];

  const { data: logs } = await supabase
    .from('habit_logs')
    .select('date, completed')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate);

  if (!logs) return [];

  const historyMap = new Map<string, number>();
  logs.forEach(l => {
    if (l.completed) {
      historyMap.set(l.date, (historyMap.get(l.date) || 0) + 1);
    }
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const history = [];

  for (let i = 1; i <= daysInMonth; i++) {
    const dStr = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
    const count = historyMap.get(dStr) || 0;
    
    const ratio = count / habits.length;
    let level = 0;
    if (ratio > 0.8) level = 4;
    else if (ratio > 0.5) level = 3;
    else if (ratio > 0.2) level = 2;
    else if (ratio > 0) level = 1;

    history.push({ date: dStr, level, count });
  }

  return history;
}
