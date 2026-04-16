'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { GoogleGenAI } from '@google/genai';

// Fetch all habits and their log status for a specific date (default today)
export async function getDailyHabits(dateStr?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // If no date provided, use today local time (adjust as needed via client, but server side 'today' in UTC might not exactly match local, so we accept dateStr from client if possible, default 'today')
  let today = dateStr;
  if (!today) {
    const nowLocal = new Date();
    // Vd: '2026-04-16' in local timezone. We assume GMT+7 given context
    const offset = 7 * 60 * 60 * 1000;
    const localDate = new Date(nowLocal.getTime() + offset);
    today = localDate.toISOString().split('T')[0];
  }

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

  // 2. Fetch logs for today
  const { data: logs, error: logsErr } = await supabase
    .from('habit_logs')
    .select('habit_id, completed')
    .eq('date', today);

  if (logsErr) {
    console.error('Error fetching habit logs:', logsErr);
    return [];
  }

  const logMap = new Map(logs?.map(l => [l.habit_id, l.completed]));

  // For streak calculation, realistically we'd need a more complex query. 
  // For simplicity, we just return basic info here. You can expand streak logic later.
  return habits.map(h => ({
    id: h.id,
    name: h.name,
    icon: h.icon || 'BookOpen', // Fallback icon name
    color: h.color || 'text-indigo-600',
    bg: 'bg-slate-100', // Basic bg
    streak: Math.floor(Math.random() * 5), // Mock streak for now, needs DB historic scan
    done: logMap.get(h.id) === true
  }));
}

export async function toggleHabit(habitId: string, isDone: boolean, dateStr?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  let today = dateStr;
  if (!today) {
    const nowLocal = new Date();
    const offset = 7 * 60 * 60 * 1000;
    const localDate = new Date(nowLocal.getTime() + offset);
    today = localDate.toISOString().split('T')[0];
  }

  // Upsert into habit_logs
  // Note: UPSERT in Supabase requires unique constraint. In schema: UNIQUE(habit_id, date) -- wait, does schema have user_id in UNIQUE? 
  // Schema has: UNIQUE(habit_id, date). This is safe as long as habit_id is unique per user (it is).
  const { error } = await supabase
    .from('habit_logs')
    .upsert(
      { 
        habit_id: habitId, 
        user_id: user.id, 
        date: today, 
        completed: isDone 
      },
      { onConflict: 'habit_id,date' }
    );

  if (error) {
    console.error('Error toggling habit:', error);
    throw new Error('Could not toggle habit');
  }

  // revalidate both dashboard and habit paths
  revalidatePath('/dashboard');
  revalidatePath('/habit');
}

export async function addHabit(
  name: string, 
  icon: string, 
  color: string, 
  description?: string, 
  frequency?: any, 
  reminderTime?: string, 
  linkedCategory?: string,
  goalValue?: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
      goal_value: goalValue || null
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
  "goal_value": number (Giá trị mục tiêu nếu có, VD: uống 2L nước -> 2. Nếu không có để 0),
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
    
    return JSON.parse(outputText);
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
  const { data: { user } } = await supabase.auth.getUser();
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
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
