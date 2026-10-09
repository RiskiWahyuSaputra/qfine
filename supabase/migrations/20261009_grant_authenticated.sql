-- ==============================================================================
-- Hak akses tabel untuk role `authenticated`
-- Project Supabase baru tidak lagi memberi GRANT otomatis ke tabel yang dibuat lewat SQL,
-- sehingga user yang login mendapat "permission denied for table ...". RLS tetap membatasi
-- setiap user hanya ke barisnya sendiri; GRANT ini hanya membuka akses tabelnya.
-- Role `anon` sengaja tidak diberi akses: QFine selalu masuk sebagai akun pemilik.
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.profiles,
  public.categories,
  public.transactions,
  public.budgets
TO authenticated;

-- Profil & kategori default untuk akun yang dibuat sebelum trigger handle_new_user terpasang
INSERT INTO public.profiles (id, full_name, currency, starting_balance)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', u.email), 'IDR', 0.00
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

INSERT INTO public.categories (user_id, name, type, icon, color)
SELECT u.id, c.name, c.type, c.icon, c.color
FROM auth.users u
CROSS JOIN (VALUES
  ('Makanan dan minuman', 'expense', 'Utensils', '#f97316'),
  ('Transportasi', 'expense', 'Car', '#06b6d4'),
  ('Belanja', 'expense', 'ShoppingBag', '#ec4899'),
  ('Tagihan', 'expense', 'Receipt', '#eab308'),
  ('Pendidikan', 'expense', 'GraduationCap', '#8b5cf6'),
  ('Kesehatan', 'expense', 'HeartPulse', '#ef4444'),
  ('Hiburan', 'expense', 'Film', '#a855f7'),
  ('Langganan', 'expense', 'CreditCard', '#3b82f6'),
  ('Tempat tinggal', 'expense', 'Home', '#10b981'),
  ('Lainnya', 'expense', 'MoreHorizontal', '#64748b'),
  ('Gaji', 'income', 'Briefcase', '#10b981'),
  ('Freelance', 'income', 'Laptop', '#06b6d4'),
  ('Bisnis', 'income', 'TrendingUp', '#3b82f6'),
  ('Transfer masuk', 'income', 'ArrowDownLeft', '#8b5cf6'),
  ('Hadiah', 'income', 'Gift', '#ec4899'),
  ('Lainnya', 'income', 'MoreHorizontal', '#64748b')
) AS c(name, type, icon, color)
WHERE NOT EXISTS (SELECT 1 FROM public.categories k WHERE k.user_id = u.id);
