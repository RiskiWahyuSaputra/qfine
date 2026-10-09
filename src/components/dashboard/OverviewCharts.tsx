'use client';

import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatIDR } from '@/lib/utils';
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

export function OverviewCharts({ monthlyData, categoryExpenseData }: OverviewChartsProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 rounded-xl border border-white/10 shadow-xl text-xs space-y-1">
          <p className="font-semibold text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {entry.name}: {formatIDR(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Monthly Bar Chart (Span 2) */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Tren Pemasukan & Pengeluaran</CardTitle>
          <span className="text-xs text-slate-400">6 Bulan Terakhir</span>
        </CardHeader>
        <div className="h-72 w-full pt-4">
          {monthlyData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Belum ada riwayat transaksi bulanan
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="monthName" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) =>
                    val >= 1000000 ? `${(val / 1000000).toFixed(0)}Jt` : `${val / 1000}k`
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Category Pie Chart (Span 1) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pengeluaran per Kategori</CardTitle>
          <p className="text-xs text-slate-400">Distribusi pengeluaran bulan ini</p>
        </CardHeader>
        <div className="h-72 w-full flex items-center justify-center">
          {categoryExpenseData.length === 0 ? (
            <div className="text-xs text-slate-500 text-center px-4">
              Belum ada data pengeluaran kategori bulan ini
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryExpenseData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryExpenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#06b6d4'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatIDR(Number(value) || 0), 'Total']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
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
  );
}
