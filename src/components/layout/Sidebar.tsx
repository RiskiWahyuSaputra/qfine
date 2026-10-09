'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Scan,
  PieChart,
  PiggyBank,
  Settings,
  LogOut,
  Wallet,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/ToastProvider';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transaksi', href: '/transactions', icon: Receipt },
  { name: 'Scan Struk', href: '/scan', icon: Scan },
  { name: 'Statistik', href: '/statistics', icon: PieChart },
  { name: 'Anggaran', href: '/budgets', icon: PiggyBank },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
];

export function Sidebar({ isOpen, onClose, userEmail, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { success, error } = useToast();

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      success('Berhasil keluar akun');
      router.push('/login');
      router.refresh();
    } catch {
      error('Gagal keluar akun');
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 glass-panel border-r border-white/10 transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand / Logo */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                QFine
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Clearly Managed</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-200 group-hover:scale-110',
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white'
                  )}
                />
                <span>{item.name}</span>
                {item.href === '/scan' && (
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                    HOT
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-white/10">
          <div className="p-3.5 rounded-xl glass-card flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-700 text-white font-bold text-sm shrink-0 border border-white/20">
                {(userName || userEmail || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">
                  {userName || 'Pengguna QFine'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{userEmail || 'user@qfine.id'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
}
