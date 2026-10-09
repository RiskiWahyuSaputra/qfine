'use client';

import React, { useState, useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { EVENT_HALAMAN_SIAP } from '@/lib/useNavigasiHalus';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { createClient } from '@/lib/supabase/client';

interface AppShellProps {
  children: React.ReactNode;
  title: string;
}

export function AppShell({ children, title }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const pathname = usePathname();

  // Halaman baru sudah tampil: View Transition dari useNavigasiHalus boleh mulai beranimasi
  useLayoutEffect(() => {
    window.dispatchEvent(new CustomEvent(EVENT_HALAMAN_SIAP, { detail: pathname }));
  }, [pathname]);

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
          setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
        }
      } catch {
        // Ignore fallback
      }
    }
    loadUser();
  }, []);

  // Tanpa warna latar sendiri: gradasi & orb di body harus terlihat di balik panel kaca
  return (
    <div className="min-h-screen flex flex-col text-slate-100 selection:bg-cyan-500 selection:text-white">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userEmail={userEmail}
        userName={userName}
      />

      <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-300">
        <Topbar
          title={title}
          userName={userName}
        />

        <main style={{ viewTransitionName: 'qfine-konten' }} className="halaman-masuk flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-12">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
