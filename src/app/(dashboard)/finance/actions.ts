'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getMonthlyTransactions(year: number, month: number) {
  const supabase = await createClient();
  
  // Format dates: 'YYYY-MM-01' to 'YYYY-MM-31'
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  
  return transactions;
}

export async function addTransaction(formData: FormData) {
  const supabase = await createClient();
  
  // Lấy User hiện tại
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  const title = formData.get('title') as string;
  const amountStr = formData.get('amount') as string;
  // Loại bỏ các ký tự không phải số
  const amount = Number(amountStr.replace(/\D/g, '')); 
  const category = formData.get('category') as string;
  const type = formData.get('type') as 'income' | 'expense';
  const date = formData.get('date') as string; // Truyền date dạng YYYY-MM-DD từ client

  const { error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      title,
      amount,
      category,
      type,
      date
    });

  if (error) {
    console.error('Error adding transaction:', error);
    throw new Error('Failed to add transaction');
  }

  // Refresh page data
  revalidatePath('/finance');
}

export async function getBalanceHubData() {
  const supabase = await createClient();
  
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('amount, type');
    
  if (error) {
    console.error('Error fetching balance data:', error);
    return { balance: 0, monthlyIncome: 0 };
  }
  
  let balance = 0;
  let monthlyIncome = 0;
  
  transactions.forEach((t) => {
    if (t.type === 'income') {
      balance += t.amount;
      monthlyIncome += t.amount; // Giả định đơn giản, thực tế cần lọc theo tháng
    } else {
      balance -= t.amount;
    }
  });
  
  return { balance, monthlyIncome };
}
