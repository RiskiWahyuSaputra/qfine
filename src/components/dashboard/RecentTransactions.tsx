import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn, formatIDR } from '@/lib/utils';
import { Transaction } from '@/types/database';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Receipt, Sparkles } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onAddClick: () => void;
}

export function RecentTransactions({ transactions, onAddClick }: RecentTransactionsProps) {
  const count = transactions.length;
  // Mobile: tampilkan 5, desktop 10 via CSS (hidden sm:flex untuk item 6-10)
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
            {count > 0 && (
              <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-slate-300">
                {count} terbaru
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">Aktivitas pencatatan terakhir</p>
        </div>
        <Link href="/transactions" className="shrink-0">
          <Button variant="ghost" size="sm" className="text-xs text-cyan-300 hover:text-cyan-200 hover:bg-white/[0.06]">
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
        <div className="-mx-1 divide-y divide-white/[0.06]">
          {transactions.map((t, idx) => {
            const isIncome = t.type === 'income';
            const warna = t.category?.color || (isIncome ? '#10b981' : '#f43f5e');
            const Arah = isIncome ? ArrowDownLeft : ArrowUpRight;
            const hiddenOnMobile = idx >= 5 ? 'hidden sm:flex' : 'flex';
            return (
              <div
                key={t.id}
                className={`${hiddenOnMobile} items-center gap-3 px-2 py-3.5 rounded-xl hover:bg-white/[0.04] transition-colors`}
              >
                <div
                  className="w-10 h-10 rounded-xl grid place-items-center shrink-0 border"
                  style={{ backgroundColor: `${warna}1f`, borderColor: `${warna}40`, color: warna }}
                >
                  <Arah className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{t.merchant_name}</p>
                    {t.source === 'ai_scan' && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded-md text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shrink-0">
                        <Sparkles className="w-2.5 h-2.5" />
                        AI
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {t.category?.name || 'Tanpa kategori'} · {tanggalPendek(t.transaction_date)}
                    {t.transaction_time ? ` · ${t.transaction_time.slice(0, 5)}` : ''}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className={cn('text-sm font-bold tracking-tight tabular-nums', isIncome ? 'text-emerald-400' : 'text-rose-300')}>
                    {isIncome ? '+' : '−'}
                    {formatIDR(Number(t.amount) || 0)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[7rem]">{t.payment_method}</p>
                </div>
              </div>
            );
          })}
          {count > 5 && (
            <p className="sm:hidden text-center text-[11px] text-slate-500 py-2">
              +{count - 5} transaksi lainnya di desktop —{' '}
              <Link href="/transactions" className="text-cyan-300 underline underline-offset-2">
                lihat semua
              </Link>
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

/** "5 Okt" untuk tahun berjalan, "5 Okt 2025" untuk tahun lain */
function tanggalPendek(tanggal: string) {
  const [tahun, bulan, hari] = tanggal.split('-').map(Number);
  if (!tahun || !bulan || !hari) return tanggal;
  const d = new Date(tahun, bulan - 1, hari);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    ...(tahun !== new Date().getFullYear() ? { year: 'numeric' } : {}),
  }).format(d);
}
