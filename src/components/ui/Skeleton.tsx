import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-white/[0.06] border border-white/10', className)}
      {...props}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6 animate-pulse">
      {/* Quick bar */}
      <div className="h-14 rounded-2xl bg-white/[0.05] border border-white/10" />
      {/* Hero saldo (col-span-2 mobile) + 3 compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="col-span-2 lg:col-span-1 h-32 sm:h-36 rounded-2xl bg-white/[0.06] border border-white/10 p-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 sm:h-32 rounded-2xl bg-white/[0.05] border border-white/10 p-4" />
        ))}
      </div>
      {/* Mobile: transaksi dulu — skeleton urut transaksi lalu chart, desktop sama */}
      <div className="h-72 rounded-2xl bg-white/[0.05] border border-white/10 sm:hidden" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        <div className="lg:col-span-2 h-72 sm:h-80 rounded-2xl bg-white/[0.05] border border-white/10" />
        <div className="h-72 sm:h-80 rounded-2xl bg-white/[0.05] border border-white/10" />
      </div>
      <div className="hidden sm:block h-64 rounded-2xl bg-white/[0.05] border border-white/10" />
    </div>
  );
}
