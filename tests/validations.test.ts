import { describe, it, expect } from 'vitest';
import { aiReceiptOutputSchema, transactionSchema } from '@/lib/validations';

describe('Validation Schemas', () => {
  it('harus memvalidasi structured JSON output dari Gemini AI Receipt Scanner', () => {
    const rawAiOutput = {
      transaction_type: 'expense',
      merchant_name: 'Indomaret Point',
      transaction_date: '2026-10-08',
      amount: 45000,
      currency: 'IDR',
      category_suggestion: 'Makanan dan minuman',
      payment_method: 'QRIS',
      description: 'Beli kopi dan roti',
      reference_number: 'REF-99201',
      confidence: 0.95,
      uncertain_fields: [],
    };

    const parsed = aiReceiptOutputSchema.safeParse(rawAiOutput);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.amount).toBe(45000);
      expect(parsed.data.payment_method).toBe('QRIS');
    }
  });

  it('harus menolak transaksi dengan nominal 0 atau negatif', () => {
    const invalidTx = {
      type: 'expense',
      amount: -15000,
      merchant_name: 'Warung Kopi',
      transaction_date: '2026-10-09',
      payment_method: 'Cash',
    };

    const parsed = transactionSchema.safeParse(invalidTx);
    expect(parsed.success).toBe(false);
  });
});
