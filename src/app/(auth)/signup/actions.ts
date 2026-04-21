'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const initialBalance = Number(formData.get('initialBalance') || 0);
  const monthlyBudget = Number(formData.get('monthlyBudget') || 5000000);

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        initial_balance: initialBalance,
        monthly_budget: monthlyBudget,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=10b981&color=fff`,
      },
    },
  });

  if (error) {
    redirect('/signup?message=' + encodeURIComponent(error.message));
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
