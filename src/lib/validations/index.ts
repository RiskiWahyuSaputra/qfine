import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirm_password: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirm_password'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password baru minimal 6 karakter'),
  confirm_password: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirm_password'],
});

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Nominal transaksi harus lebih dari 0'),
  merchant_name: z.string().min(1, 'Nama toko/merchant/sumber wajib diisi'),
  sender_or_receiver: z.string().optional().nullable(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  transaction_time: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  payment_method: z.enum(['Cash', 'Transfer bank', 'QRIS', 'E-wallet', 'Kartu debit/kredit', 'Lainnya']),
  description: z.string().optional().nullable(),
  reference_number: z.string().optional().nullable(),
  source: z.enum(['manual', 'ai_scan']).default('manual'),
  receipt_path: z.string().optional().nullable(),
  confidence: z.number().optional().nullable(),
});

export const budgetSchema = z.object({
  category_id: z.string().min(1, 'Kategori harus dipilih'),
  amount: z.number().positive('Nominal anggaran harus lebih dari 0'),
  period_month: z.number().int().min(1).max(12),
  period_year: z.number().int().min(2000).max(2100),
});

export const profileSettingsSchema = z.object({
  full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  currency: z.string().default('IDR'),
  starting_balance: z.number().min(0, 'Saldo awal tidak boleh negatif'),
});

/**
 * Structured schema untuk respons pembacaan AI Receipt dari Google Gemini
 */
export const aiReceiptOutputSchema = z.object({
  transaction_type: z.enum(['income', 'expense']),
  merchant_name: z.string().min(1),
  sender_or_receiver: z.string().nullable().optional(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  transaction_time: z.string().nullable().optional(),
  amount: z.number().positive(),
  currency: z.string().default('IDR'),
  category_suggestion: z.string().nullable().optional(),
  payment_method: z.enum(['Cash', 'Transfer bank', 'QRIS', 'E-wallet', 'Kartu debit/kredit', 'Lainnya']).default('Cash'),
  description: z.string().nullable().optional(),
  reference_number: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).default(0.85),
  uncertain_fields: z.array(z.string()).default([]),
});

export type AIReceiptExtraction = z.infer<typeof aiReceiptOutputSchema>;
