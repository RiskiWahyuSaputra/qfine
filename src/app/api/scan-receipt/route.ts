import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scanReceiptWithGemini } from '@/lib/gemini';

export const maxDuration = 60; // Allow sufficient time for vision inference

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error:
            'Fitur Scan Struk AI membutuhkan konfigurasi GEMINI_API_KEY di environment variables.',
        },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File gambar bukti pembayaran wajib diunggah.' }, { status: 400 });
    }

    // Validate size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal adalah 8MB.' }, { status: 400 });
    }

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Harap unggah format JPG, PNG, atau WEBP.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // 1. Jalankan pembacaan Gemini AI Vision
    const aiResult = await scanReceiptWithGemini(base64Image, file.type);

    // 2. Upload file ke Supabase Storage bucket 'receipts' (Private)
    let receiptPath: string | null = null;
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (!uploadError && uploadData) {
        receiptPath = uploadData.path;
      }
    } catch {
      // Storage upload failure should not block scan extraction result
      console.warn('Gagal menyimpan file ke Supabase Storage, melanjutkan dengan hasil ekstraksi.');
    }

    return NextResponse.json({
      success: true,
      data: aiResult,
      receipt_path: receiptPath,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
