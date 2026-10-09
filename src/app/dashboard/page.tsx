'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { OverviewCharts } from '@/components/dashboard/OverviewCharts';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { Modal } from '@/components/ui/Modal';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Transaction, Category, Profile } from '@/types/database';
import { calculateFinancialSummary } from '@/lib/calculations';
import { Plus, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [txRes, catRes, profRes] = await Promise.all([
        fetch('/api/transactions?limit=100'),
        fetch('/api/categories'),
        fetch('/api/profile'),
      ]);

      const txJson = await txRes.json();
      const catJson = await catRes.json();
      const profJson = await profRes.json();

      setTransactions(txJson.data || []);
      setCategories(catJson.data || []);
      setProfile(profJson.data || null);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 9, 9));

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Summary calculations
  const summary = calculateFinancialSummary(
    transactions,
    0, // Starting balance fallback
    currentMonth,
    currentYear
  );

  // Month-by-month income & expense for last 6 months
  const monthlyData: { monthName: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const monthName = d.toLocaleDateString('id-ID', { month: 'short' });

    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      const [ty, tm] = t.transaction_date.split('-').map(Number);
      if (ty === y && tm === m) {
        if (t.type === 'income') income += Number(t.amount) || 0;
        if (t.type === 'expense') expense += Number(t.amount) || 0;
      }
    }

    monthlyData.push({ monthName, income, expense });
  }

  // Current month category expense breakdown
  const categoryMap = new Map<string, { value: number; color: string }>();
  for (const t of transactions) {
    const [ty, tm] = t.transaction_date.split('-').map(Number);
    if (t.type === 'expense' && ty === currentYear && tm === currentMonth) {
      const catName = t.category?.name || 'Lainnya';
      const catColor = t.category?.color || '#0284c7';
      const currentVal = categoryMap.get(catName)?.value || 0;
      categoryMap.set(catName, {
        value: currentVal + (Number(t.amount) || 0),
        color: catColor,
      });
    }
  }

  const categoryExpenseData = Array.from(categoryMap.entries()).map(([name, data]) => ({
    name,
    value: data.value,
    color: data.color,
  }));

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        {/* Top Quick Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Aksi Cepat Keuangan</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Catat transaksi baru secara manual atau gunakan AI Vision Scanner
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-initial"
            >
              <Plus className="w-4 h-4 mr-1 text-cyan-400" />
              <span>Tambah Transaksi</span>
            </Button>

            <Link href="/scan" className="flex-1 sm:flex-initial">
              <Button variant="primary" size="sm" className="w-full">
                <Sparkles className="w-4 h-4 mr-1.5" />
                <span>Scan Struk AI</span>
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* 4 Summary Cards */}
            <SummaryCards
              currentBalance={summary.currentBalance}
              totalIncomeMonth={
                monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].income : 0
              }
              totalExpenseMonth={
                monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].expense : 0
              }
              netSavingsMonth={summary.netSavingsThisMonth}
            />

            {/* Charts Section */}
            <OverviewCharts
              monthlyData={monthlyData}
              categoryExpenseData={categoryExpenseData}
            />

            {/* Recent Transactions List */}
            <RecentTransactions
              transactions={transactions.slice(0, 10)}
              onAddClick={() => setIsModalOpen(true)}
            />
          </>
        )}
      </div>

      {/* Modal Add Transaction */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Transaksi Baru"
        description="Masukkan rincian transaksi pengeluaran atau pemasukan Anda."
      >
        <TransactionForm
          categories={categories}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchData();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </AppShell>
  );
}
