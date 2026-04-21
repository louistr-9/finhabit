import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-sans', display: 'swap', preload: true });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-heading', display: 'swap', preload: true });

export const metadata: Metadata = {
  title: "FinHabit - Manage Finance & Habits",
  description: "A professional web application for tracking finances and building habits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          id="theme-script"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `try{const s=localStorage.getItem('theme');const t=s?JSON.parse(s):'light';if(t==='dark'||t==='warm')document.documentElement.classList.add(t);}catch(e){}`,
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${outfit.variable} antialiased bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300`}>
        {children}
      </body>
    </html>
  );
}
