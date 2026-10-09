'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { TypeBadge } from '@/components/ui/TypeBadge';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Transaction, Category } from '@/types/database';
import { formatIDR, formatDateID } from '@/lib/utils';
import { useToast } from '@/components/ui/ToastProvider';
import {
  Plus,
  Download,
  Search,
  Filter,
  Edit2,
  Trash2,
  Receipt,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function TransactionsPage() {
  const { success, error: toastError } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Modals & Actions
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });

      if (searchTerm) params.set('search', searchTerm);
      if (selectedType !== 'all') params.set('type', selectedType);
      if (selectedCategory !== 'all') params.set('categoryId', selectedCategory);
      if (selectedPayment !== 'all') params.set('paymentMethod', selectedPayment);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();

      setTransactions(data.data || []);
      setTotalCount(data.count || 0);
    } catch {
      toastError('Gagal memuat transaksi.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchTerm, selectedType, selectedCategory, selectedPayment, startDate, endDate, toastError]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data.data || []);
      } catch {
        // Fallback
      }
    }
    loadCategories();
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${deletingId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        toastError('Gagal menghapus transaksi.');
        return;
      }

      success('Transaksi berhasil dihapus.');
      setDeletingId(null);
      fetchTransactions();
    } catch {
      toastError('Terjadi kesalahan koneksi.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    window.open(`/api/export-csv?${params.toString()}`, '_blank');
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <AppShell title="Daftar Transaksi">
      <div className="space-y-6">
        {/* Top Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Kelola Transaksi</h2>
            <p className="text-xs text-slate-400 mt-1">
              Total {totalCount} transaksi tercatat di akun Anda
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button variant="secondary" size="sm" onClick={handleExportCsv}>
              <Download className="w-4 h-4 mr-1.5" />
              <span>Export CSV</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingTransaction(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Tambah Transaksi</span>
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span>Filter & Pencarian</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <Input
                placeholder="Cari merchant atau catatan..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            {/* Type Filter */}
            <Select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Semua Tipe</option>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </Select>

            {/* Category Filter */}
            <Select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            {/* Payment Filter */}
            <Select
              value={selectedPayment}
              onChange={(e) => {
                setSelectedPayment(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Semua Metode</option>
              <option value="Cash">Cash</option>
              <option value="Transfer bank">Transfer bank</option>
              <option value="QRIS">QRIS</option>
              <option value="E-wallet">E-wallet</option>
              <option value="Kartu debit/kredit">Kartu debit/kredit</option>
              <option value="Lainnya">Lainnya</option>
            </Select>

            {/* Date Range Start */}
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              placeholder="Dari tanggal"
            />
          </div>
        </Card>

        {/* Transactions Table & List */}
        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
              Memuat data transaksi...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Receipt className="w-8 h-8" />}
                title="Tidak Ada Transaksi Ditemukan"
                description="Coba ubah kriteria filter pencarian atau tambahkan transaksi baru."
                actionLabel="Tambah Transaksi"
                onAction={() => {
                  setEditingTransaction(null);
                  setIsFormOpen(true);
                }}
              />
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Merchant / Sumber</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Metode</th>
                      <th className="py-3 px-4">Tipe</th>
                      <th className="py-3 px-4 text-right">Nominal</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((t) => {
                      const isIncome = t.type === 'income';
                      return (
                        <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-medium text-slate-300">
                            {formatDateID(t.transaction_date)}
                            {t.transaction_time && (
                              <span className="block text-[10px] text-slate-500">
                                {t.transaction_time}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white">{t.merchant_name}</span>
                              {t.source === 'ai_scan' && (
                                <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                  <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI
                                </span>
                              )}
                            </div>
                            {t.description && (
                              <p className="text-[11px] text-slate-400 truncate max-w-xs">
                                {t.description}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                              {t.category?.name || 'Umum'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">{t.payment_method}</td>
                          <td className="py-3.5 px-4">
                            <TypeBadge type={t.type} />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span
                              className={`font-bold text-sm ${
                                isIncome ? 'text-emerald-400' : 'text-slate-100'
                              }`}
                            >
                              {isIncome ? '+' : '-'} {formatIDR(Number(t.amount) || 0)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingTransaction(t);
                                  setIsFormOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingId(t.id)}
                                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden divide-y divide-white/5 p-2">
                {transactions.map((t) => {
                  const isIncome = t.type === 'income';
                  return (
                    <div key={t.id} className="p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white text-sm">
                              {t.merchant_name}
                            </span>
                            {t.source === 'ai_scan' && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                AI
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {formatDateID(t.transaction_date)} • {t.category?.name || 'Umum'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-bold ${
                              isIncome ? 'text-emerald-400' : 'text-slate-100'
                            }`}
                          >
                            {isIncome ? '+' : '-'} {formatIDR(Number(t.amount) || 0)}
                          </p>
                          <TypeBadge type={t.type} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs text-slate-400">
                        <span>{t.payment_method}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingTransaction(t);
                              setIsFormOpen(true);
                            }}
                            className="text-cyan-400 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingId(t.id)}
                            className="text-rose-400 hover:underline"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Bar */}
              <div className="flex items-center justify-between p-4 border-t border-white/10 bg-slate-900/40 text-xs text-slate-400">
                <span>
                  Halaman <span className="text-white font-medium">{page}</span> dari{' '}
                  <span className="text-white font-medium">{totalPages}</span>
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Modal Form Tambah / Edit */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
        description="Pastikan data nominal dan kategori sudah sesuai."
      >
        <TransactionForm
          initialData={editingTransaction}
          categories={categories}
          onSuccess={() => {
            setIsFormOpen(false);
            fetchTransactions();
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Transaksi?"
        description="Transaksi yang dihapus tidak dapat dipulihkan kembali dan akan otomatis memperbarui saldo Anda."
        confirmLabel="Ya, Hapus"
        isLoading={isDeleting}
      />
    </AppShell>
  );
}
