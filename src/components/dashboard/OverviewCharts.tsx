'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatIDR } from '@/lib/utils';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';
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

interface MonthlyData {
  monthName: string;
  income: number;
  expense: number;
}

interface CategoryPieData {
  name: string;
  value: number;
  color: string;
  [key: string]: unknown;
}

interface OverviewChartsProps {
  monthlyData: MonthlyData[];
  categoryExpenseData: CategoryPieData[];
}

type GlassTooltipProps = {
  active?: boolean;
  payload?: Array<{ color?: string; name?: string; value?: number | string }>;
  label?: string;
};
function GlassTooltip({ active, payload, label }: GlassTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel p-3 rounded-xl border border-white/10 shadow-xl text-xs space-y-1">
      <p className="font-semibold text-white">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {formatIDR(Number(entry.value) || 0)}
        </p>
      ))}
    </div>
  );
}

export function OverviewCharts({ monthlyData, categoryExpenseData }: OverviewChartsProps) {
  const totalExpenseMonth = useMemo(
    () => categoryExpenseData.reduce((s, d) => s + (Number(d.value) || 0), 0),
    [categoryExpenseData]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
      {/* Monthly Bar Chart (Span 2) */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="text-base">Tren Pemasukan & Pengeluaran</CardTitle>
          <span className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-slate-300">
            6 Bulan Terakhir
          </span>
        </CardHeader>
        <div className="h-64 sm:h-72 w-full pt-2 sm:pt-4">
          {monthlyData.length === 0 || monthlyData.every((d) => d.income === 0 && d.expense === 0) ? (
            <EmptyState
              icon={<BarChart3 className="w-6 h-6" />}
              title="Belum ada tren bulanan"
              description="Transaksi 6 bulan terakhir akan tampil di sini setelah ada pemasukan atau pengeluaran."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }} barGap={6}>
                <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} interval={0} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) =>
                    val >= 1_000_000 ? `${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)}Jt` : `${Math.round(val / 1000)}k`
                  }
                  width={44}
                />
                <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[8, 8, 0, 0]} barSize={18} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[8, 8, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Category Pie Chart (Span 1) */}
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pengeluaran per Kategori</CardTitle>
          <p className="text-xs text-slate-400">Distribusi pengeluaran bulan ini</p>
        </CardHeader>
        <div className="h-64 sm:h-72 w-full flex items-center justify-center">
          {categoryExpenseData.length === 0 ? (
            <EmptyState
              icon={<PieIcon className="w-6 h-6" />}
              title="Belum ada pengeluaran"
              description="Kategori terisi otomatis saat ada transaksi pengeluaran di bulan ini."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryExpenseData}
                  cx="50%"
                  cy="44%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryExpenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#06b6d4'} stroke="rgba(15,23,42,0.9)" strokeWidth={1.5} />
                  ))}
                </Pie>
                {/* Center total */}
                <text x="50%" y="44%" textAnchor="middle" dominantBaseline="central" className="fill-white text-[11px] font-semibold">
                  <tspan x="50%" dy="-0.6em" className="fill-slate-400 text-[10px] tracking-wide uppercase">
                    Total bulan ini
                  </tspan>
                  <tspan x="50%" dy="1.35em" className="fill-white text-[11px] font-bold">
                    {formatIDR(totalExpenseMonth)}
                  </tspan>
                </text>
                <Tooltip
                  content={<GlassTooltip label="Kategori" />}
                  formatter={(value: unknown) => [formatIDR(Number(value) || 0), 'Total']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: 8 }}
                  formatter={(value: string) => (value.length > 12 ? `${value.slice(0, 12)}…` : value)}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
}
