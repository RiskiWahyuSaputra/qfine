'use client';

import { useCallback } from 'react';
import type React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { arahNavigasi } from '@/lib/navigasi';

/** Dikirim AppShell setelah halaman baru tampil; detail = pathname */
export const EVENT_HALAMAN_SIAP = 'qfine:halaman-siap';
/** Batas tunggu halaman baru sebelum animasi tetap dijalankan (halaman lambat dimuat) */
const BATAS_TUNGGU_MS = 1200;

type StartViewTransition = (opsi: { update: () => Promise<void>; types: string[] } | (() => Promise<void>)) => unknown;

/**
 * onClick untuk tautan menu: pindah halaman di dalam View Transition browser supaya konten
 * bergeser halus sesuai arah menu (lib/navigasi). Dipakai langsung, bukan <ViewTransition> React,
 * karena navigasi dengan cacheComponents tidak memicu transisi React. Browser tanpa dukungan,
 * klik dengan tombol pengubah, atau pengguna "kurangi gerak" memakai navigasi biasa.
 */
export function useNavigasiHalus() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (e: React.MouseEvent, href: string) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const mulai = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition;
      if (href === pathname || typeof mulai !== 'function') return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      e.preventDefault();
      const update = () =>
        new Promise<void>((selesai) => {
          const batas = window.setTimeout(akhiri, BATAS_TUNGGU_MS);
          function akhiri() {
            window.clearTimeout(batas);
            window.removeEventListener(EVENT_HALAMAN_SIAP, siap);
            selesai();
          }
          function siap(ev: Event) {
            if ((ev as CustomEvent<string>).detail === href) akhiri();
          }
          window.addEventListener(EVENT_HALAMAN_SIAP, siap);
          router.push(href);
        });

      try {
        mulai.call(document, { update, types: arahNavigasi(pathname, href) });
      } catch {
        // Safari 18.0/18.1: belum mendukung "types", cukup crossfade
        mulai.call(document, update);
      }
    },
    [router, pathname]
  );
}
