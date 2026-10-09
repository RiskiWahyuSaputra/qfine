'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Bell,
  BellRing,
  AlertTriangle,
  PiggyBank,
  TrendingDown,
  ArrowDownLeft,
  Sparkles,
  PencilLine,
  CheckCheck,
} from 'lucide-react';
import { cn, formatIDR } from '@/lib/utils';
import type { Budget, Transaction } from '@/types/database';

/**
 * Notifikasi QFine dihitung dari data keuangan sendiri (tanpa server notifikasi):
 * anggaran hampir/sudah habis, pengeluaran melebihi pemasukan, pemasukan & hasil Scan AI
 * terbaru, dan pengingat bila belum ada catatan hari ini. Status "sudah dibaca" disimpan
 * di localStorage (QFine dipakai pribadi, cukup per perangkat).
 */
type Tingkat = 'bahaya' | 'peringatan' | 'sukses' | 'info';

interface Notifikasi {
  id: string;
  tingkat: Tingkat;
  ikon: React.ElementType;
  judul: string;
  isi: string;
  waktu: string;
  href: string;
}

const KUNCI_DIBACA = 'qfine.notifikasi.dibaca';
const HARI_TERBARU = 3;

export function NotificationBell() {
  const [buka, setBuka] = useState(false);
  const [daftar, setDaftar] = useState<Notifikasi[]>([]);
  const [dibaca, setDibaca] = useState<string[]>([]);
  const [memuat, setMemuat] = useState(true);
  const wadahRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Panel di-portal ke body (topbar memakai backdrop-filter sehingga blur & position:fixed di
  // dalamnya terkurung); posisinya mengikuti tombol lonceng
  const [posisi, setPosisi] = useState<{ top: number; right: number } | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      setDaftar(await susunNotifikasi());
    } catch {
      // Data belum bisa dimuat: lonceng tetap tampil tanpa notifikasi
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    // Status dibaca & data awal dimuat setelah mount (localStorage hanya ada di browser);
    // state diubah di callback async, bukan langsung di dalam effect
    Promise.resolve().then(() => setDibaca(bacaTersimpan()));
    susunNotifikasi()
      .then(setDaftar)
      .catch(() => {})
      .finally(() => setMemuat(false));
  }, []);

  // Tutup saat klik di luar panel atau tekan Esc
  useEffect(() => {
    if (!buka) return;
    const luar = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!wadahRef.current?.contains(t) && !panelRef.current?.contains(t)) setBuka(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setBuka(false);
    const ukur = () => {
      const kotak = wadahRef.current?.getBoundingClientRect();
      if (kotak) setPosisi({ top: kotak.bottom + 10, right: window.innerWidth - kotak.right });
    };
    ukur();
    document.addEventListener('pointerdown', luar);
    document.addEventListener('keydown', esc);
    window.addEventListener('resize', ukur);
    window.addEventListener('scroll', ukur, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', luar);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('resize', ukur);
      window.removeEventListener('scroll', ukur);
    };
  }, [buka]);

  const belumDibaca = useMemo(() => daftar.filter((n) => !dibaca.includes(n.id)), [daftar, dibaca]);

  const simpanDibaca = (ids: string[]) => {
    // Hanya id yang masih relevan yang disimpan, supaya localStorage tidak terus membesar
    const semua = [...new Set([...dibaca, ...ids])].filter((id) => daftar.some((n) => n.id === id));
    setDibaca(semua);
    try {
      localStorage.setItem(KUNCI_DIBACA, JSON.stringify(semua));
    } catch {
      // Penyimpanan diblokir browser: status dibaca hanya berlaku sampai halaman dimuat ulang
    }
  };

  const toggle = () => {
    if (!buka) void muat();
    setBuka((v) => !v);
  };

  return (
    <div ref={wadahRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        className={cn('p-2.5 rounded-xl glass-card text-slate-400 hover:text-white relative', buka && 'text-white border-cyan-400/40')}
        aria-label={belumDibaca.length ? `Notifikasi, ${belumDibaca.length} belum dibaca` : 'Notifikasi'}
        aria-expanded={buka}
        aria-haspopup="dialog"
      >
        {belumDibaca.length ? <BellRing className="w-4 h-4 notif-goyang" /> : <Bell className="w-4 h-4" />}
        {belumDibaca.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white grid place-items-center ring-2 ring-slate-900 notif-lencana">
            {belumDibaca.length > 9 ? '9+' : belumDibaca.length}
          </span>
        )}
      </button>

      {buka && posisi && createPortal(
        <div
          ref={panelRef}
          className="notif-panel glass-modal"
          role="dialog"
          aria-label="Notifikasi"
          style={{ '--notif-top': `${posisi.top}px`, '--notif-right': `${posisi.right}px` } as React.CSSProperties}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
            <div>
              <p className="text-sm font-bold text-white">Notifikasi</p>
              <p className="text-[11px] text-slate-400">
                {belumDibaca.length ? `${belumDibaca.length} belum dibaca` : 'Semua sudah dibaca'}
              </p>
            </div>
            {belumDibaca.length > 0 && (
              <button
                type="button"
                onClick={() => simpanDibaca(belumDibaca.map((n) => n.id))}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-[min(420px,70vh)] overflow-y-auto p-2">
            {memuat && daftar.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">Memuat notifikasi…</p>
            ) : daftar.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                <p className="text-sm font-semibold text-slate-200">Belum ada notifikasi</p>
                <p className="text-xs text-slate-400 mt-1">Keuangan Anda aman dan terkendali.</p>
              </div>
            ) : (
              daftar.map((n, i) => {
                const Ikon = n.ikon;
                const baru = !dibaca.includes(n.id);
                return (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => {
                      simpanDibaca([n.id]);
                      setBuka(false);
                    }}
                    className={cn('notif-item', baru && 'is-baru')}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <span className={cn('notif-ikon', `is-${n.tingkat}`)}>
                      <Ikon className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate">{n.judul}</span>
                        {baru && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />}
                      </span>
                      <span className="block text-[11px] text-slate-300 leading-snug mt-0.5">{n.isi}</span>
                      <span className="block text-[10px] text-slate-500 mt-1">{n.waktu}</span>
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function bacaTersimpan(): string[] {
  try {
    const nilai = JSON.parse(localStorage.getItem(KUNCI_DIBACA) || '[]');
    return Array.isArray(nilai) ? nilai.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function tanggalLokal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function waktuRelatif(iso: string) {
  const menit = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (menit < 1) return 'Baru saja';
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.round(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  return `${Math.round(jam / 24)} hari lalu`;
}

async function susunNotifikasi(): Promise<Notifikasi[]> {
  const sekarang = new Date();
  const awalBulan = new Date(sekarang.getFullYear(), sekarang.getMonth(), 1);
  const batasTerbaru = new Date(sekarang.getTime() - HARI_TERBARU * 86400000);
  const mulai = tanggalLokal(awalBulan < batasTerbaru ? awalBulan : batasTerbaru);
  const bulanIni = tanggalLokal(awalBulan).slice(0, 7);
  const hariIni = tanggalLokal(sekarang);

  const [resTrx, resBudget] = await Promise.all([
    fetch(`/api/transactions?limit=500&startDate=${mulai}`),
    fetch(`/api/budgets?month=${sekarang.getMonth() + 1}&year=${sekarang.getFullYear()}`),
  ]);
  const transaksi: Transaction[] = resTrx.ok ? (await resTrx.json()).data || [] : [];
  const anggaran: Budget[] = resBudget.ok ? (await resBudget.json()).data || [] : [];

  const hasil: Notifikasi[] = [];
  const trxBulanIni = transaksi.filter((t) => t.transaction_date.startsWith(bulanIni));

  // 1. Anggaran per kategori bulan ini
  for (const b of anggaran) {
    const terpakai = trxBulanIni
      .filter((t) => t.type === 'expense' && t.category_id === b.category_id)
      .reduce((total, t) => total + Number(t.amount), 0);
    const persen = b.amount > 0 ? Math.round((terpakai / Number(b.amount)) * 100) : 0;
    const nama = b.category?.name || 'kategori';
    if (persen >= 100) {
      hasil.push({
        id: `anggaran-lewat-${b.id}-${bulanIni}`,
        tingkat: 'bahaya',
        ikon: AlertTriangle,
        judul: `Anggaran ${nama} terlampaui`,
        isi: `Terpakai ${formatIDR(terpakai)} dari ${formatIDR(Number(b.amount))} (${persen}%).`,
        waktu: 'Bulan ini',
        href: '/budgets',
      });
    } else if (persen >= 80) {
      hasil.push({
        id: `anggaran-hampir-${b.id}-${bulanIni}`,
        tingkat: 'peringatan',
        ikon: PiggyBank,
        judul: `Anggaran ${nama} hampir habis`,
        isi: `Sudah ${persen}% terpakai, sisa ${formatIDR(Number(b.amount) - terpakai)}.`,
        waktu: 'Bulan ini',
        href: '/budgets',
      });
    }
  }

  // 2. Arus kas bulan ini
  const masuk = trxBulanIni.filter((t) => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0);
  const keluar = trxBulanIni.filter((t) => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0);
  if (keluar > masuk && keluar > 0) {
    hasil.push({
      id: `arus-kas-minus-${bulanIni}`,
      tingkat: 'peringatan',
      ikon: TrendingDown,
      judul: 'Pengeluaran melebihi pemasukan',
      isi: `Bulan ini defisit ${formatIDR(keluar - masuk)}. Cek pos pengeluaran terbesar Anda.`,
      waktu: 'Bulan ini',
      href: '/statistics',
    });
  }

  // 3. Pemasukan & hasil Scan AI terbaru
  const terbaru = transaksi
    .filter((t) => new Date(t.created_at) >= batasTerbaru)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  for (const t of terbaru) {
    if (t.source === 'ai_scan') {
      hasil.push({
        id: `scan-${t.id}`,
        tingkat: 'info',
        ikon: Sparkles,
        judul: 'Struk tersimpan lewat Scan AI',
        isi: `${t.merchant_name} · ${t.type === 'income' ? '+' : '-'}${formatIDR(Number(t.amount))}`,
        waktu: waktuRelatif(t.created_at),
        href: '/transactions',
      });
    } else if (t.type === 'income') {
      hasil.push({
        id: `pemasukan-${t.id}`,
        tingkat: 'sukses',
        ikon: ArrowDownLeft,
        judul: 'Pemasukan baru tercatat',
        isi: `${t.merchant_name} · +${formatIDR(Number(t.amount))}`,
        waktu: waktuRelatif(t.created_at),
        href: '/transactions',
      });
    }
  }

  // 4. Pengingat mencatat (sore hari, bila belum ada transaksi hari ini)
  if (sekarang.getHours() >= 18 && !transaksi.some((t) => t.transaction_date === hariIni)) {
    hasil.push({
      id: `pengingat-${hariIni}`,
      tingkat: 'info',
      ikon: PencilLine,
      judul: 'Belum ada catatan hari ini',
      isi: 'Ada pengeluaran hari ini? Catat sekarang atau scan struknya.',
      waktu: 'Hari ini',
      href: '/scan',
    });
  }

  return hasil.slice(0, 20);
}
