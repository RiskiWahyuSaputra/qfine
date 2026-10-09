import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database } from '@/types/database';

/** Halaman login lama: tidak dipakai lagi, diarahkan ke dashboard */
const RUTE_LOGIN_LAMA = ['/login', '/register', '/forgot-password', '/reset-password'];

/**
 * QFine dipakai pribadi, jadi tidak ada halaman login. Bila belum ada sesi, proxy masuk
 * otomatis ke akun pemilik (QFINE_EMAIL / QFINE_PASSWORD, hanya di server) sehingga
 * RLS Supabase dan bucket receipts tetap berlaku untuk akun tersebut.
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (RUTE_LOGIN_LAMA.some((rute) => pathname.startsWith(rute))) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
    return belumSiap(request, 'NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi di .env.local.');
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const email = process.env.QFINE_EMAIL || '';
    const password = process.env.QFINE_PASSWORD || '';

    if (!email || !password) {
      return belumSiap(request, 'QFINE_EMAIL dan QFINE_PASSWORD (akun Supabase pemilik) belum diisi di .env.local.');
    }

    // Cookie sesi dari login ini ikut ke request saat ini (lewat setAll) dan ke browser
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return belumSiap(request, `Gagal masuk otomatis ke akun ${email}: ${error.message}`);
    }
  }

  return supabaseResponse;
}

/** Konfigurasi belum lengkap: JSON untuk API, halaman teks singkat untuk browser */
function belumSiap(request: NextRequest, pesan: string) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: pesan }, { status: 503 });
  }

  return new NextResponse(
    `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>QFine belum siap</title></head>` +
      `<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#020617;color:#e2e8f0;font-family:system-ui,sans-serif">` +
      `<main style="max-width:480px;padding:24px"><h1 style="font-size:20px;margin:0 0 8px">QFine belum siap</h1>` +
      `<p style="margin:0;line-height:1.6;color:#94a3b8">${escapeHtml(pesan)}</p></main></body></html>`,
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

function escapeHtml(teks: string) {
  return teks.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}
