import React from 'react';
import { Card } from '@/components/ui/Card';
import { formatIDR } from '@/lib/utils';
import { Wallet, ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';

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
  const cards = [
    {
      title: 'Saldo Saat Ini',
      amount: currentBalance,
      icon: Wallet,
      gradient: 'from-cyan-500/20 to-blue-600/20',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      description: 'Termasuk saldo awal + akumulasi bersih',
    },
    {
      title: 'Pemasukan Bulan Ini',
      amount: totalIncomeMonth,
      icon: ArrowDownLeft,
      gradient: 'from-emerald-500/20 to-teal-600/20',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      description: 'Total arus kas masuk periode ini',
    },
    {
      title: 'Pengeluaran Bulan Ini',
      amount: totalExpenseMonth,
      icon: ArrowUpRight,
      gradient: 'from-rose-500/20 to-red-600/20',
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      description:
        expenseChangePercent !== null && expenseChangePercent !== undefined
          ? `${expenseChangePercent > 0 ? '+' : ''}${expenseChangePercent.toFixed(1)}% vs bulan lalu`
          : 'Total transaksi belanja & biaya',
    },
    {
      title: 'Selisih Bulan Ini',
      amount: netSavingsMonth,
      icon: Scale,
      gradient: 'from-purple-500/20 to-indigo-600/20',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      description: netSavingsMonth >= 0 ? 'Surplus finansial positif' : 'Defisit (pengeluaran > pemasukan)',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className="relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300"
          >
            <div
              className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-tr ${card.gradient} blur-2xl pointer-events-none group-hover:scale-125 transition-transform`}
            />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">{card.title}</span>
              <div className={`p-2.5 rounded-xl border ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
              {formatIDR(card.amount)}
            </div>
            <p className="text-[11px] text-slate-400 truncate">{card.description}</p>
          </Card>
        );
      })}
    </div>
  );
}
