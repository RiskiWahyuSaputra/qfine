export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TransactionType = 'income' | 'expense';

export type PaymentMethod =
  | 'Cash'
  | 'Transfer bank'
  | 'QRIS'
  | 'E-wallet'
  | 'Kartu debit/kredit'
  | 'Lainnya';

export type TransactionSource = 'manual' | 'ai_scan';

export interface Profile {
  id: string;
  full_name: string | null;
  currency: string;
  starting_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  merchant_name: string;
  sender_or_receiver?: string | null;
  transaction_date: string; // YYYY-MM-DD
  transaction_time?: string | null; // HH:mm:ss
  payment_method: PaymentMethod;
  description?: string | null;
  reference_number?: string | null;
  source: TransactionSource;
  receipt_path?: string | null;
  confidence?: number | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period_month: number; // 1 - 12
  period_year: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name?: string | null;
          currency?: string;
          starting_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          currency?: string;
          starting_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: Category;
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: TransactionType;
          icon?: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: TransactionType;
          icon?: string;
          color?: string;
          created_at?: string;
        };
      };
      transactions: {
        Row: Transaction;
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          type: TransactionType;
          amount: number;
          merchant_name: string;
          sender_or_receiver?: string | null;
          transaction_date: string;
          transaction_time?: string | null;
          payment_method?: PaymentMethod;
          description?: string | null;
          reference_number?: string | null;
          source?: TransactionSource;
          receipt_path?: string | null;
          confidence?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          type?: TransactionType;
          amount?: number;
          merchant_name?: string;
          sender_or_receiver?: string | null;
          transaction_date?: string;
          transaction_time?: string | null;
          payment_method?: PaymentMethod;
          description?: string | null;
          reference_number?: string | null;
          source?: TransactionSource;
          receipt_path?: string | null;
          confidence?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: Budget;
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          amount: number;
          period_month: number;
          period_year: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          amount?: number;
          period_month?: number;
          period_year?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
