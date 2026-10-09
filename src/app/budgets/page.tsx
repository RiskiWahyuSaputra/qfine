'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Budget, Category, Transaction } from '@/types/database';
import { formatIDR, formatMonthID } from '@/lib/utils';
import { useToast } from '@/components/ui/ToastProvider';
import { PiggyBank, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function BudgetsPage() {
  const { success, error: toastError } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Month & Year Filter
  const [selectedMonth, setSelectedMonth] = useState(10);
  const [selectedYear, setSelectedYear] = useState(2026);

  useEffect(() => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [bRes, cRes, tRes] = await Promise.all([
        fetch(`/api/budgets?month=${selectedMonth}&year=${selectedYear}`),
        fetch('/api/categories?type=expense'),
        fetch('/api/transactions?type=expense&limit=500'),
      ]);

      const bData = await bRes.json();
      const cData = await cRes.json();
      const tData = await tRes.json();

      setBudgets(bData.data || []);
      setCategories(cData.data || []);
      setTransactions(tData.data || []);
    } catch {
      toastError('Gagal memuat data anggaran.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear, toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Map category expenses for selected month & year
  const spentMap = new Map<string, number>();
  for (const t of transactions) {
    const [ty, tm] = t.transaction_date.split('-').map(Number);
    if (ty === selectedYear && tm === selectedMonth && t.category_id) {
      const cur = spentMap.get(t.category_id) || 0;
      spentMap.set(t.category_id, cur + (Number(t.amount) || 0));
    }
  }

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toastError('Nominal anggaran harus lebih dari 0.');
      return;
    }

    if (!categoryId) {
      toastError('Harap pilih kategori pengeluaran.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: categoryId,
          amount: numAmount,
          period_month: selectedMonth,
          period_year: selectedYear,
        }),
      });

      if (!res.ok) {
        toastError('Gagal menyimpan batas anggaran.');
        setIsSaving(false);
        return;
      }

      success('Batas anggaran berhasil diperbarui!');
      setIsModalOpen(false);
      setCategoryId('');
      setAmount('');
      fetchData();
    } catch {
      toastError('Terjadi kesalahan koneksi.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalBudgeted = budgets.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
  const totalSpent = budgets.reduce(
    (acc, b) => acc + (spentMap.get(b.category_id) || 0),
    0
  );

  return (
    <AppShell title="Anggaran Keuangan">
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-cyan-400" />
              <span>Kelola Batas Anggaran Bulanan</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Periode: {formatMonthID(selectedMonth, selectedYear)}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Atur Anggaran Kategori</span>
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <span className="text-xs text-slate-400">Total Anggaran Direncanakan</span>
            <p className="text-xl font-bold text-white mt-1">{formatIDR(totalBudgeted)}</p>
          </Card>
          <Card>
            <span className="text-xs text-slate-400">Total Realisasi Terpakai</span>
            <p className="text-xl font-bold text-cyan-400 mt-1">{formatIDR(totalSpent)}</p>
          </Card>
          <Card>
            <span className="text-xs text-slate-400">Sisa Kuota Anggaran</span>
            <p
              className={`text-xl font-bold mt-1 ${
                totalBudgeted - totalSpent >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatIDR(totalBudgeted - totalSpent)}
            </p>
          </Card>
        </div>

        {/* Budgets List Grid */}
        <Card className="p-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Daftar Batas Anggaran Kategori</CardTitle>
          </CardHeader>

          {isLoading ? (
            <div className="text-center py-12 text-xs text-slate-400 animate-pulse">
              Memuat data anggaran...
            </div>
          ) : budgets.length === 0 ? (
            <EmptyState
              icon={<PiggyBank className="w-8 h-8" />}
              title="Belum Ada Anggaran Ditetapkan"
              description="Tetapkan batas pengeluaran per kategori untuk mengontrol keuangan bulanan Anda."
              actionLabel="Tetapkan Anggaran Baru"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.map((b) => {
                const spent = spentMap.get(b.category_id) || 0;
                const budgetAmount = Number(b.amount) || 0;
                const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
                const isOverBudget = spent > budgetAmount;

                return (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl glass-card border border-white/10 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: b.category?.color || '#0284c7' }}
                        />
                        <span className="font-semibold text-sm text-white">
                          {b.category?.name || 'Kategori'}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          isOverBudget
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {isOverBudget ? (
                          <span className="inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Over Budget
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Aman ({percentage.toFixed(0)}%)
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverBudget ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Terpakai: {formatIDR(spent)}</span>
                      <span>Batas: {formatIDR(budgetAmount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Modal Form Set Budget */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Atur Anggaran Kategori"
        description="Pilih kategori pengeluaran dan tetapkan batas maksimal bulan ini."
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <Select
            label="Kategori Pengeluaran"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Pilih Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Input
            label="Batas Maksimal Anggaran (Rp)"
            type="number"
            placeholder="Misal: 1500000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Bulan"
              value={String(selectedMonth)}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  Bulan {m}
                </option>
              ))}
            </Select>

            <Input
              label="Tahun"
              type="number"
              value={String(selectedYear)}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Simpan Anggaran
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
