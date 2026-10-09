'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Transaction } from '@/types/database';
import { formatIDR, formatDateID } from '@/lib/utils';
import { filterTransactionsByPeriod, PeriodFilter } from '@/lib/calculations';
import {
  TrendingUp,
  CreditCard,
  Calendar,
  AlertCircle,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function StatisticsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>('this_month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/transactions?limit=500');
        const json = await res.json();
        setTransactions(json.data || []);
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const [clientRefDate, setClientRefDate] = useState<Date>(() => new Date(2026, 9, 9));

  useEffect(() => {
    setClientRefDate(new Date());
  }, []);

  const filteredTx = useMemo(() => {
    return filterTransactionsByPeriod(transactions, period, clientRefDate);
  }, [transactions, period, clientRefDate]);

  // Calculations
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    const catExpenseMap: Record<string, { total: number; color: string }> = {};
    const paymentMethodMap: Record<string, number> = {};
    const dateExpenseMap: Record<string, number> = {};

    for (const t of filteredTx) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        income += amt;
      } else {
        expense += amt;
        const cat = t.category?.name || 'Lainnya';
        const color = t.category?.color || '#38bdf8';
        catExpenseMap[cat] = {
          total: (catExpenseMap[cat]?.total || 0) + amt,
          color,
        };

        dateExpenseMap[t.transaction_date] = (dateExpenseMap[t.transaction_date] || 0) + amt;
      }

      paymentMethodMap[t.payment_method] = (paymentMethodMap[t.payment_method] || 0) + 1;
    }

    // Top Expense Day
    let peakDay = '-';
    let peakDayAmount = 0;
    for (const [dateStr, total] of Object.entries(dateExpenseMap)) {
      if (total > peakDayAmount) {
        peakDayAmount = total;
        peakDay = dateStr;
      }
    }

    // Average daily expense
    const uniqueDays = Object.keys(dateExpenseMap).length || 1;
    const avgDailyExpense = expense / uniqueDays;

    // Category Pie Data
    const categoryPieData = Object.entries(catExpenseMap)
      .map(([name, obj]) => ({
        name,
        value: obj.total,
        color: obj.color,
      }))
      .sort((a, b) => b.value - a.value);

    // Payment Methods Pie Data
    const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];
    const paymentPieData = Object.entries(paymentMethodMap).map(([name, count], index) => ({
      name,
      value: count,
      color: colors[index % colors.length],
    }));

    return {
      income,
      expense,
      net: income - expense,
      categoryPieData,
      paymentPieData,
      peakDay,
      peakDayAmount,
      avgDailyExpense,
      totalCount: filteredTx.length,
    };
  }, [filteredTx]);

  return (
    <AppShell title="Statistik & Laporan">
      <div className="space-y-6">
        {/* Header & Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Analisis Arus Kas & Pengeluaran</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Laporan mendalam berdasarkan periode waktu terpilih
            </p>
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            >
              <option value="this_week">Minggu Ini</option>
              <option value="this_month">Bulan Ini</option>
              <option value="last_3_months">3 Bulan Terakhir</option>
              <option value="last_6_months">6 Bulan Terakhir</option>
              <option value="this_year">Tahun Ini</option>
              <option value="all">Semua Riwayat</option>
            </Select>
          </div>
        </div>

        {/* 4 Metrics Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Total Pengeluaran</span>
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-xl font-bold text-white">{formatIDR(stats.expense)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Pada periode ini</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Rata-rata Harian</span>
              <Calendar className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-xl font-bold text-white">{formatIDR(stats.avgDailyExpense)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Rata-rata pengeluaran per hari aktif</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Hari Terboros</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-sm font-bold text-white">
              {stats.peakDay !== '-' ? formatDateID(stats.peakDay) : '-'}
            </p>
            <p className="text-[11px] text-amber-400 mt-1 font-semibold">
              {stats.peakDayAmount > 0 ? formatIDR(stats.peakDayAmount) : '-'}
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Jumlah Transaksi</span>
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-white">{stats.totalCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">Total pencatatan tercatat</p>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-cyan-400" />
                <span>Pengeluaran Berdasarkan Kategori</span>
              </CardTitle>
            </CardHeader>

            <div className="h-72 w-full flex items-center justify-center">
              {stats.categoryPieData.length === 0 ? (
                <p className="text-xs text-slate-500">Tidak ada pengeluaran pada periode ini</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {stats.categoryPieData.map((entry, idx) => (
                        <Cell key={`cat-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatIDR(Number(val) || 0), 'Pengeluaran']}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Payment Method Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                <span>Distribusi Metode Pembayaran</span>
              </CardTitle>
            </CardHeader>

            <div className="h-72 w-full flex items-center justify-center">
              {stats.paymentPieData.length === 0 ? (
                <p className="text-xs text-slate-500">Tidak ada transaksi pada periode ini</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.paymentPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {stats.paymentPieData.map((entry, idx) => (
                        <Cell key={`pay-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${val} transaksi`, 'Frekuensi']}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Top Expense Categories Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Peringkat Pengeluaran Terbesar</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {stats.categoryPieData.slice(0, 5).map((item, idx) => {
              const percentage = stats.expense > 0 ? (item.value / stats.expense) * 100 : 0;
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <span className="text-slate-500">#{idx + 1}</span> {item.name}
                    </span>
                    <span className="text-slate-300 font-bold">
                      {formatIDR(item.value)}{' '}
                      <span className="text-slate-500 font-normal">({percentage.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
