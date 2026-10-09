'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Transaction, Category, TransactionType, PaymentMethod } from '@/types/database';
import { transactionSchema } from '@/lib/validations';
import { useToast } from '@/components/ui/ToastProvider';
import { useCelebration } from '@/components/ui/CelebrationProvider';

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
  const [amount, setAmount] = useState<string>(initialData ? String(initialData.amount) : '');
  const [merchantName, setMerchantName] = useState(initialData?.merchant_name || '');
  const [senderOrReceiver, setSenderOrReceiver] = useState(initialData?.sender_or_receiver || '');
  const [transactionDate, setTransactionDate] = useState(
    initialData?.transaction_date || '2026-10-09'
  );

  useEffect(() => {
    if (!initialData) {
      setTransactionDate(new Date().toISOString().slice(0, 10));
    }
  }, [initialData]);
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initialData?.payment_method || 'Cash'
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [referenceNumber, setReferenceNumber] = useState(initialData?.reference_number || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Filter categories by selected transaction type
  const filteredCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    // If current category does not match the active type, reset to first matching
    if (categoryId && !filteredCategories.some((c) => c.id === categoryId)) {
      setCategoryId(filteredCategories[0]?.id || '');
    }
  }, [type, filteredCategories, categoryId]);

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

      {/* Type Toggle Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl glass-subtle">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`py-2 text-xs font-semibold rounded-lg transition-all ${
            type === 'expense'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`py-2 text-xs font-semibold rounded-lg transition-all ${
            type === 'income'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Pemasukan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nominal Transaksi (Rp)"
          type="number"
          placeholder="Misal: 50000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          disabled={isLoading}
          required
        />

        <Input
          label="Tanggal"
          type="date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
          error={errors.transaction_date}
          disabled={isLoading}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={type === 'expense' ? 'Nama Merchant / Toko' : 'Sumber Pemasukan'}
          placeholder={type === 'expense' ? 'Misal: Indomaret, Kopi Kenangan' : 'Misal: Gaji Kantor, Proyek'}
          value={merchantName}
          onChange={(e) => setMerchantName(e.target.value)}
          error={errors.merchant_name}
          disabled={isLoading}
          required
        />

        <Select
          label="Kategori"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Pilih Kategori</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Metode Pembayaran"
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

        <Input
          label="No Referensi / ID Struk (Opsional)"
          placeholder="Misal: TRX-889102"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <Input
        label="Pengirim / Penerima (Opsional)"
        placeholder="Misal: PT Teknologi / Rekening Tujuan"
        value={senderOrReceiver}
        onChange={(e) => setSenderOrReceiver(e.target.value)}
        disabled={isLoading}
      />

      <Input
        label="Catatan Tambahan (Opsional)"
        placeholder="Misal: Beli makan malam bersama teman"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isLoading}
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Batal
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {initialData ? 'Perbarui Transaksi' : 'Simpan Transaksi'}
        </Button>
      </div>
    </form>
  );
}
