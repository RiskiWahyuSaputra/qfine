import type { MetadataRoute } from 'next';

/**
 * Manifest PWA: QFine bisa ditambahkan ke Layar Utama (iPhone: Safari > Bagikan > Tambah ke Layar Utama)
 * dan terbuka layar penuh tanpa bilah alamat/tab browser (display: standalone).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'QFine — Keuangan Pribadi',
    short_name: 'QFine',
    description: 'Pencatatan keuangan pribadi dengan AI receipt scanner.',
    id: '/',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#070b1a',
    theme_color: '#070b1a',
    lang: 'id',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
