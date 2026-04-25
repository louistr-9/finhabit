'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type DebtType = 'lent' | 'borrowed';
export type DebtStatus = 'active' | 'completed';

export interface Debt {
  id: string;
  user_id: string;
  type: DebtType;
  contact_name: string;
  amount: number;
  paid_amount: number;
  date: string;
  due_date: string | null;
  notes: string | null;
  group_name: string | null;
  status: DebtStatus;
  created_at: string;
}

export async function getDebts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching debts:', error);
    return [];
  }

  return data as Debt[];
}

export async function addDebt(data: {
  type: DebtType;
  contact_name: string;
  amount: number;
  date: string;
  due_date?: string | null;
  notes?: string | null;
  group_name?: string | null;
}) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  // 1. Insert the debt
  const { data: newDebt, error: debtError } = await supabase
    .from('debts')
    .insert({
      user_id: user.user.id,
      type: data.type,
      contact_name: data.contact_name,
      amount: data.amount,
      date: data.date,
      due_date: data.due_date || null,
      notes: data.notes || null,
      group_name: data.group_name || null,
      status: 'active',
    })
    .select()
    .single();

  if (debtError) {
    console.error('Error adding debt:', debtError);
    return { success: false, error: debtError.message };
  }

  // 2. Create initial transaction to reflect cash flow change
  // Lent = outflow (expense), Borrowed = inflow (income)
  const txType = data.type === 'lent' ? 'expense' : 'income';
  const txCategory = data.type === 'lent' ? 'Cho vay' : 'Đi vay';
  const txTitle = `${txCategory} - ${data.contact_name}`;

  const { error: txError } = await supabase.from('transactions').insert({
    user_id: user.user.id,
    title: txTitle,
    amount: data.amount,
    category: txCategory,
    type: txType,
    date: data.date,
    debt_id: newDebt.id,
  });

  if (txError) {
    console.error('Error creating transaction for new debt:', txError);
    // Continue anyway, debt was created
  }

  revalidatePath('/finance/debts');
  revalidatePath('/finance');
  revalidatePath('/dashboard');
  
  return { success: true, debt: newDebt };
}

export async function updateDebt(id: string, data: {
  type: DebtType;
  contact_name: string;
  amount: number;
  date: string;
  due_date?: string | null;
  notes?: string | null;
  group_name?: string | null;
}) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('debts')
    .update({
      type: data.type,
      contact_name: data.contact_name,
      amount: data.amount,
      date: data.date,
      due_date: data.due_date || null,
      notes: data.notes || null,
      group_name: data.group_name || null,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating debt:', error);
    return { success: false, error: error.message };
  }

  // Find and update the initial transaction if it exists
  const txType = data.type === 'lent' ? 'expense' : 'income';
  const txCategory = data.type === 'lent' ? 'Cho vay' : 'Đi vay';
  const txTitle = `${txCategory} - ${data.contact_name}`;
  
  await supabase
    .from('transactions')
    .update({
      title: txTitle,
      amount: data.amount,
      category: txCategory,
      type: txType,
      date: data.date,
    })
    .eq('debt_id', id)
    .in('category', ['Cho vay', 'Đi vay']);

  revalidatePath('/finance/debts');
  revalidatePath('/finance');
  revalidatePath('/dashboard');
  
  return { success: true };
}

export async function updateDebtPayment(id: string, paymentAmount: number, paymentDate: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  // 1. Get current debt
  const { data: debt, error: fetchError } = await supabase
    .from('debts')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !debt) {
    return { success: false, error: 'Debt not found' };
  }

  const newPaidAmount = Number(debt.paid_amount) + Number(paymentAmount);
  const isCompleted = newPaidAmount >= Number(debt.amount);

  // 2. Update debt record
  const { error: updateError } = await supabase
    .from('debts')
    .update({
      paid_amount: newPaidAmount,
      status: isCompleted ? 'completed' : 'active',
    })
    .eq('id', id);

  if (updateError) {
    console.error('Error updating debt:', updateError);
    return { success: false, error: updateError.message };
  }

  // 3. Create transaction for the payment
  // Lent payment (Thu nợ) = inflow (income)
  // Borrowed payment (Trả nợ) = outflow (expense)
  const txType = debt.type === 'lent' ? 'income' : 'expense';
  const txCategory = debt.type === 'lent' ? 'Thu nợ' : 'Trả nợ';
  const txTitle = `${txCategory} - ${debt.contact_name}`;

  await supabase.from('transactions').insert({
    user_id: user.user.id,
    title: txTitle,
    amount: paymentAmount,
    category: txCategory,
    type: txType,
    date: paymentDate,
    debt_id: debt.id,
  });

  revalidatePath('/finance/debts');
  revalidatePath('/finance');
  revalidatePath('/dashboard');

  return { success: true };
}

export async function deleteDebt(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('debts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting debt:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/finance/debts');
  revalidatePath('/finance');
  revalidatePath('/dashboard');
  
  return { success: true };
}
