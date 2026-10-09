'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Wallet, KeyRound, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { createClient } from '@/lib/supabase/client';
import { forgotPasswordSchema } from '@/lib/validations';

export default function ForgotPasswordPage() {
  const { success, error: toastError } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Email tidak valid');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        toastError(resetError.message || 'Gagal mengirim instruksi reset password.');
        setIsLoading(false);
        return;
      }

      setIsSubmitted(true);
      success('Tautan pemulihan kata sandi telah dikirim ke email Anda.');
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
            <CardTitle className="text-xl">Lupa Password?</CardTitle>
            <CardDescription>
              {isSubmitted
                ? 'Periksa kotak masuk email Anda untuk instruksi pemulihan kata sandi.'
                : 'Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur ulang password Anda.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email Terdaftar"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
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
                  <span>Kirim Tautan Reset</span>
                </Button>
              </form>
            ) : (
              <div className="text-center py-4 space-y-4">
                <p className="text-xs text-slate-300">
                  Email reset kata sandi telah dikirim ke <span className="font-semibold text-cyan-400">{email}</span>.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsSubmitted(false)}
                >
                  Kirim Ulang
                </Button>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                <span>Kembali ke halaman login</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
