import { Transaction } from '@/types/database';

export interface FinancialSummary {
  startingBalance: number;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  netSavingsThisMonth: number;
}

/**
 * Menghitung saldo saat ini dan total pemasukan & pengeluaran
 */
export function calculateFinancialSummary(
  transactions: Transaction[],
  startingBalance: number = 0,
  targetMonth?: number,
  targetYear?: number
): FinancialSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  let monthIncome = 0;
  let monthExpense = 0;

  for (const t of transactions) {
    const amount = Number(t.amount) || 0;
    const [y, m] = t.transaction_date.split('-').map(Number);

    if (t.type === 'income') {
      totalIncome += amount;
      if (targetMonth && targetYear && y === targetYear && m === targetMonth) {
        monthIncome += amount;
      }
    } else if (t.type === 'expense') {
      totalExpense += amount;
      if (targetMonth && targetYear && y === targetYear && m === targetMonth) {
        monthExpense += amount;
      }
    }
  }

  const currentBalance = startingBalance + totalIncome - totalExpense;
  const netSavingsThisMonth = monthIncome - monthExpense;

  return {
    startingBalance,
    totalIncome,
    totalExpense,
    currentBalance,
    netSavingsThisMonth,
  };
}

/**
 * Filter transaksi berdasarkan rentang tanggal atau preset
 */
export type PeriodFilter = 'all' | 'this_week' | 'this_month' | 'last_3_months' | 'last_6_months' | 'this_year';

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: PeriodFilter,
  referenceDate?: Date
): Transaction[] {
  if (period === 'all') return transactions;

  const ref = referenceDate ? new Date(referenceDate) : new Date(2026, 9, 9);
  const currentYear = ref.getFullYear();
  const currentMonth = ref.getMonth(); // 0-indexed

  return transactions.filter((t) => {
    const tDate = new Date(t.transaction_date);
    if (isNaN(tDate.getTime())) return false;

    if (period === 'this_month') {
      return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
    }

    if (period === 'this_year') {
      return tDate.getFullYear() === currentYear;
    }

    if (period === 'this_week') {
      const startOfWeek = new Date(ref);
      const day = startOfWeek.getDay() || 7; // Monday is 1
      startOfWeek.setDate(startOfWeek.getDate() - day + 1);
      startOfWeek.setHours(0, 0, 0, 0);
      return tDate >= startOfWeek && tDate <= ref;
    }

    if (period === 'last_3_months') {
      const threeMonthsAgo = new Date(ref);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return tDate >= threeMonthsAgo && tDate <= ref;
    }

    if (period === 'last_6_months') {
      const sixMonthsAgo = new Date(ref);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return tDate >= sixMonthsAgo && tDate <= ref;
    }

    return true;
  });
}
