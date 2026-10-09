import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { CelebrationProvider } from '@/components/ui/CelebrationProvider';
import { ClickFeedback } from '@/components/ui/ClickFeedback';
import { SplashScreen } from '@/components/ui/SplashScreen';

export const metadata: Metadata = {
  title: 'QFine — Your Money, Clearly Managed',
  description:
    'Aplikasi pencatatan keuangan pribadi modern dengan AI receipt scanner, glassmorphism UI, dan statistik interaktif.',
  applicationName: 'QFine',
  // Ditambahkan ke Layar Utama iPhone: terbuka layar penuh tanpa UI Safari
  appleWebApp: {
    capable: true,
    title: 'QFine',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  // Next hanya menulis mobile-web-app-capable; iOS lama butuh nama berawalan apple-
  other: { 'apple-mobile-web-app-capable': 'yes' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Konten sampai ke tepi layar (notch & home indicator); jarak aman diatur lewat env(safe-area-inset-*)
  viewportFit: 'cover',
  themeColor: '#070b1a',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen">
        <SplashScreen />
        <ToastProvider>
          <CelebrationProvider>{children}</CelebrationProvider>
          <ClickFeedback />
        </ToastProvider>
      </body>
    </html>
  );
}
