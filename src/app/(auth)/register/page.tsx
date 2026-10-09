'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wallet, UserPlus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { createClient } from '@/lib/supabase/client';
import { registerSchema } from '@/lib/validations';

export default function RegisterPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = registerSchema.safeParse({
      full_name: fullName,
      email,
      password,
      confirm_password: confirmPassword,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toastError(error.message || 'Pendaftaran gagal.');
        setIsLoading(false);
        return;
      }

      if (data.session) {
        success('Pendaftaran berhasil! Mengarahkan ke dashboard...');
        router.push('/dashboard');
        router.refresh();
      } else {
        success('Akun dibuat! Silakan periksa email Anda untuk konfirmasi pendaftaran.');
        router.push('/login');
      }
    } catch {
      toastError('Terjadi kesalahan koneksi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/30 group-hover:scale-105 transition-transform">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
                QFine
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400">Your Money, Clearly Managed.</p>
            </div>
          </Link>
        </div>

        <Card className="border border-white/10 shadow-2xl backdrop-blur-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl">Buat Akun Baru</CardTitle>
            <CardDescription>
              Mulai kelola keuangan Anda dengan privasi dan integrasi AI
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nama Lengkap"
                placeholder="Misal: Riski Wahyu"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.full_name}
                disabled={isLoading}
                required
              />

              <Input
                label="Email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                disabled={isLoading}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                disabled={isLoading}
                required
              />

              <Input
                label="Konfirmasi Password"
                type="password"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirm_password}
                disabled={isLoading}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-6"
                isLoading={isLoading}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                <span>Daftar Akun</span>
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-slate-400">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                Masuk di sini
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
