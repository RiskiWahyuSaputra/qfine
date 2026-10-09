'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/ToastProvider';
import { Profile } from '@/types/database';
import { User, Wallet, Shield, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const { success, error: toastError } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [startingBalance, setStartingBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/profile');
        const json = await res.json();
        if (json.data) {
          setProfile(json.data);
          setFullName(json.data.full_name || '');
          setCurrency(json.data.currency || 'IDR');
          setStartingBalance(String(json.data.starting_balance || 0));
        }
      } catch {
        toastError('Gagal memuat profil pengguna.');
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [toastError]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          currency,
          starting_balance: parseFloat(startingBalance) || 0,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toastError(json.error || 'Gagal menyimpan pengaturan.');
        setIsSaving(false);
        return;
      }

      setProfile(json.data);
      success('Profil dan saldo awal berhasil diperbarui!');
    } catch {
      toastError('Terjadi kesalahan jaringan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell title="Pengaturan Akun">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile & Financial Settings */}
        <Card className="p-6">
          <CardHeader className="pb-4 border-b border-white/10">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span>Profil & Preferensi Keuangan</span>
            </CardTitle>
            <CardDescription>
              Atur nama tampilan, saldo awal, dan preferensi mata uang akun Anda
            </CardDescription>
          </CardHeader>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Memuat pengaturan profil...
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-4">
              <Input
                label="Nama Lengkap"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama Anda"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Saldo Awal Akun (Rp)"
                  type="number"
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(e.target.value)}
                  placeholder="0"
                  helperText="Saldo sebelum pencatatan transaksi dimulai"
                />

                <Select
                  label="Mata Uang"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="IDR">IDR (Rupiah Indonesia)</option>
                  <option value="USD">USD (US Dollar)</option>
                </Select>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary" isLoading={isSaving}>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  <span>Simpan Perubahan</span>
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Security & System Info */}
        <Card className="p-6">
          <CardHeader className="pb-4 border-b border-white/10">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Keamanan & Data Akun</span>
            </CardTitle>
            <CardDescription>
              Informasi perlindungan data dan integrasi AI pada QFine
            </CardDescription>
          </CardHeader>

          <div className="pt-4 space-y-3 text-xs text-slate-300">
            <div className="p-3.5 rounded-xl glass-subtle flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">ID Pengguna (Supabase Auth)</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {profile?.id || 'Memuat...'}
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                RLS Terproteksi
              </span>
            </div>

            <div className="p-3.5 rounded-xl glass-subtle flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Penyimpanan Bukti (Supabase Storage)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Private bucket receipts dengan Signed URL
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                Terenkripsi
              </span>
            </div>

            <div className="p-3.5 rounded-xl glass-subtle flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Model AI Receipt Scanner</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Google Gemini 3.8 Flash, cadangan Groq (Server-side Execution)
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Aktif
              </span>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
