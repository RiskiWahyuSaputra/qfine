'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Scan,
  PieChart,
  PiggyBank,
  Settings,
  Wallet,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigasiHalus } from '@/lib/useNavigasiHalus';

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
  const navigasiHalus = useNavigasiHalus();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 glass-overlay lg:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        style={{ viewTransitionName: 'qfine-sidebar' }}
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] glass-panel border-r border-white/10 transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand / Logo */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
          <Link href="/dashboard" onClick={(e) => navigasiHalus(e, '/dashboard')} className="flex items-center gap-3 group">
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
                onClick={(e) => {
                  onClose();
                  navigasiHalus(e, item.href);
                }}
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

        {/* Info pemilik (tanpa logout: QFine dipakai pribadi, masuk otomatis) */}
        <div className="p-4 border-t border-white/10">
          <div className="p-3.5 rounded-xl glass-card flex items-center justify-between">
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

        </div>
      </aside>
    </>
  );
}
