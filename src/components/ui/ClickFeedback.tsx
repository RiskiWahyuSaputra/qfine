'use client';

import { useEffect } from 'react';

/** Elemen yang dianggap bisa diklik untuk efek riak */
const PEMICU = 'button, a[href], [role="button"], summary, label[for], input[type="checkbox"], input[type="radio"], select';

/**
 * Efek klik halus di seluruh aplikasi: riak cahaya lembut yang membesar dari titik klik.
 * Riak dipasang sebagai elemen fixed di body (bukan di dalam tombol), jadi tidak mengubah
 * posisi/overflow tombol mana pun. Efek "tekan" (mengecil sedikit) diatur di globals.css.
 */
export function ClickFeedback() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const saatTekan = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = (e.target as Element | null)?.closest?.(PEMICU);
      if (!target || (target as HTMLButtonElement).disabled) return;

      const kotak = target.getBoundingClientRect();
      const ukuran = Math.min(Math.max(kotak.width, kotak.height) * 1.6, 220);
      const riak = document.createElement('span');
      riak.className = 'klik-riak';
      riak.style.width = riak.style.height = `${ukuran}px`;
      riak.style.left = `${e.clientX - ukuran / 2}px`;
      riak.style.top = `${e.clientY - ukuran / 2}px`;
      document.body.appendChild(riak);
      riak.addEventListener('animationend', () => riak.remove(), { once: true });
    };

    document.addEventListener('pointerdown', saatTekan, { passive: true });
    return () => document.removeEventListener('pointerdown', saatTekan);
  }, []);

  return null;
}
