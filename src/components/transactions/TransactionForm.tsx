'use client';

import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Transaction, Category, TransactionType, PaymentMethod } from '@/types/database';
import { transactionSchema } from '@/lib/validations';
import { useToast } from '@/components/ui/ToastProvider';
import { useCelebration } from '@/components/ui/CelebrationProvider';
import { cn } from '@/lib/utils';

interface TransactionFormProps {
  initialData?: Transaction | null;
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionForm({
  initialData,
  categories,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const { success, error: toastError } = useToast();
  const { rayakan } = useCelebration();
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  // Nominal disimpan sebagai angka saja; tampilannya diberi titik ribuan (50.000)
  const [amount, setAmount] = useState<string>(initialData ? String(Math.round(Number(initialData.amount))) : '');
  const [merchantName, setMerchantName] = useState(initialData?.merchant_name || '');
  const [senderOrReceiver, setSenderOrReceiver] = useState(initialData?.sender_or_receiver || '');
  // Form hanya dirender di browser (di dalam modal), jadi tanggal lokal hari ini aman dihitung di sini
  const [transactionDate, setTransactionDate] = useState(() => initialData?.transaction_date || hariIniLokal());
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initialData?.payment_method || 'Cash'
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [referenceNumber, setReferenceNumber] = useState(initialData?.reference_number || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  // Isian opsional dilipat; langsung terbuka bila sedang mengedit transaksi yang mengisinya
  const [detailTerbuka, setDetailTerbuka] = useState(
    Boolean(initialData?.reference_number || initialData?.sender_or_receiver || initialData?.description)
  );

  // Filter categories by selected transaction type
  const filteredCategories = categories.filter((c) => c.type === type);

  // Ganti jenis: kategori jenis lain dilepas (kategori pemasukan tidak berlaku untuk pengeluaran)
  const gantiJenis = (jenis: TransactionType) => {
    setType(jenis);
    if (categoryId && !categories.some((c) => c.id === categoryId && c.type === jenis)) setCategoryId('');
  };

  const handleSubmit = async (e: React.FormEvent, ignoreDuplicate = false) => {
    e.preventDefault();
    setErrors({});
    setDuplicateWarning(null);

    const numAmount = parseFloat(amount);
    const validation = transactionSchema.safeParse({
      type,
      amount: numAmount,
      merchant_name: merchantName,
      sender_or_receiver: senderOrReceiver || null,
      transaction_date: transactionDate,
      category_id: categoryId || null,
      payment_method: paymentMethod,
      description: description || null,
      reference_number: referenceNumber || null,
      source: initialData?.source || 'manual',
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
      const payload = {
        ...validation.data,
        ignoreDuplicateWarning: ignoreDuplicate,
      };

      const url = initialData ? `/api/transactions/${initialData.id}` : '/api/transactions';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        toastError(resData.error || 'Gagal menyimpan transaksi.');
        setIsLoading(false);
        return;
      }

      if (resData.warning === 'duplicate_detected') {
        setDuplicateWarning(resData.message);
        setIsLoading(false);
        return;
      }

      // Pemasukan baru dirayakan dengan popup; edit & pengeluaran cukup toast
      if (!initialData && validation.data.type === 'income') {
        rayakan({
          jenis: 'pemasukan',
          nominal: validation.data.amount,
          judul: validation.data.merchant_name,
          keterangan: 'Saldo Anda bertambah. Terus pertahankan!',
        });
      } else {
        success(initialData ? 'Transaksi berhasil diperbarui!' : 'Transaksi berhasil ditambahkan!');
      }
      onSuccess();
    } catch {
      toastError('Terjadi kesalahan jaringan.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
      {duplicateWarning && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
          <p className="font-semibold flex items-center gap-1.5">
            ⚠️ Transaksi Serupa Terdeteksi
          </p>
          <p>{duplicateWarning}</p>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={(e) => handleSubmit(e, true)}
              isLoading={isLoading}
            >
              Tetap Simpan Transaksi Ini
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDuplicateWarning(null)}
            >
              Ubah Data
            </Button>
          </div>
        </div>
      )}

      {/* Jenis transaksi: segmen dengan sorotan yang bergeser */}
      <div className="relative grid grid-cols-2 p-1 rounded-2xl glass-subtle">
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-xl border transition-all duration-300 ease-out',
            type === 'expense'
              ? 'translate-x-0 bg-rose-500/20 border-rose-400/40 shadow-[0_6px_20px_-6px_rgba(244,63,94,0.5)]'
              : 'translate-x-full bg-emerald-500/20 border-emerald-400/40 shadow-[0_6px_20px_-6px_rgba(16,185,129,0.5)]'
          )}
        />
        {([
          ['expense', 'Pengeluaran', ArrowUpRight, 'text-rose-300'],
          ['income', 'Pemasukan', ArrowDownLeft, 'text-emerald-300'],
        ] as const).map(([nilai, label, Ikon, warna]) => (
          <button
            key={nilai}
            type="button"
            onClick={() => gantiJenis(nilai)}
            aria-pressed={type === nilai}
            className={cn(
              'relative z-10 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-xl',
              type === nilai ? warna : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Ikon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Nominal: isian utama, besar & berformat ribuan */}
      <div className="space-y-1.5">
        <label htmlFor="nominal-transaksi" className="block text-xs font-medium text-slate-300">
          Nominal
        </label>
        <div
          className={cn(
            'flex items-baseline gap-2 px-4 py-3 rounded-2xl glass-input focus-within:border-cyan-300/60 focus-within:ring-[3px] focus-within:ring-cyan-400/20',
            errors.amount && 'border-rose-500/80'
          )}
        >
          <span className={cn('text-lg font-bold', type === 'expense' ? 'text-rose-300' : 'text-emerald-300')}>Rp</span>
          <input
            id="nominal-transaksi"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={amount ? Number(amount).toLocaleString('id-ID') : ''}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''))}
            disabled={isLoading}
            required
            className="min-w-0 flex-1 bg-transparent border-0 p-0 text-[1.75rem]! font-bold text-white tracking-tight tabular-nums placeholder:text-slate-600 focus:outline-none"
          />
        </div>
        {errors.amount && <p className="text-xs text-rose-400 font-medium">{errors.amount}</p>}
      </div>

      <Input
        label={type === 'expense' ? 'Nama Merchant / Toko' : 'Sumber Pemasukan'}
        placeholder={type === 'expense' ? 'Misal: Indomaret, Kopi Kenangan' : 'Misal: Gaji Kantor, Proyek'}
        value={merchantName}
        onChange={(e) => setMerchantName(e.target.value)}
        error={errors.merchant_name}
        disabled={isLoading}
        required
      />

      {/* Kategori: chip yang bisa langsung diketuk */}
      <div className="space-y-1.5">
        <span className="block text-xs font-medium text-slate-300">Kategori</span>
        <div className="flex flex-wrap gap-2">
          {filteredCategories.map((c) => {
            const aktif = categoryId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(aktif ? '' : c.id)}
                aria-pressed={aktif}
                disabled={isLoading}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  aktif ? 'text-white' : 'text-slate-300 border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
                )}
                style={aktif ? { backgroundColor: `${c.color}33`, borderColor: `${c.color}88` } : undefined}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                {c.name}
              </button>
            );
          })}
          {filteredCategories.length === 0 && <p className="text-xs text-slate-500">Belum ada kategori untuk jenis ini.</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Tanggal"
          type="date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
          error={errors.transaction_date}
          disabled={isLoading}
          required
        />
        <Select
          label="Metode"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          disabled={isLoading}
        >
          <option value="Cash">Cash</option>
          <option value="Transfer bank">Transfer bank</option>
          <option value="QRIS">QRIS</option>
          <option value="E-wallet">E-wallet</option>
          <option value="Kartu debit/kredit">Kartu debit/kredit</option>
          <option value="Lainnya">Lainnya</option>
        </Select>
      </div>

      {/* Isian opsional dilipat supaya form singkat */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
        <button
          type="button"
          onClick={() => setDetailTerbuka((v) => !v)}
          aria-expanded={detailTerbuka}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-300"
        >
          <span>Detail tambahan <span className="font-normal text-slate-500">(opsional)</span></span>
          <ChevronDown className={cn('w-4 h-4 transition-transform duration-300', detailTerbuka && 'rotate-180')} />
        </button>
        <div className={cn('grid transition-[grid-template-rows] duration-300 ease-out', detailTerbuka ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
          <div className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3">
              <Input
                label="Catatan"
                placeholder="Misal: Beli makan malam bersama teman"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
              />
              <Input
                label={type === 'expense' ? 'Penerima' : 'Pengirim'}
                placeholder={type === 'expense' ? 'Misal: Rekening tujuan' : 'Misal: PT Teknologi'}
                value={senderOrReceiver}
                onChange={(e) => setSenderOrReceiver(e.target.value)}
                disabled={isLoading}
              />
              <Input
                label="No. Referensi / ID Struk"
                placeholder="Misal: TRX-889102"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tombol tetap terlihat di bawah saat form digulir (HP) */}
      <div className="sticky bottom-0 -mx-1 px-1 pt-3 pb-1 flex gap-3 bg-gradient-to-t from-slate-900/95 via-slate-900/80 to-transparent">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading} className="flex-1 sm:flex-none">
          Batal
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading} className="flex-[2] sm:flex-none sm:ml-auto">
          {initialData ? 'Perbarui Transaksi' : 'Simpan Transaksi'}
        </Button>
      </div>
    </form>
  );
}

function hariIniLokal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
