import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TypeBadge } from '@/components/ui/TypeBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatIDR, formatDateID } from '@/lib/utils';
import { Transaction } from '@/types/database';
import { ArrowRight, Receipt, Sparkles } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onAddClick: () => void;
}

export function RecentTransactions({ transactions, onAddClick }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
          <p className="text-xs text-slate-400">10 aktivitas pencatatan terakhir</p>
        </div>
        <Link href="/transactions">
          <Button variant="ghost" size="sm" className="text-xs text-cyan-400 hover:text-cyan-300">
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </CardHeader>

      {transactions.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-7 h-7" />}
          title="Belum Ada Transaksi"
          description="Mulai catat transaksi manual atau scan struk belanja Anda dengan AI."
          actionLabel="Tambah Transaksi Baru"
          onAction={onAddClick}
        />
      ) : (
        <div className="divide-y divide-white/5 overflow-x-auto">
          {transactions.map((t) => {
            const isIncome = t.type === 'income';
            return (
              <div
                key={t.id}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border"
                    style={{
                      backgroundColor: `${t.category?.color || '#0284c7'}15`,
                      borderColor: `${t.category?.color || '#0284c7'}30`,
                      color: t.category?.color || '#38bdf8',
                    }}
                  >
                    {(t.category?.name || t.merchant_name || 'T').slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{t.merchant_name}</p>
                      {t.source === 'ai_scan' && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>AI</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{formatDateID(t.transaction_date)}</span>
                      <span>•</span>
                      <span>{t.category?.name || 'Umum'}</span>
                      <span>•</span>
                      <span>{t.payment_method}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-sm font-bold tracking-tight ${
                      isIncome ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {isIncome ? '+' : '-'} {formatIDR(Number(t.amount) || 0)}
                  </div>
                  <div className="mt-0.5">
                    <TypeBadge type={t.type} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
