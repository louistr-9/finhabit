import { redirect } from 'next/navigation';
import { getCachedUser } from '@/utils/supabase/server';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';

import { AIChatbot } from '@/components/AIChatbot';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCachedUser();

  if (!user) {
    redirect('/login');
  }

  const displayName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Người dùng';
  const avatarUrl = user.user_metadata?.avatar_url ?? null;
  const email = user.email ?? '';

  return (
    <>
      <Sidebar displayName={displayName} avatarUrl={avatarUrl} email={email} />
      <main className="pl-0 lg:pl-64 min-h-screen pb-24 lg:pb-0">
        <div className="mx-auto max-w-7xl p-4 sm:p-8">
          {children}
        </div>
      </main>
      <BottomNav />
      <AIChatbot />
    </>
  );
}
