'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wallet, KeyRound } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { createClient } from '@/lib/supabase/client';
import { resetPasswordSchema } from '@/lib/validations';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = resetPasswordSchema.safeParse({
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
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toastError(error.message || 'Gagal mengubah kata sandi.');
        setIsLoading(false);
        return;
      }

      success('Kata sandi berhasil diperbarui! Silakan masuk kembali.');
      router.push('/login');
    } catch {
      toastError('Terjadi kesalahan koneksi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/30">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
                QFine
              </div>
              <p className="text-xs text-slate-400">Your Money, Clearly Managed.</p>
            </div>
          </Link>
        </div>

        <Card className="border border-white/10 shadow-2xl backdrop-blur-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl">Atur Ulang Kata Sandi</CardTitle>
            <CardDescription>
              Masukkan kata sandi baru untuk akun QFine Anda
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Kata Sandi Baru"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                disabled={isLoading}
                required
              />

              <Input
                label="Konfirmasi Kata Sandi"
                type="password"
                placeholder="Ulangi kata sandi baru"
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
                <KeyRound className="w-4 h-4 mr-2" />
                <span>Simpan Kata Sandi Baru</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
