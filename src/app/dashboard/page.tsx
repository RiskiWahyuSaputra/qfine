'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
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

  const startingBalance = Number(profile?.starting_balance) || 0;

  const summary = useMemo(
    () => calculateFinancialSummary(transactions, startingBalance, currentMonth, currentYear),
    [transactions, startingBalance, currentMonth, currentYear]
  );

  const monthlyData: { monthName: string; income: number; expense: number }[] = useMemo(() => {
    const data: { monthName: string; income: number; expense: number }[] = [];
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
      data.push({ monthName, income, expense });
    }
    return data;
  }, [transactions, currentMonth, currentYear]);

  const expenseChangePercent = useMemo(() => {
    if (monthlyData.length < 2) return null;
    const cur = monthlyData[monthlyData.length - 1]?.expense ?? 0;
    const prev = monthlyData[monthlyData.length - 2]?.expense ?? 0;
    if (prev === 0) return cur === 0 ? 0 : null;
    return ((cur - prev) / prev) * 100;
  }, [monthlyData]);

  const categoryExpenseData = useMemo(() => {
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
    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      value: data.value,
      color: data.color,
    }));
  }, [transactions, currentMonth, currentYear]);

  return (
    <AppShell title="Dashboard">
      <div className="space-y-5 sm:space-y-6">
        {/* Quick actions — toolbar liquid minimal, bukan kartu berat */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl liquid-subtle liquid-quality-minimal px-3.5 py-3 sm:px-4">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">
            Aksi cepat
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="gap-1.5 border border-white/10 hover:border-white/15 hover:bg-white/[0.06] sm:w-auto flex-1 sm:flex-initial justify-center"
            >
              <Plus className="w-4 h-4 text-cyan-300" />
              <span className="hidden xs:inline">Tambah</span>
              <span className="xs:hidden">Tambah Transaksi</span>
            </Button>
            <Link href="/scan" className="flex-1 sm:flex-initial">
              <Button variant="primary" size="sm" className="w-full gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Scan Struk AI</span>
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <div className="flex flex-col gap-5 sm:gap-6">
            {/* Hero saldo + ringkasan jadi prioritas visual */}
            <SummaryCards
              currentBalance={summary.currentBalance}
              totalIncomeMonth={
                monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].income : 0
              }
              totalExpenseMonth={
                monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].expense : 0
              }
              netSavingsMonth={summary.netSavingsThisMonth}
              expenseChangePercent={expenseChangePercent}
            />

            {/* Mobile: transaksi dulu (lebih actionable), desktop: chart dulu */}
            <div className="order-2 sm:contents">
              <OverviewCharts
                monthlyData={monthlyData}
                categoryExpenseData={categoryExpenseData}
              />
            </div>
            <div className="order-1 sm:order-none">
              <RecentTransactions
                transactions={transactions.slice(0, 10)}
                onAddClick={() => setIsModalOpen(true)}
              />
            </div>
          </div>
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
