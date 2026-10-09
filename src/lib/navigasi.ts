/**
 * Urutan menu QFine (sidebar & bottom nav). Dipakai untuk arah animasi pindah halaman:
 * ke menu sesudahnya = maju (konten bergeser ke kiri), ke menu sebelumnya = mundur.
 */
export const URUTAN_MENU = ['/dashboard', '/transactions', '/scan', '/statistics', '/budgets', '/settings'];

export type ArahNavigasi = 'nav-forward' | 'nav-back';

function posisi(path: string) {
  const i = URUTAN_MENU.findIndex((menu) => path === menu || path.startsWith(menu + '/'));
  return i === -1 ? 0 : i;
}

export function arahNavigasi(dari: string, ke: string): ArahNavigasi[] {
  if (dari === ke) return [];
  return [posisi(ke) >= posisi(dari) ? 'nav-forward' : 'nav-back'];
}
