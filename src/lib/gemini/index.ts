import { ApiError, GoogleGenAI, type GenerateContentResponse } from '@google/genai';
import { aiReceiptOutputSchema, AIReceiptExtraction } from '@/lib/validations';

const SYSTEM_INSTRUCTION = `
Anda adalah AI Receipt & Payment Scanner tingkat ahli untuk aplikasi keuangan Indonesia (QFine).
Tugas Anda adalah membaca gambar struk, struk belanja, invoice, atau screenshot bukti transfer bank/e-wallet (BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay, Seabank, QRIS, dll).

ATURAN KETAT:
1. Ekstrak data nyata yang tampak di gambar. JANGAN MENGARANG nomor referensi, nominal, merchant, atau tanggal.
2. transaction_type: 'expense' (pengeluaran/pembelian/transfer keluar) atau 'income' (pemasukan/transfer masuk).
3. amount: Ambil NOMINAL UTAMA transaksi yang dibayar atau diterima (bukan saldo rekening tersisa, bukan diskon saja, bukan uang kembalian). Format angka numerik murni tanpa Rp atau titik.
4. transaction_date: Format harus YYYY-MM-DD. Gunakan tanggal transaksi di struk. Jika tanggal tidak ada atau buram, gunakan tanggal hari ini.
5. transaction_time: Format HH:mm:ss jika tampak, jika tidak null.
6. merchant_name: Nama toko, merchant, atau penerima/pengirim transfer.
7. sender_or_receiver: Nama pengirim/penerima jika ada.
8. payment_method: Salah satu dari: 'Cash', 'Transfer bank', 'QRIS', 'E-wallet', 'Kartu debit/kredit', 'Lainnya'.
9. category_suggestion: Rekomendasikan salah satu kategori:
   - 'Makanan dan minuman' (resto, kafe, minimarket snack)
   - 'Transportasi' (bensin, parkir, ojek online, tiket)
   - 'Belanja' (baju, elektronik, e-commerce)
   - 'Tagihan' (listrik, air, internet, BPJS)
   - 'Pendidikan' (SPP, buku, kursus)
   - 'Kesehatan' (apotek, rumah sakit, dokter)
   - 'Hiburan' (nonton, game)
   - 'Langganan' (Netflix, Spotify, iCloud)
   - 'Tempat tinggal' (sewa, kos, maintenance)
   - 'Gaji', 'Freelance', 'Bisnis', 'Transfer masuk' (jika income)
   - 'Lainnya'
10. reference_number: Nomor referensi, order ID, no struk, atau nomor transaksi jika ada.
11. confidence: Angka 0.0 sampai 1.0 yang merepresentasikan seberapa yakin hasil pembacaan.
12. uncertain_fields: Daftar string nama field yang kurang jelas/meragukan agar pengguna mengonfirmasinya.

Kembalikan jawaban HANYA dalam format JSON valid yang sesuai dengan skema.
`;

export async function scanReceiptWithGemini(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<AIReceiptExtraction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi di environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await generateDenganCadangan((model) => ai.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: [
          { text: SYSTEM_INSTRUCTION },
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
          {
            text: 'Ekstrak detail struk/bukti transaksi di atas ke dalam format JSON terstruktur.',
          },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
    },
  }));

  const responseText = response.text;
  if (!responseText) {
    throw new Error('Gemini API mengembalikan respons kosong.');
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(responseText);
  } catch {
    throw new Error('Gagal mem-parsing output AI sebagai JSON.');
  }

  // Validasi dengan Zod
  const validated = aiReceiptOutputSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new Error(
      `Format data AI tidak sesuai skema: ${validated.error.issues.map((i) => i.message).join(', ')}`
    );
  }

  return validated.data;
}

/** Model utama; gemini-2.5-flash sudah tidak tersedia untuk pengguna baru (404 dari Gemini API) */
const MODEL_BAWAAN = 'gemini-3.8-flash';
/** Alias yang selalu menunjuk model Flash terbaru: dipakai bila model utama sibuk atau dipensiunkan */
const MODEL_CADANGAN = 'gemini-flash-latest';
const MAKS_PERCOBAAN = 3;

/**
 * Model Flash sering sibuk (503) atau kena batas kuota sesaat (429): dicoba ulang dengan jeda
 * bertahap, lalu pindah ke model cadangan. Model yang sudah dipensiunkan (404) langsung dilewati.
 */
async function generateDenganCadangan(
  panggil: (model: string) => Promise<GenerateContentResponse>
): Promise<GenerateContentResponse> {
  const utama = process.env.GEMINI_MODEL || MODEL_BAWAAN;
  const daftar = [...new Set([utama, MODEL_CADANGAN])];
  let terakhir: unknown;

  for (const model of daftar) {
    for (let percobaan = 1; percobaan <= MAKS_PERCOBAAN; percobaan++) {
      try {
        return await panggil(model);
      } catch (err) {
        terakhir = err;
        const status = err instanceof ApiError ? err.status : 0;
        if (status === 404) break; // model tidak tersedia: lanjut ke cadangan
        if (status !== 503 && status !== 429) throw err; // kesalahan lain (gambar, kunci API, dll.)
        if (percobaan < MAKS_PERCOBAAN) await jeda(800 * percobaan);
      }
    }
  }

  const status = terakhir instanceof ApiError ? terakhir.status : 0;
  if (status === 503 || status === 429) {
    throw new Error('Layanan AI Gemini sedang sibuk. Silakan coba scan lagi dalam beberapa saat.');
  }
  throw terakhir;
}

function jeda(ms: number) {
  return new Promise((selesai) => setTimeout(selesai, ms));
}
