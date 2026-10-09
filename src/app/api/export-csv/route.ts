import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase
      .from('transactions')
      .select('*, category:categories(name)')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false });

    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // CSV Headers
    const headers = [
      'ID',
      'Tanggal',
      'Waktu',
      'Tipe',
      'Kategori',
      'Merchant / Sumber',
      'Nominal (IDR)',
      'Metode Pembayaran',
      'No Referensi',
      'Deskripsi',
      'Sumber Pencatatan',
    ];

    const escapeCsv = (str: string | number | null | undefined) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = ((data || []) as any[]).map((t) => [
      escapeCsv(t.id),
      escapeCsv(t.transaction_date),
      escapeCsv(t.transaction_time || '-'),
      escapeCsv(t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'),
      escapeCsv(t.category?.name || 'Tanpa Kategori'),
      escapeCsv(t.merchant_name),
      escapeCsv(t.amount),
      escapeCsv(t.payment_method),
      escapeCsv(t.reference_number || '-'),
      escapeCsv(t.description || '-'),
      escapeCsv(t.source === 'ai_scan' ? 'AI Scan' : 'Manual'),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="qfine-transaksi-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
