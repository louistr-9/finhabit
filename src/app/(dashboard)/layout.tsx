import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Sidebar />
      <main className="pl-64 min-h-screen">
        <div className="mx-auto max-w-7xl p-8">
          {children}
        </div>
      </main>
    </>
  );
}
