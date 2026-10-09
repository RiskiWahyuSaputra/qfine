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

const PERINTAH_EKSTRAK = 'Ekstrak detail struk/bukti transaksi di atas ke dalam format JSON terstruktur.';

type Penyedia = 'gemini' | 'groq';

/**
 * Baca struk/bukti transaksi dengan AI. Dua penyedia: Gemini (3 model, kuota gratis per project
 * per model) dan Groq (cadangan, kuota terpisah). Penyedia pertama yang gagal (kuota habis, sibuk,
 * kunci salah, atau output tidak valid) otomatis diganti penyedia berikutnya.
 * Urutan: Gemini lalu Groq; AI_PENYEDIA_UTAMA=groq membalik urutannya.
 */
export async function scanReceiptWithGemini(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<AIReceiptExtraction> {
  const urutan: Penyedia[] = process.env.AI_PENYEDIA_UTAMA === 'groq' ? ['groq', 'gemini'] : ['gemini', 'groq'];
  const aktif = urutan.filter((p) => (p === 'gemini' ? process.env.GEMINI_API_KEY : process.env.GROQ_API_KEY));
  if (aktif.length === 0) {
    throw new Error('Isi GEMINI_API_KEY dan/atau GROQ_API_KEY di environment variables untuk memakai Scan AI.');
  }

  const galat: string[] = [];
  for (const penyedia of aktif) {
    try {
      const teks = penyedia === 'gemini' ? await bacaDenganGemini(imageBase64, mimeType) : await bacaDenganGroq(imageBase64, mimeType);
      return validasiHasil(teks);
    } catch (err) {
      const pesan = ringkasGalat(err);
      console.error(`[ai] ${penyedia} gagal: ${pesan.slice(0, 200)}`);
      galat.push(pesan);
    }
  }

  // Satu penyedia: pesannya apa adanya (mis. "Kuota harian Gemini AI sudah habis ...")
  if (galat.length === 1) throw new Error(galat[0]);
  throw new Error(`Semua layanan AI sedang tidak bisa dipakai. ${aktif.map((p, i) => `${p === 'gemini' ? 'Gemini' : 'Groq'}: ${galat[i]}`).join(' | ')}`);
}

async function bacaDenganGemini(imageBase64: string, mimeType: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
          { text: PERINTAH_EKSTRAK },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
    },
  }));

  if (!response.text) throw new Error('Gemini API mengembalikan respons kosong.');
  return response.text;
}

/** Model vision Groq (OpenAI-compatible); kuota gratis jauh lebih besar dari Gemini */
const GROQ_MODEL_BAWAAN = 'qwen/qwen3.8-27b';

async function bacaDenganGroq(imageBase64: string, mimeType: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || GROQ_MODEL_BAWAAN,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `${SYSTEM_INSTRUCTION}\n${PERINTAH_EKSTRAK}` },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(60000),
  });

  const data = (await res.json().catch(() => ({}))) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };
  if (!res.ok) {
    if (res.status === 429) throw new Error('Kuota Groq sedang habis. Coba lagi beberapa saat lagi.');
    throw new Error(`Groq menolak permintaan (status ${res.status}): ${data.error?.message || 'tanpa keterangan'}`);
  }
  const teks = data.choices?.[0]?.message?.content;
  if (!teks) throw new Error('Groq mengembalikan respons kosong.');
  return teks;
}

/** Pesan error yang bisa dibaca: Gemini kadang mengirim JSON mentah sebagai message */
function ringkasGalat(err: unknown): string {
  const pesan = err instanceof Error ? err.message : String(err);
  try {
    const json = JSON.parse(pesan) as { error?: { message?: string } };
    if (json.error?.message) return json.error.message;
  } catch {
    // bukan JSON: pakai apa adanya
  }
  return pesan.replace(/\s+/g, ' ');
}

/** Teks JSON dari AI -> data struk yang tervalidasi skema */
function validasiHasil(teks: string): AIReceiptExtraction {
  let parsedJson: unknown;
  try {
    // Sebagian model membungkus JSON dengan ```json ... ```
    parsedJson = JSON.parse(teks.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, ''));
  } catch {
    throw new Error('Gagal mem-parsing output AI sebagai JSON.');
  }

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
/**
 * Cadangan bila model utama sibuk atau kuotanya habis. Kuota gratis Gemini dihitung per model
 * per hari (mis. 20 request untuk gemini-3.8-flash), jadi tiap cadangan menambah jatah scan harian.
 */
