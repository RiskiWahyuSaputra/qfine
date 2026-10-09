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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigasiHalus } from '@/lib/useNavigasiHalus';

export function BottomNav() {
  const pathname = usePathname();
  const navigasiHalus = useNavigasiHalus();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transaksi', href: '/transactions', icon: Receipt },
    { name: 'Scan', href: '/scan', icon: Scan, isCenter: true },
    { name: 'Statistik', href: '/statistics', icon: PieChart },
    { name: 'Anggaran', href: '/budgets', icon: PiggyBank },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pointer-events-none" style={{ viewTransitionName: 'qfine-bottomnav' }}>
      <div className="pointer-events-auto max-w-md mx-auto rounded-2xl glass-panel border border-white/10 px-3 py-2 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isCenter) {
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => navigasiHalus(e, item.href)}
                className="relative -top-5 flex flex-col items-center group"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/40 border-2 border-slate-900 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-semibold text-cyan-400 mt-1">Scan</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => navigasiHalus(e, item.href)}
              className={cn(
                'flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors',
                isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
