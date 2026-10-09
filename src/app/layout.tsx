import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/ToastProvider';

export const metadata: Metadata = {
  title: 'QFine — Your Money, Clearly Managed',
  description:
    'Aplikasi pencatatan keuangan pribadi modern dengan AI receipt scanner, glassmorphism UI, dan statistik interaktif.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
