'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Coins } from 'lucide-react';
import { cn, formatIDR } from '@/lib/utils';

/**
 * Popup perayaan setelah aksi berhasil (pemasukan ditambahkan, struk hasil scan AI disimpan).
 * Dipasang di root layout supaya tetap tampil walau halaman berpindah (scan -> dashboard).
 */
export type JenisPerayaan = 'pemasukan' | 'scan';

export interface Perayaan {
  jenis: JenisPerayaan;
  nominal: number;
  judul: string;
  keterangan?: string;
  /** Pemasukan/pengeluaran dari hasil scan, menentukan tanda +/- pada nominal */
  tipe?: 'income' | 'expense';
}

interface CelebrationContextType {
  rayakan: (perayaan: Perayaan) => void;
}

const CelebrationContext = createContext<CelebrationContextType | undefined>(undefined);

const DURASI_MS = 4200;

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [aktif, setAktif] = useState<(Perayaan & { id: number }) | null>(null);

  const rayakan = useCallback((perayaan: Perayaan) => {
    setAktif({ ...perayaan, id: Date.now() });
  }, []);

  return (
    <CelebrationContext.Provider value={{ rayakan }}>
      {children}
      {aktif && <PopupPerayaan key={aktif.id} data={aktif} onTutup={() => setAktif(null)} />}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const ctx = useContext(CelebrationContext);
  if (!ctx) throw new Error('useCelebration harus dipakai di dalam CelebrationProvider');
  return ctx;
}

function PopupPerayaan({ data, onTutup }: { data: Perayaan; onTutup: () => void }) {
  const [keluar, setKeluar] = useState(false);
  const nominal = useHitungNaik(data.nominal);
  const tombolRef = useRef<HTMLButtonElement>(null);
  const pemasukan = data.jenis === 'pemasukan';
  const tanda = (data.tipe ?? (pemasukan ? 'income' : 'expense')) === 'income' ? '+ ' : '- ';

  const tutup = useCallback(() => {
    setKeluar(true);
    window.setTimeout(onTutup, 320);
  }, [onTutup]);

  useEffect(() => {
    const timer = window.setTimeout(tutup, DURASI_MS);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && tutup();
    document.addEventListener('keydown', esc);
    tombolRef.current?.focus({ preventScroll: true });
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', esc);
    };
  }, [tutup]);

  return createPortal(
    <div
      className={cn('rayakan glass-overlay', pemasukan ? 'is-pemasukan' : 'is-scan', keluar && 'is-keluar')}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rayakanJudul"
      onClick={tutup}
    >
      <Hujan jenis={data.jenis} />

      <div className="rayakan-kartu glass-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rayakan-visual" aria-hidden="true">
          <span className="rayakan-riak" />
          <span className="rayakan-riak rayakan-riak-2" />
          <span className="rayakan-lingkar">
            <svg viewBox="0 0 52 52">
              <path d="M14 27.5l8.2 8.2L38.5 18" />
            </svg>
          </span>
          <Sparkles className="rayakan-kilau k1" />
          <Sparkles className="rayakan-kilau k2" />
          {pemasukan ? <Coins className="rayakan-kilau k3" /> : <Sparkles className="rayakan-kilau k3" />}
        </div>

        <span className="rayakan-label">
          {pemasukan ? 'Pemasukan tercatat' : (<><Sparkles className="w-3.5 h-3.5" /> Hasil Scan AI tersimpan</>)}
        </span>
        <h2 id="rayakanJudul" className="rayakan-judul">{data.judul}</h2>
        <p className={cn('rayakan-nominal', tanda === '+ ' ? 'is-masuk' : 'is-keluar-uang')}>
          {tanda}
          {formatIDR(nominal)}
        </p>
        {data.keterangan && <p className="rayakan-ket">{data.keterangan}</p>}

        <button ref={tombolRef} type="button" className="rayakan-tombol" onClick={tutup}>
          Mantap!
        </button>
        <span className="rayakan-waktu" style={{ animationDuration: `${DURASI_MS}ms` }} aria-hidden="true" />
      </div>
    </div>,
    document.body
  );
}

/** Nominal naik dari 0 ke target (ease-out); langsung tampil penuh bila pengguna memilih kurangi animasi */
function useHitungNaik(target: number, durasi = 1100) {
  const [nilai, setNilai] = useState(0);

  useEffect(() => {
    const kurangiGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    const mulai = performance.now();
    const langkah = (sekarang: number) => {
      const t = kurangiGerak ? 1 : Math.min(1, (sekarang - mulai) / durasi);
      setNilai(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(langkah);
    };
    frame = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(frame);
  }, [target, durasi]);

  return nilai;
}

/** Koin & confetti (pemasukan) atau kilau AI (scan) yang jatuh di belakang kartu */
function Hujan({ jenis }: { jenis: JenisPerayaan }) {
  // Posisi acak dibuat sekali saat popup muncul (hanya di browser, popup tidak dirender di server)
  const [butir] = useState(() =>
    Array.from({ length: jenis === 'pemasukan' ? 46 : 38 }, (_, i) => ({
      kiri: Math.random() * 100,
      tunda: Math.random() * 0.9,
      durasi: 1.8 + Math.random() * 1.6,
      geser: Math.random() * 140 - 70,
      putar: Math.random() * 720 - 360,
      ukuran: 6 + Math.random() * 8,
      bentuk: jenis === 'pemasukan' ? (i % 3 === 0 ? 'koin' : 'kertas') : i % 2 === 0 ? 'bintang' : 'kertas',
      warna: (jenis === 'pemasukan'
        ? ['#fbbf24', '#34d399', '#22d3ee', '#a78bfa', '#f472b6']
        : ['#22d3ee', '#818cf8', '#c084fc', '#38bdf8', '#e879f9'])[i % 5],
    }))
  );

  return (
    <div className="rayakan-hujan" aria-hidden="true">
      {butir.map((b, i) => (
        <i
          key={i}
          className={`is-${b.bentuk}`}
          style={{
            left: `${b.kiri}vw`,
            width: b.bentuk === 'kertas' ? b.ukuran * 0.7 : b.ukuran * 1.4,
            height: b.bentuk === 'kertas' ? b.ukuran * 1.3 : b.ukuran * 1.4,
            background: b.bentuk === 'koin' ? undefined : b.warna,
            animationDelay: `${b.tunda}s`,
            animationDuration: `${b.durasi}s`,
            ['--geser' as string]: `${b.geser}px`,
            ['--putar' as string]: `${b.putar}deg`,
          }}
        />
      ))}
    </div>
  );
}