const MODEL_CADANGAN = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];
/** Percobaan per model saat server Gemini sibuk (503) */
const MAKS_PERCOBAAN_SIBUK = 2;

/** Model yang kuotanya habis -> waktu (ms) kuota diperkirakan pulih; dilewati sampai saat itu */
const kuotaHabisSampai = new Map<string, number>();

/**
 * 503 (server sibuk): dicoba ulang sebentar lalu pindah model. 429 (kuota habis): tidak dicoba ulang
 * karena kuota harian tidak pulih dalam hitungan detik; langsung pindah ke model berikutnya dan model
 * itu dilewati pada scan berikutnya. 404 (model dipensiunkan): langsung dilewati.
 */
async function generateDenganCadangan(
  panggil: (model: string) => Promise<GenerateContentResponse>
): Promise<GenerateContentResponse> {
  const utama = process.env.GEMINI_MODEL || MODEL_BAWAAN;
  const sekarang = Date.now();
  const semua = [...new Set([utama, ...MODEL_CADANGAN])];
  const tersedia = semua.filter((m) => (kuotaHabisSampai.get(m) ?? 0) <= sekarang);
  let terakhir: unknown;
  let semuaKuotaHabis = tersedia.length === 0;

  for (const model of tersedia) {
    for (let percobaan = 1; percobaan <= MAKS_PERCOBAAN_SIBUK; percobaan++) {
      try {
        return await panggil(model);
      } catch (err) {
        terakhir = err;
        const status = err instanceof ApiError ? err.status : 0;
        console.error(`[gemini] ${model} gagal (status ${status || '-'}): ${pesanSingkat(err)}`);
        if (status === 429) {
          kuotaHabisSampai.set(model, Date.now() + jedaPulih(err));
          semuaKuotaHabis = true;
          break;
        }
        semuaKuotaHabis = false;
        if (status === 404) break;
        if (status !== 503) throw err; // kesalahan lain (gambar tidak terbaca, kunci API salah, dll.)
        if (percobaan < MAKS_PERCOBAAN_SIBUK) await jeda(1000 * percobaan);
      }
    }
  }

  if (semuaKuotaHabis) {
    const pulih = Math.min(...semua.map((m) => kuotaHabisSampai.get(m) ?? Infinity));
    throw new Error(
      'Kuota harian Gemini AI sudah habis (paket gratis). ' +
        (Number.isFinite(pulih) ? `Scan bisa dipakai lagi sekitar ${lamaTunggu(pulih - Date.now())} lagi, ` : 'Coba lagi nanti, ') +
        'atau isi transaksi secara manual.'
    );
  }
  const status = terakhir instanceof ApiError ? terakhir.status : 0;
  if (status === 503) {
    throw new Error('Layanan AI Gemini sedang sibuk. Silakan coba scan lagi dalam beberapa saat.');
  }
  throw terakhir;
}

/** Lama kuota pulih dari pesan Gemini ("retryDelay":"59169s" / "Please retry in 16h26m9s"); bawaan 1 jam */
function jedaPulih(err: unknown): number {
  const pesan = err instanceof Error ? err.message : String(err);
  const detik = pesan.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
  if (detik) return Math.max(60, parseFloat(detik[1])) * 1000;
  const teks = pesan.match(/retry in (?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?/i);
  if (teks && (teks[1] || teks[2] || teks[3])) {
    return Math.max(60, (Number(teks[1] || 0) * 3600) + (Number(teks[2] || 0) * 60) + Number(teks[3] || 0)) * 1000;
  }
  return 3600 * 1000;
}

function lamaTunggu(ms: number) {
  const menit = Math.max(1, Math.round(ms / 60000));
  if (menit < 60) return `${menit} menit`;
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  return sisa ? `${jam} jam ${sisa} menit` : `${jam} jam`;
}

function pesanSingkat(err: unknown) {
  const pesan = err instanceof Error ? err.message : String(err);
  return pesan.replace(/\s+/g, ' ').slice(0, 160);
}

function jeda(ms: number) {
  return new Promise((selesai) => setTimeout(selesai, ms));
}
