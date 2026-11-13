import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Accknown B2B Lead Intelligence | Enterprise Growth Platform",
  description: "AI-Powered B2B Lead Generation & Live Market Intelligence Platform for Accknown Cloud ERP Nepal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
