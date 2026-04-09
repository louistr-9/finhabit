'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    // Return encoded error string via URL search params for the client to show
    redirect('/login?message=' + encodeURIComponent(error.message));
  }

  revalidatePath('/', 'layout');
  redirect('/finance');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect('/login?message=' + encodeURIComponent(error.message));
  }

  // Assuming "Confirm email" is turned off, the user is signed in directly.
  revalidatePath('/', 'layout');
  redirect('/finance');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  revalidatePath('/', 'layout');
  redirect('/login');
}
