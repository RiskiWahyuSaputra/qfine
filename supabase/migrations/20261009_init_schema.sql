-- ==============================================================================
-- QFine Database Schema Migration
-- Personal Finance Tracker with Supabase Auth, PostgreSQL, & Row-Level Security
-- ==============================================================================

-- 1. PROFILES TABLE
-- Menyimpan profil pengguna, preferensi mata uang, dan saldo awal
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  currency TEXT NOT NULL DEFAULT 'IDR',
  starting_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. CATEGORIES TABLE
-- Kategori pemasukan dan pengeluaran per-user (bisa custom)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT NOT NULL DEFAULT 'Tag',
  color TEXT NOT NULL DEFAULT '#0284c7',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_categories_user_type ON public.categories(user_id, type);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3. TRANSACTIONS TABLE
-- Transaksi keuangan (pemasukan/pengeluaran) lengkap dengan metadata scan AI
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  merchant_name TEXT NOT NULL,
  sender_or_receiver TEXT,
  transaction_date DATE NOT NULL,
  transaction_time TIME,
  payment_method TEXT NOT NULL DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Transfer bank', 'QRIS', 'E-wallet', 'Kartu debit/kredit', 'Lainnya')),
  description TEXT,
  reference_number TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai_scan')),
  receipt_path TEXT,
  confidence NUMERIC(4, 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_duplicate ON public.transactions(user_id, amount, transaction_date, merchant_name);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. BUDGETS TABLE
-- Anggaran per-kategori per-bulan
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INT NOT NULL CHECK (period_year BETWEEN 2000 AND 2100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_user_category_period UNIQUE (user_id, category_id, period_month, period_year)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON public.budgets(user_id, period_year, period_month);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Profiles RLS
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Categories RLS
CREATE POLICY "Users can read own categories"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- Transactions RLS
CREATE POLICY "Users can read own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Budgets RLS
CREATE POLICY "Users can read own budgets"
  ON public.budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON public.budgets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON public.budgets FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION & DEFAULT CATEGORIES ON USER SIGNUP
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  uid UUID := NEW.id;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, currency, starting_balance)
  VALUES (
    uid,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'IDR',
    0.00
  );

  -- Insert Default Expense Categories
  INSERT INTO public.categories (user_id, name, type, icon, color) VALUES
    (uid, 'Makanan dan minuman', 'expense', 'Utensils', '#f97316'),
    (uid, 'Transportasi', 'expense', 'Car', '#06b6d4'),
    (uid, 'Belanja', 'expense', 'ShoppingBag', '#ec4899'),
    (uid, 'Tagihan', 'expense', 'Receipt', '#eab308'),
    (uid, 'Pendidikan', 'expense', 'GraduationCap', '#8b5cf6'),
    (uid, 'Kesehatan', 'expense', 'HeartPulse', '#ef4444'),
    (uid, 'Hiburan', 'expense', 'Film', '#a855f7'),
    (uid, 'Langganan', 'expense', 'CreditCard', '#3b82f6'),
    (uid, 'Tempat tinggal', 'expense', 'Home', '#10b981'),
    (uid, 'Lainnya', 'expense', 'MoreHorizontal', '#64748b');

  -- Insert Default Income Categories
  INSERT INTO public.categories (user_id, name, type, icon, color) VALUES
    (uid, 'Gaji', 'income', 'Briefcase', '#10b981'),
    (uid, 'Freelance', 'income', 'Laptop', '#06b6d4'),
    (uid, 'Bisnis', 'income', 'TrendingUp', '#3b82f6'),
    (uid, 'Transfer masuk', 'income', 'ArrowDownLeft', '#8b5cf6'),
    (uid, 'Hadiah', 'income', 'Gift', '#ec4899'),
    (uid, 'Lainnya', 'income', 'MoreHorizontal', '#64748b');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- STORAGE BUCKET SETUP: receipts (Private Bucket)
-- Catatan: Jalankan ini di SQL Editor Supabase untuk membuat bucket privat & RLS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Storage: Pengguna hanya boleh mengunggah dan membaca file mereka sendiri di folder [user_id]/*
CREATE POLICY "Users can upload their own receipt files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own receipt files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own receipt files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
