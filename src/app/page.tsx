import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Wallet, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              QFine
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                AI
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Masuk
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm">
              Daftar Sekarang
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <main className="max-w-4xl mx-auto my-auto text-center py-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-cyan-500/30 text-xs font-semibold text-cyan-300 mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Didukung Google Gemini AI 2.5 Flash Vision</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
          Your Money, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
            Clearly Managed.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
          Pencatatan keuangan pribadi modern dengan estetika Glassmorphism ala Telegram.
          Pindai struk belanja atau bukti transfer bank seketika dengan AI, pantau anggaran bulanan, dan kelola saldo secara transparan.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              <span>Buka Dashboard</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
          <Link href="/scan" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              <Sparkles className="w-4 h-4 text-cyan-400 mr-2" />
              <span>Coba Scanner Bukti AI</span>
            </Button>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
          <div className="glass-card p-6 rounded-2xl">
            <div className="p-3 w-fit rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">AI Receipt Scanner</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ekstraksi struk & bukti transfer otomatis menjadi nominal, merchant, tanggal, dan kategori tanpa salah ketik.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="p-3 w-fit rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Analitik & Anggaran</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pantau arus kas, grafik kategori pengeluaran terbesar, dan batas anggaran bulanan secara visual real-time.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="p-3 w-fit rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Supabase Auth & RLS</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Keamanan tingkat enterprise dengan PostgreSQL Row Level Security. Data dan foto struk tersimpan privat.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center py-6 border-t border-white/5 text-xs text-slate-500">
        © 2026 QFine. Dibuat untuk privasi dan kemudahan finansial harian Anda.
      </footer>
    </div>
  );
}
