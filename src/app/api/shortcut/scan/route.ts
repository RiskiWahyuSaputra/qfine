import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scanReceiptWithGemini } from '@/lib/gemini';
import { formatIDR } from '@/lib/utils';

/**
 * Pintasan iPhone (Shortcuts): kirim screenshot/foto bukti bayar, QFine membacanya dengan Gemini
 * lalu langsung menyimpannya sebagai transaksi. Balasan berisi `pesan` siap ditampilkan sebagai
 * notifikasi di iPhone.
 *
 * POST /api/shortcut/scan?token=<QFINE_SHORTCUT_TOKEN>
 *   Token   : query ?token= atau header Authorization: Bearer <token> (Pintasan cukup memakai URL)
 *   Body    : gambar mentah (jenis dikenali dari isinya, Content-Type boleh apa saja)
 *             atau multipart dengan field "file"
 *   Query   : &simpan=0 untuk hanya membaca tanpa menyimpan
 */
export const maxDuration = 120;

const TIPE_GAMBAR = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAKS_UKURAN = 8 * 1024 * 1024;

function tokenCocok(request: NextRequest) {
  const rahasia = process.env.QFINE_SHORTCUT_TOKEN || '';
  const dikirim = (
    request.nextUrl.searchParams.get('token') ||
    (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  ).trim();
  if (rahasia.length < 16 || !dikirim) return false;
  const a = Buffer.from(dikirim);
  const b = Buffer.from(rahasia);
  return a.length === b.length && timingSafeEqual(a, b);
}

function gagal(pesan: string, status: number) {
  return NextResponse.json({ ok: false, pesan: `❌ ${pesan}` }, { status });
}

/** Ambil gambar dari body mentah (Shortcuts "Request Body: File") atau multipart field "file" */
async function bacaGambar(request: NextRequest): Promise<{ buffer: Buffer; tipe: string } | string> {
  const jenis = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();

  if (jenis === 'multipart/form-data') {
    const file = (await request.formData()).get('file');
    if (!(file instanceof File)) return 'Field "file" berisi gambar wajib dikirim.';
    if (file.size > MAKS_UKURAN) return 'Ukuran gambar maksimal 8MB.';
    const tipe = file.type.toLowerCase() || 'image/jpeg';
    if (!TIPE_GAMBAR.includes(tipe)) return 'Format gambar harus JPG, PNG, WEBP, atau HEIC.';
    return { buffer: Buffer.from(await file.arrayBuffer()), tipe };
  }

  const buffer = Buffer.from(await request.arrayBuffer());
  if (!buffer.length) return 'Gambar kosong.';
  if (buffer.length > MAKS_UKURAN) return 'Ukuran gambar maksimal 8MB.';
  // Pintasan iPhone sering mengirim file tanpa Content-Type gambar: jenisnya dikenali dari isi file
  const tipe = TIPE_GAMBAR.includes(jenis) ? jenis : kenaliGambar(buffer);
  if (!tipe) return 'Kirim gambar (JPG, PNG, WEBP, atau HEIC) sebagai isi request.';
  return { buffer, tipe };
}

/** Jenis gambar dari tanda tangan byte awal file */
function kenaliGambar(b: Buffer): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (b.toString('ascii', 4, 8) === 'ftyp') {
    const merek = b.toString('ascii', 8, 12);
    if (['heic', 'heix', 'hevc', 'hevx'].includes(merek)) return 'image/heic';
    if (['mif1', 'msf1', 'heif'].includes(merek)) return 'image/heif';
  }
  return null;
}

export async function POST(request: NextRequest) {
  if (!process.env.QFINE_SHORTCUT_TOKEN) {
    return gagal('Pintasan belum diaktifkan: isi QFINE_SHORTCUT_TOKEN di environment variables.', 503);
  }
  if (!tokenCocok(request)) {
    return gagal('Token pintasan salah.', 401);
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return gagal('Akun QFine belum terhubung.', 401);

    const gambar = await bacaGambar(request);
    if (typeof gambar === 'string') return gagal(gambar, 400);

    const hasil = await scanReceiptWithGemini(gambar.buffer.toString('base64'), gambar.tipe);
    const tanda = hasil.transaction_type === 'income' ? '+' : '-';
    const ringkas = `${hasil.merchant_name} ${tanda}${formatIDR(hasil.amount)}`;

    if (request.nextUrl.searchParams.get('simpan') === '0') {
      return NextResponse.json({ ok: true, disimpan: false, pesan: `🔎 Terbaca: ${ringkas}`, data: hasil });
    }

    // Transaksi yang sama sudah tercatat (nominal, tanggal, merchant, dan no. referensi bila ada)
    let duplikat = supabase
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('amount', hasil.amount)
      .eq('transaction_date', hasil.transaction_date)
      .eq('merchant_name', hasil.merchant_name);
    if (hasil.reference_number) duplikat = duplikat.eq('reference_number', hasil.reference_number);
    const { data: sama } = await duplikat.limit(1);
    if (sama && sama.length) {
      return NextResponse.json({ ok: true, disimpan: false, pesan: `⚠️ Sudah tercatat sebelumnya: ${ringkas}`, data: hasil });
    }

    // Kategori dari saran AI, dicocokkan dengan nama kategori milik akun
    const { data: kategori } = await supabase
      .from('categories')
      .select('id, name, type')
      .eq('user_id', user.id)
      .eq('type', hasil.transaction_type);
    const daftarKategori = (kategori || []) as { id: string; name: string }[];
    const saran = (hasil.category_suggestion || '').toLowerCase().trim();
    const cocok =
      daftarKategori.find((k) => k.name.toLowerCase() === saran) ||
      daftarKategori.find((k) => saran && (k.name.toLowerCase().includes(saran) || saran.includes(k.name.toLowerCase()))) ||
      daftarKategori.find((k) => k.name.toLowerCase() === 'lainnya') ||
      null;

    // Bukti disimpan ke bucket receipts (gagal unggah tidak membatalkan pencatatan)
    let receiptPath: string | null = null;
    const ekstensi = gambar.tipe.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const { data: unggahan } = await supabase.storage
      .from('receipts')
      .upload(`${user.id}/${Date.now()}-pintasan.${ekstensi}`, gambar.buffer, { contentType: gambar.tipe, upsert: false });
    if (unggahan) receiptPath = unggahan.path;

    const { data: transaksi, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: hasil.transaction_type,
        amount: hasil.amount,
        merchant_name: hasil.merchant_name,
        sender_or_receiver: hasil.sender_or_receiver || null,
        transaction_date: hasil.transaction_date,
        transaction_time: hasil.transaction_time || null,
        category_id: cocok?.id || null,
        payment_method: hasil.payment_method,
        description: hasil.description || null,
        reference_number: hasil.reference_number || null,
        source: 'ai_scan',
        receipt_path: receiptPath,
        confidence: hasil.confidence,
      } as never)
      .select('id')
      .single();

    if (error) return gagal(`Gagal menyimpan transaksi: ${error.message}`, 500);

    return NextResponse.json({
      ok: true,
      disimpan: true,
      pesan: `✅ ${ringkas} tersimpan${cocok ? ` · ${cocok.name}` : ''}`,
      id: (transaksi as { id: string } | null)?.id,
      data: hasil,
    });
  } catch (err: unknown) {
    const pesan = err instanceof Error ? err.message : 'Terjadi kesalahan.';
    console.error('[shortcut/scan] gagal:', pesan);
    return gagal(pesan, /Kuota harian|sedang sibuk/.test(pesan) ? 503 : 500);
  }
}
