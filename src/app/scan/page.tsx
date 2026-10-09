'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/ToastProvider';
import { useCelebration } from '@/components/ui/CelebrationProvider';
import { AIReceiptExtraction } from '@/lib/validations';
import { formatIDR } from '@/lib/utils';
import {
  Upload,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import Image from 'next/image';

export default function ReceiptScannerPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { rayakan } = useCelebration();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Extracted Result & Editable State
  const [scanResult, setScanResult] = useState<AIReceiptExtraction | null>(null);
  const [receiptStoragePath, setReceiptStoragePath] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    type: 'income' | 'expense';
    amount: string;
    merchantName: string;
    transactionDate: string;
    paymentMethod: string;
    categorySuggestion: string;
    description: string;
    referenceNumber: string;
  }>({
    type: 'expense',
    amount: '',
    merchantName: '',
    transactionDate: '2026-10-09',
    paymentMethod: 'Cash',
    categorySuggestion: 'Makanan dan minuman',
    description: '',
    referenceNumber: '',
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      transactionDate: new Date().toISOString().slice(0, 10),
    }));
  }, []);

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      toastError('Harap pilih file gambar (JPG, PNG, atau WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toastError('Ukuran file maksimal adalah 8MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setScanResult(null);
    setDuplicateWarning(null);
  };

  const handleStartScan = async () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setScanResult(null);
    setDuplicateWarning(null);

    try {
      const data = new FormData();
      data.append('file', selectedFile);

      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        body: data,
      });

      const resData = await res.json();

      if (!res.ok) {
        toastError(resData.error || 'Gagal memindai bukti transaksi dengan AI.');
        setIsScanning(false);
        return;
      }

      const extracted: AIReceiptExtraction = resData.data;
      setScanResult(extracted);
      setReceiptStoragePath(resData.receipt_path || null);

      // Populate Editable Form
      setFormData({
        type: extracted.transaction_type,
        amount: String(extracted.amount),
        merchantName: extracted.merchant_name,
        transactionDate: extracted.transaction_date,
        paymentMethod: extracted.payment_method,
        categorySuggestion: extracted.category_suggestion || 'Makanan dan minuman',
        description: extracted.description || '',
        referenceNumber: extracted.reference_number || '',
      });

      success('Bukti transaksi berhasil diekstraksi oleh Gemini AI!');
    } catch {
      toastError('Terjadi kesalahan koneksi saat memindai.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmAndSave = async (ignoreDuplicate = false) => {
    setIsSaving(true);
    setDuplicateWarning(null);

    try {
      const numAmount = parseFloat(formData.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        toastError('Nominal harus berupa angka lebih dari 0.');
        setIsSaving(false);
        return;
      }

      const payload = {
        type: formData.type,
        amount: numAmount,
        merchant_name: formData.merchantName,
        transaction_date: formData.transactionDate,
        payment_method: formData.paymentMethod,
        description: formData.description || null,
        reference_number: formData.referenceNumber || null,
        source: 'ai_scan',
        receipt_path: receiptStoragePath,
        confidence: scanResult?.confidence || 0.9,
        ignoreDuplicateWarning: ignoreDuplicate,
      };

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        toastError(resData.error || 'Gagal menyimpan transaksi.');
        setIsSaving(false);
        return;
      }

      if (resData.warning === 'duplicate_detected') {
        setDuplicateWarning(resData.message);
        setIsSaving(false);
        return;
      }

      rayakan({
        jenis: 'scan',
        tipe: formData.type,
        nominal: numAmount,
        judul: formData.merchantName || 'Transaksi tersimpan',
        keterangan: 'Dibaca otomatis oleh Gemini AI dan sudah masuk ke catatan keuangan Anda.',
      });
      router.push('/dashboard');
    } catch {
      toastError('Gagal menyimpan data.');
      setIsSaving(false);
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setDuplicateWarning(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <AppShell title="AI Receipt Scanner">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Info */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                Pindai Bukti Pembayaran / Struk Otomatis
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Unggah struk belanja, tiket, atau screenshot transfer (BCA, Mandiri, BRI, QRIS, GoPay, Dana).
              AI akan membaca nominal, toko, tanggal, dan menyarankan kategori otomatis.
            </p>
          </div>

          {previewUrl && (
            <Button variant="secondary" size="sm" onClick={resetAll} disabled={isScanning || isSaving}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              <span>Pindai Bukti Baru</span>
            </Button>
          )}
        </div>

        {/* Duplicate Warning Prompt */}
        {duplicateWarning && (
          <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Kemungkinan Transaksi Duplikat Terdeteksi</span>
            </div>
            <p>{duplicateWarning}</p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleConfirmAndSave(true)}
                isLoading={isSaving}
              >
                Tetap Simpan Transaksi
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDuplicateWarning(null)}
              >
                Batal / Periksa Kembali
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Upload or Preview Section */}
        {!scanResult ? (
          <Card className="p-8 text-center flex flex-col items-center justify-center">
            {/* Hidden Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {!previewUrl ? (
              <div className="max-w-md w-full space-y-5">
                <div className="p-5 rounded-3xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 w-fit mx-auto">
                  <Upload className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Unggah Bukti Transaksi</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Pilih gambar struk dari galeri perangkat Anda atau ambil foto kamera langsung
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full sm:w-auto"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    <span>Ambil Foto</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    <span>Pilih dari Galeri</span>
                  </Button>
                </div>
                <p className="text-[11px] text-slate-500">Mendukung format JPG, PNG, WEBP hingga 8MB</p>
              </div>
            ) : (
              <div className="max-w-lg w-full space-y-4">
                <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-white/10 glass-subtle">
                  <Image
                    src={previewUrl}
                    alt="Preview Struk"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={resetAll}
                    disabled={isScanning}
                  >
                    Ganti Gambar
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleStartScan}
                    isLoading={isScanning}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span>{isScanning ? 'Menganalisis dengan AI...' : 'Scan Sekarang'}</span>
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ) : (
          /* Step 2: Confirmation & Edit Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Receipt Preview Image */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Bukti Asli</span>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Keyakinan AI: {(scanResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                {previewUrl && (
                  <div className="relative w-full h-96 rounded-xl overflow-hidden border border-white/10 bg-slate-950/40">
                    <Image
                      src={previewUrl}
                      alt="Bukti Struk"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                {scanResult.uncertain_fields && scanResult.uncertain_fields.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Harap periksa ulang field berikut: {scanResult.uncertain_fields.join(', ')}
                    </span>
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Confirmation Form */}
            <div className="lg:col-span-7">
              <Card className="p-6 space-y-5">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white">Konfirmasi Data Transaksi</h3>
                  <p className="text-xs text-slate-400">
                    AI telah mengisi rincian di bawah. Anda dapat mengoreksi data sebelum menyimpannya ke database.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Type Selector */}
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl glass-subtle">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'expense' })}
                      className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                        formData.type === 'expense'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'text-slate-400'
                      }`}
                    >
                      Pengeluaran
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'income' })}
                      className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                        formData.type === 'income'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-400'
                      }`}
                    >
                      Pemasukan
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Nominal Pembayaran (Rp)"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                    <Input
                      label="Tanggal Transaksi"
                      type="date"
                      value={formData.transactionDate}
                      onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Nama Merchant / Toko"
                      value={formData.merchantName}
                      onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                      required
                    />
                    <Select
                      label="Metode Pembayaran"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Transfer bank">Transfer bank</option>
                      <option value="QRIS">QRIS</option>
                      <option value="E-wallet">E-wallet</option>
                      <option value="Kartu debit/kredit">Kartu debit/kredit</option>
                      <option value="Lainnya">Lainnya</option>
                    </Select>
                  </div>

                  <Input
                    label="Nomor Referensi / ID Struk"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    placeholder="Opsional"
                  />

                  <Input
                    label="Deskripsi / Catatan"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Opsional"
                  />
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Total: <span className="font-bold text-white text-sm">{formatIDR(Number(formData.amount) || 0)}</span>
                  </div>

                  <div className="flex gap-2.5">
                    <Button variant="secondary" size="md" onClick={resetAll} disabled={isSaving}>
                      Batal
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleConfirmAndSave(false)}
                      isLoading={isSaving}
                    >
                      <span>Simpan ke Transaksi</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
