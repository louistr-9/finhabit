'use server';

import { createClient, getCachedUser } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

function getVNTime(date: Date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  type: 'income' | 'expense' | 'saving';
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_month: number | null;
  day_of_week: number | null;
  last_applied_date: string | null;
  is_active: boolean;
  created_at: string;
  asset_id: string | null;
}

// ─── READ ────────────────────────────────────────────────────────────────────

export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recurring transactions:', error.message);
    return [];
  }

  return data as RecurringTransaction[];
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function createRecurringTransaction(payload: {
  title: string;
  amount: number;
  category: string;
  type: 'income' | 'expense' | 'saving';
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_month?: number;
  day_of_week?: number;
  asset_id?: string | null;
}) {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase.from('recurring_transactions').insert({
    user_id: user.id,
    title: payload.title,
    amount: payload.amount,
    category: payload.category,
    type: payload.type,
    frequency: payload.frequency,
    day_of_month: payload.day_of_month ?? null,
    day_of_week: payload.day_of_week ?? null,
    is_active: true,
    last_applied_date: null,
    asset_id: payload.asset_id ?? null,
  });

  if (error) throw new Error('Không thể tạo khoản định kỳ: ' + error.message);
  revalidatePath('/finance');
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export async function toggleRecurringTransaction(id: string, is_active: boolean) {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('recurring_transactions')
    .update({ is_active })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error('Không thể cập nhật: ' + error.message);
  revalidatePath('/finance');
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function deleteRecurringTransaction(id: string) {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('recurring_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error('Không thể xóa khoản định kỳ: ' + error.message);
  revalidatePath('/finance');
}

// ─── AUTO-APPLY ──────────────────────────────────────────────────────────────
// Call this server-side when the finance page loads.
// It finds all active recurring rules that haven't been applied today,
// checks if today satisfies their schedule, and inserts real transactions.

export async function applyDueRecurringTransactions(): Promise<number> {
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) return 0;

  const todayStr = getVNTime(); // YYYY-MM-DD
  const today = new Date(todayStr);
  const dayOfMonth = today.getDate();          // 1-31
  const dayOfWeek = today.getDay();            // 0 (Sun) – 6 (Sat)

  const { data: rules, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error || !rules || rules.length === 0) return 0;

  const toInsert: Array<{
    user_id: string;
    title: string;
    amount: number;
    category: string;
    type: string;
    date: string;
    asset_id: string | null;
  }> = [];

  const toUpdateIds: string[] = [];

  for (const rule of rules) {
    // Skip if already applied today
    if (rule.last_applied_date === todayStr) continue;

    let isDue = false;

    if (rule.frequency === 'daily') {
      isDue = true;
    } else if (rule.frequency === 'weekly') {
      isDue = dayOfWeek === (rule.day_of_week ?? 1);
    } else if (rule.frequency === 'monthly') {
      isDue = dayOfMonth === (rule.day_of_month ?? 1);
    }

    if (isDue) {
      toInsert.push({
        user_id: user.id,
        title: rule.title,
        amount: rule.amount,
        category: rule.category,
        type: rule.type,
        date: todayStr,
        asset_id: rule.asset_id,
      });
      toUpdateIds.push(rule.id);

      if (rule.type === 'saving' && rule.asset_id) {
        await supabase.rpc('increment_asset_value', { p_id: rule.asset_id, p_amount: rule.amount });
      }
    }
  }

  if (toInsert.length === 0) return 0;

  // Insert real transactions
  const { error: insertErr } = await supabase.from('transactions').insert(toInsert);
  if (insertErr) {
    console.error('Error applying recurring transactions:', insertErr.message);
    return 0;
  }

  // Mark rules as applied today
  await supabase
    .from('recurring_transactions')
    .update({ last_applied_date: todayStr })
    .in('id', toUpdateIds);

  return toInsert.length;
}
