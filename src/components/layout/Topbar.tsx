'use client';

import React from 'react';
import { Menu, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { NotificationBell } from './NotificationBell';
import { useNavigasiHalus } from '@/lib/useNavigasiHalus';

interface TopbarProps {
  onMenuClick: () => void;
  title: string;
  userName?: string;
}

export function Topbar({ onMenuClick, title, userName }: TopbarProps) {
  // Sapaan & tanggal bergantung jam/zona browser: server merender "Halo" tanpa tanggal, browser
  // langsung memakai waktu lokal setelah hidrasi (tanpa hydration mismatch)
  const navigasiHalus = useNavigasiHalus();
  const waktu = React.useSyncExternalStore(berlanggananWaktu, waktuBrowser, () => null);
  const [greeting, today] = waktu ? waktu.split('|') : ['Halo', ''];

  return (
    <header style={{ viewTransitionName: 'qfine-topbar' }} className="sticky top-0 z-30 flex items-center justify-between h-[calc(5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] px-4 sm:px-8 glass-panel border-b border-white/10 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2.5 rounded-xl glass-card text-slate-300 hover:text-white lg:hidden"
          aria-label="Buka menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            {title}
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            {greeting}, <span className="text-slate-200 font-semibold">{userName || 'Ganteng'}</span>
            {today && <> • {today}</>}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/scan"
          onClick={(e) => navigasiHalus(e, '/scan')}
          className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 hover:bg-cyan-500/30 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Scan Bukti AI</span>
        </Link>

        <NotificationBell />
      </div>
    </header>
  );
}

const berlanggananWaktu = () => () => {};

/** "Selamat Siang|Jumat, 9 Oktober 2026" (string supaya snapshot stabil antar panggilan) */
function waktuBrowser() {
  const now = new Date();
  const hour = now.getHours();
  const sapaan = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';
  const tanggal = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  return sapaan + '|' + tanggal;
}
