import React from 'react';
import { Card } from '@/components/ui/Card';
import { formatIDR } from '@/lib/utils';
import { Wallet, ArrowDownLeft, ArrowUpRight, Scale, TrendingDown, TrendingUp } from 'lucide-react';

interface SummaryCardsProps {
  currentBalance: number;
  totalIncomeMonth: number;
  totalExpenseMonth: number;
  netSavingsMonth: number;
  expenseChangePercent?: number | null;
}

export function SummaryCards({
  currentBalance,
  totalIncomeMonth,
  totalExpenseMonth,
  netSavingsMonth,
  expenseChangePercent,
}: SummaryCardsProps) {
  const isExpenseUp = expenseChangePercent != null && expenseChangePercent > 0;
  const changeLabel =
    expenseChangePercent != null
      ? `${expenseChangePercent > 0 ? '+' : ''}${expenseChangePercent.toFixed(1)}% vs bulan lalu`
      : 'Total transaksi belanja & biaya';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Hero premium — GlassQuality.premium + ios27 frost, static hero surface */}
      <Card
        glass={false}
        className="col-span-2 lg:col-span-1 relative overflow-hidden group liquid-hero liquid-quality-premium p-5 sm:p-6"
      >
        <div className="pointer-events-none absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-gradient-to-tr from-cyan-500/25 to-blue-600/20 blur-2xl group-hover:scale-110 transition-transform duration-500" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-cyan-200/90">Saldo saat ini</p>
            <p className="mt-2 text-2xl sm:text-[1.7rem] font-extrabold tracking-tight text-white tabular-nums leading-none">
              {formatIDR(currentBalance)}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-300/90">Termasuk saldo awal + akumulasi bersih</p>
          </div>
          <div className="shrink-0 p-2.5 rounded-xl bg-cyan-500/12 text-cyan-300 border border-cyan-400/25">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </Card>

      <CompactCard
        title="Pemasukan bulan ini"
        amount={totalIncomeMonth}
        icon={ArrowDownLeft}
        iconWrap="bg-emerald-500/10 text-emerald-300 border-emerald-400/20"
        orb="from-emerald-500/18 to-teal-600/15"
        description="Arus kas masuk periode ini"
      />
      <CompactCard
        title="Pengeluaran bulan ini"
        amount={totalExpenseMonth}
        icon={ArrowUpRight}
        iconWrap="bg-rose-500/10 text-rose-300 border-rose-400/20"
        orb="from-rose-500/18 to-red-600/15"
        description={changeLabel}
        badge={
          expenseChangePercent != null ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                isExpenseUp
                  ? 'bg-rose-500/15 text-rose-200 border-rose-400/25'
                  : 'bg-emerald-500/15 text-emerald-200 border-emerald-400/25'
              }`}
            >
              {isExpenseUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {expenseChangePercent > 0 ? '+' : ''}
              {expenseChangePercent.toFixed(1)}%
            </span>
          ) : undefined
        }
      />
      <CompactCard
        title="Selisih bulan ini"
        amount={netSavingsMonth}
        icon={Scale}
        iconWrap={
          netSavingsMonth >= 0
            ? 'bg-violet-500/10 text-violet-300 border-violet-400/20'
            : 'bg-amber-500/10 text-amber-300 border-amber-400/20'
        }
        orb={netSavingsMonth >= 0 ? 'from-violet-500/18 to-indigo-600/15' : 'from-amber-500/18 to-orange-600/15'}
        description={netSavingsMonth >= 0 ? 'Surplus finansial positif' : 'Defisit (keluar > masuk)'}
      />
    </div>
  );
}

function CompactCard({
  title,
  amount,
  icon: Icon,
  iconWrap,
  orb,
  description,
  badge,
}: {
  title: string;
  amount: number;
  icon: React.ElementType;
  iconWrap: string;
  orb: string;
  description: string;
  badge?: React.ReactNode;
}) {
  return (
    <Card className="liquid-quality-standard relative overflow-hidden group p-4 sm:p-5">
      <div
        className={`pointer-events-none absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-tr ${orb} blur-2xl group-hover:scale-110 transition-transform`}
      />
      <div className="relative flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-wide uppercase text-slate-400 truncate pr-1">{title}</p>
        <div className={`shrink-0 p-2 rounded-xl border ${iconWrap}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="mt-3 text-[1.35rem] font-bold tracking-tight text-white tabular-nums leading-none truncate">
        {formatIDR(amount)}
      </p>
      <div className="mt-2 flex items-center gap-2 min-w-0">
        <p className="text-[11px] leading-snug text-slate-400 truncate flex-1 min-w-0">{description}</p>
        {badge ? <span className="shrink-0">{badge}</span> : null}
      </div>
    </Card>
  );
}
