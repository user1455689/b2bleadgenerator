import type { Metadata } from "next";
import "./globals.css";
import { AppSidebar } from "@/components/AppSidebar";

export const metadata: Metadata = {
  title: "Accknown Lead Intelligence | Superadmin Growth Platform",
  description: "AI-Powered B2B Lead Generation & Intelligence Platform for Accknown Cloud ERP Nepal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <AppSidebar />
        <div className="flex-1 ml-64 min-w-0 flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}

