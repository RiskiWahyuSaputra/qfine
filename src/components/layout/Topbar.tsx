'use client';

import React from 'react';
import { Menu, Bell, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface TopbarProps {
  onMenuClick: () => void;
  title: string;
  userName?: string;
}

export function Topbar({ onMenuClick, title, userName }: TopbarProps) {
  const [today, setToday] = React.useState('Jumat, 9 Oktober 2026');

  React.useEffect(() => {
    setToday(
      new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date())
    );
  }, []);

  const getGreeting = () => {
    const hour = typeof window !== 'undefined' ? new Date().getHours() : 10;
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 sm:px-8 glass-panel border-b border-white/10 backdrop-blur-xl">
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
            {getGreeting()}, <span className="text-slate-200 font-semibold">{userName || 'Ganteng'}</span> • {today}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/scan"
          className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 hover:bg-cyan-500/30 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Scan Bukti AI</span>
        </Link>

        <button
          className="p-2.5 rounded-xl glass-card text-slate-400 hover:text-white relative"
          aria-label="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-slate-900" />
        </button>
      </div>
    </header>
  );
}
