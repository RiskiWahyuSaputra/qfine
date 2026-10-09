'use client';

import { useEffect, useState } from 'react';

/**
 * Menjaga elemen tetap dirender sebentar setelah ditutup supaya animasi keluarnya sempat jalan.
 * Mengembalikan [dirender, sedangKeluar].
 */
export function useTampilAnimasi(terbuka: boolean, durasiKeluar = 200): [boolean, boolean] {
  const [dirender, setDirender] = useState(terbuka);
  const [sebelumnya, setSebelumnya] = useState(terbuka);

  // Dibuka: langsung dirender (pola "state dari props sebelumnya", tanpa effect)
  if (terbuka !== sebelumnya) {
    setSebelumnya(terbuka);
    if (terbuka) setDirender(true);
  }

  useEffect(() => {
    if (terbuka || !dirender) return;
    const timer = window.setTimeout(() => setDirender(false), durasiKeluar);
    return () => window.clearTimeout(timer);
  }, [terbuka, dirender, durasiKeluar]);

  return [dirender, dirender && !terbuka];
}
