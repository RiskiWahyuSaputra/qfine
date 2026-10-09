# QFine — Your Money, Clearly Managed

Aplikasi pencatatan keuangan pribadi modern dengan estetika Glassmorphism modern ala Telegram UI, ditenagai oleh Supabase (Auth, PostgreSQL DB, Storage) dan Google Gemini Flash (3.8) untuk pemindaian struk & bukti transaksi otomatis.

---

## 🌟 Fitur Utama

1. **AI Receipt & Payment Scanner (Google Gemini 3.8 Flash)**:
   - Ambil foto kamera langsung atau unggah gambar bukti struk / transfer (BCA, Mandiri, BRI, QRIS, GoPay, Dana, dll).
   - Ekstraksi otomatis terstruktur via Zod: Nominal, merchant/toko, tanggal, metode pembayaran, dan saran kategori.
   - Deteksi kemungkinan transaksi ganda (duplicate transaction check).
   - Layar konfirmasi & koreksi sebelum disimpan ke database.
   - File bukti tersimpan aman di Supabase Storage bucket privat (`receipts`).

2. **Dashboard Finansial Real-time**:
   - 4 Kartu Ringkasan: Saldo saat ini, total pemasukan bulan ini, pengeluaran bulan ini, dan selisih arus kas.
   - Grafik tren batang pemasukan vs pengeluaran 6 bulan terakhir (Recharts).
   - Grafik donat distribusi pengeluaran per kategori.
   - Quick action tambah transaksi cepat & scan struk.
   - Daftar 10 transaksi terbaru.

3. **Manajemen Transaksi Lengkap (CRUD)**:
   - Tambah, lihat detail, edit, dan hapus transaksi (dengan konfirmasi).
   - Filter lengkap: Rentang tanggal, tipe transaksi, kategori, dan metode pembayaran.
   - Pencarian real-time berdasarkan merchant dan deskripsi catatan.
   - Pagination dan Export transaksi ke format CSV.

4. **Statistik & Laporan Mendalam**:
   - Filter fleksibel: Minggu Ini, Bulan Ini, 3 Bulan, 6 Bulan, Tahun Ini, atau Semua Riwayat.
   - Rata-rata pengeluaran harian aktif.
   - Hari dengan pengeluaran terbesar (peak day).
   - Distribusi frekuensi metode pembayaran.
   - Peringkat 5 kategori pengeluaran terbesar dengan progress bar persentase.

5. **Anggaran Finansial Bulanan (Budgets)**:
   - Penetapan kuota pengeluaran per kategori per bulan/tahun.
   - Indikator progress bar pemakaian anggaran realtime.
   - Label status otomatis (*Aman* atau *Over Budget*).

6. **Keamanan & Autentikasi Modern**:
   - Tanpa halaman login: server masuk otomatis ke akun pemilik (Supabase Auth SSR), RLS tetap berlaku.
   - PostgreSQL Row Level Security (RLS) di seluruh tabel.
   - Pengguna hanya dapat mengakses dan mengelola datanya sendiri.

---

## 🚀 Cara Menjalankan Secara Lokal

### 1. Prasyarat Sistem
- **Node.js**: Versi 18.x, 20.x, atau 22.x+
- **npm** atau **pnpm / yarn**

### 2. Kloning dan Instalasi
```bash
# Masuk ke direktori proyek
cd /home/kiiyuu/Projects/project-web/qfine

# Install dependensi
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Isi variabel berikut di `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
GEMINI_API_KEY=<your-google-gemini-api-key>
GEMINI_MODEL=gemini-3.8-flash
# Akun Supabase pemilik (QFine tanpa halaman login, server masuk otomatis)
QFINE_EMAIL=<email-akun-supabase-anda>
QFINE_PASSWORD=<password-akun-supabase-anda>
```

### 4. Setup Database & Storage Supabase
1. Buat proyek baru di [Supabase Dashboard](https://supabase.com).
2. Buka menu **SQL Editor**, lalu jalankan query yang ada di:
   `supabase/migrations/20261009_init_schema.sql`
3. SQL tersebut secara otomatis membuat:
   - Tabel `profiles`, `categories`, `transactions`, dan `budgets`.
   - Seluruh aturan **Row Level Security (RLS)** untuk proteksi per-user.
   - Trigger otomatis pengisian profil dan kategori default saat registrasi akun baru.
   - Private bucket `receipts` pada Supabase Storage beserta policy aksesnya.

### 5. Jalankan Server Development
```bash
npm run dev
```
Buka browser pada: `http://localhost:3000`

### 6. Pengujian & Pengecekan Kualitas Kode
```bash
# Jalankan unit tests
npm test

# Jalankan pengecekan TypeScript
npm run typecheck

# Jalankan linting
npm run lint

# Jalankan production build
npm run build
```

---

## 🌐 Panduan Deployment ke Vercel

1. **Push ke GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete QFine personal finance tracker"
   git branch -M main
   git remote add origin https://github.com/RiskiWahyuSaputra/qfine.git # (atau repo keuangan Anda)
   git push -u origin main
   ```

2. **Import ke Vercel**:
   - Buka [vercel.com](https://vercel.com) dan login.
   - Klik **Add New Project** -> Pilih repositori GitHub Anda.
   - Framework preset otomatis terdeteksi sebagai **Next.js**.

3. **Atur Environment Variables di Vercel**:
   Di tab **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` = `gemini-3.8-flash`
   - `QFINE_EMAIL` & `QFINE_PASSWORD` (akun Supabase pemilik untuk masuk otomatis)
   - `QFINE_SHORTCUT_TOKEN` (opsional, untuk Pintasan iPhone: `POST /api/shortcut/scan` dengan header `Authorization: Bearer <token>` dan isi berupa gambar; transaksi langsung tersimpan)

4. **Deploy**:
   - Klik tombol **Deploy**.
   - Vercel akan otomatis menjalankan `npm run build` dan mendistribusikan aplikasi secara global di edge network.

---

## 🛠️ Penyelesaian Masalah Umum (Troubleshooting)

- **Gemini API Error / 503**: Pastikan `GEMINI_API_KEY` telah didapatkan dari Google AI Studio dan kuota API aktif.
- **Halaman "QFine belum siap"**: QFine tidak punya halaman login; server masuk otomatis memakai `QFINE_EMAIL` & `QFINE_PASSWORD`. Pastikan keduanya (beserta variabel Supabase) terisi di `.env.local` / Vercel Environment Variables dan akunnya sudah terdaftar di Supabase Auth. Karena tanpa login, siapa pun yang tahu URL aplikasi bisa membukanya — jangan bagikan URL deploy.
- **File struk tidak bisa dibuka**: Pastikan bucket `receipts` di Supabase Storage telah dibuat dengan setting **Private** dan script migration RLS telah dieksekusi.
