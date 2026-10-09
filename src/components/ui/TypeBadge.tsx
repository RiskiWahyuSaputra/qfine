import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { TransactionType } from '@/types/database';

export function TypeBadge({ type }: { type: TransactionType }) {
  const isIncome = type === 'income';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border',
        isIncome
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      )}
    >
      {isIncome ? (
        <>
          <ArrowDownLeft className="w-3 h-3" /> Pemasukan
        </>
      ) : (
        <>
          <ArrowUpRight className="w-3 h-3" /> Pengeluaran
        </>
      )}
    </span>
  );
}
