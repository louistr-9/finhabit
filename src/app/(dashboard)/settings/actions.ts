'use server';

import { createClient, getCachedUser } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const user = await getCachedUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const fullName = formData.get('full_name') as string;
  const avatarUrl = formData.get('avatar_url') as string;
  const initialBalanceStr = formData.get('initial_balance') as string;
  const initialBalance = Number(initialBalanceStr.replace(/\D/g, '')) || 0;
  const monthlyBudgetStr = formData.get('monthly_budget') as string;
  const monthlyBudget = Number(monthlyBudgetStr?.replace(/\D/g, '')) || 0;

  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: fullName.trim(),
      avatar_url: avatarUrl.trim() || null,
      initial_balance: initialBalance,
      monthly_budget: monthlyBudget,
    }
  });

  if (error) {
    console.error('Error updating profile:', error.message);
    throw new Error('Không thể cập nhật hồ sơ: ' + error.message);
  }

  // Revalidate routes to reflect new data
  revalidatePath('/settings', 'page');
  revalidatePath('/', 'page');
  revalidatePath('/dashboard', 'page');
  revalidatePath('/finance', 'page');
  revalidatePath('/', 'layout');
}
