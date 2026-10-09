'use client';

import { useEffect, useState } from 'react';

/** Lama animasi masuk sebelum splash mulai menghilang */
const DURASI_MS = 1700;
const KELUAR_MS = 550;

/**
 * Animasi logo saat QFine dibuka dari Layar Utama (mode standalone). Markup ikut dirender server
 * tetapi disembunyikan CSS, dan hanya tampil lewat @media (display-mode: standalone) sehingga tidak
 * berkedip di browser biasa. Berada di root layout: hanya muncul saat aplikasi benar-benar dibuka,
 * bukan saat pindah menu. Pratinjau di browser: tambahkan ?splash=1 di URL.
 */
export function SplashScreen() {
  const [tahap, setTahap] = useState<'tampil' | 'keluar' | 'selesai'>('tampil');

  useEffect(() => {
    const paksa = new URLSearchParams(window.location.search).get('splash') === '1';
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!standalone && !paksa) return; // tetap tersembunyi oleh CSS

    if (paksa) document.documentElement.classList.add('splash-paksa');
    const cepat = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t1 = window.setTimeout(() => setTahap('keluar'), cepat ? 500 : DURASI_MS);
    const t2 = window.setTimeout(() => setTahap('selesai'), (cepat ? 500 : DURASI_MS) + KELUAR_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (tahap === 'selesai') return null;

  return (
    <div className={`splash ${tahap === 'keluar' ? 'is-keluar' : ''}`} aria-hidden="true">
      <div className="splash-isi">
        <div className="splash-ubin">
          <span className="splash-riak" />
          <span className="splash-riak splash-riak-2" />
          {/* eslint-disable-next-line @next/next/no-img-element -- tampil sebelum JS/optimasi gambar siap */}
          <img src="/splash-logo.png" alt="" className="splash-logo" width={220} height={240} />
          <span className="splash-kilau" />
        </div>
        <p className="splash-nama">QFine</p>
        <p className="splash-slogan">Your Money, Clearly Managed</p>
      </div>
    </div>
  );
}
