'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Wallet, LogIn } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { createClient } from '@/lib/supabase/client';
import { loginSchema } from '@/lib/validations';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = loginSchema.safeParse({ email, password });
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toastError(error.message || 'Gagal masuk akun. Periksa email & password.');
        setIsLoading(false);
        return;
      }

      success('Berhasil masuk! Mengarahkan ke dashboard...');
      router.push(redirectPath);
      router.refresh();
    } catch {
      toastError('Terjadi kesalahan koneksi ke server.');
      setIsLoading(false);
    }
  };

  return (
    <Card className="border border-white/10 shadow-2xl backdrop-blur-2xl">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-xl">Masuk ke Akun</CardTitle>
        <CardDescription>
          Akses pencatatan keuangan pribadi dan scanner bukti AI Anda
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Lupa password?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={isLoading}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-6"
            isLoading={isLoading}
          >
            <LogIn className="w-4 h-4 mr-2" />
            <span>Masuk Sekarang</span>
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-slate-400">
          Belum punya akun?{' '}
          <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold">
            Daftar sekarang
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative">
      <div className="w-full max-w-md">
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

        <Suspense fallback={<div className="text-center text-slate-400 py-8">Memuat form masuk...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
