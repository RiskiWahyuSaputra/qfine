import { describe, it, expect } from 'vitest';
import { calculateFinancialSummary, filterTransactionsByPeriod } from '@/lib/calculations';
import { Transaction } from '@/types/database';

const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    user_id: 'user-1',
    category_id: 'cat-1',
    type: 'income',
    amount: 10000000,
    merchant_name: 'Gaji Bulanan',
    transaction_date: '2026-10-01',
    payment_method: 'Transfer bank',
    source: 'manual',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 'tx-2',
    user_id: 'user-1',
    category_id: 'cat-2',
    type: 'expense',
    amount: 250000,
    merchant_name: 'Supermarket',
    transaction_date: '2026-10-05',
    payment_method: 'QRIS',
    source: 'ai_scan',
    created_at: '2026-10-05T12:00:00Z',
    updated_at: '2026-10-05T12:00:00Z',
  },
  {
    id: 'tx-3',
    user_id: 'user-1',
    category_id: 'cat-3',
    type: 'expense',
    amount: 150000,
    merchant_name: 'Tagihan Listrik',
    transaction_date: '2026-09-15',
    payment_method: 'Transfer bank',
    source: 'manual',
    created_at: '2026-09-15T10:00:00Z',
    updated_at: '2026-09-15T10:00:00Z',
  },
];

describe('Financial Summary Calculations', () => {
  it('harus menghitung saldo total saat ini dengan benar sesuai saldo awal', () => {
    const startingBalance = 500000;
    const summary = calculateFinancialSummary(mockTransactions, startingBalance, 10, 2026);

    // Saldo = 500.000 + 10.000.000 - (250.000 + 150.000) = 10.100.000
    expect(summary.totalIncome).toBe(10000000);
    expect(summary.totalExpense).toBe(400000);
    expect(summary.currentBalance).toBe(10100000);
  });

  it('harus menghitung selisih pemasukan dan pengeluaran bulan target (Oktober 2026)', () => {
    const summary = calculateFinancialSummary(mockTransactions, 0, 10, 2026);
    // Oktober: Income 10.000.000, Expense 250.000
    expect(summary.netSavingsThisMonth).toBe(10000000 - 250000);
  });
});

describe('Period Filter Calculations', () => {
  const refDate = new Date('2026-10-09T10:00:00Z');

  it('harus memfilter transaksi bulan ini saja', () => {
    const thisMonth = filterTransactionsByPeriod(mockTransactions, 'this_month', refDate);
    expect(thisMonth).toHaveLength(2);
    expect(thisMonth.map((t) => t.id)).toEqual(['tx-1', 'tx-2']);
  });

  it('harus mengembalikan semua transaksi saat filter all dipilih', () => {
    const all = filterTransactionsByPeriod(mockTransactions, 'all', refDate);
    expect(all).toHaveLength(3);
  });
});
