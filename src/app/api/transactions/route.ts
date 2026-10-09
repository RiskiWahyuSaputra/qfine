import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transactionSchema } from '@/lib/validations';

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
    const type = searchParams.get('type');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const paymentMethod = searchParams.get('paymentMethod');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase
      .from('transactions')
      .select('*, category:categories(*)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (type && (type === 'income' || type === 'expense')) {
      query = query.eq('type', type);
    }

    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    if (paymentMethod && paymentMethod !== 'all') {
      query = query.eq('payment_method', paymentMethod);
    }

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    if (search) {
      query = query.or(`merchant_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      limit,
      offset,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    const body = await request.json();
    const validation = transactionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const validData = validation.data;

    // Check duplicate if reference number or (amount, date, merchant) matches
    let duplicateQuery = supabase
      .from('transactions')
      .select('id, amount, merchant_name, transaction_date, reference_number')
      .eq('user_id', user.id)
      .eq('amount', validData.amount)
      .eq('transaction_date', validData.transaction_date)
      .eq('merchant_name', validData.merchant_name);

    if (validData.reference_number) {
      duplicateQuery = duplicateQuery.eq('reference_number', validData.reference_number);
    }

    const { data: potentialDuplicates } = await duplicateQuery;
    const isDuplicateWarning = Boolean(potentialDuplicates && potentialDuplicates.length > 0);

    // If request explicitly confirmed duplicate bypass OR no duplicates found, proceed insert
    if (body.ignoreDuplicateWarning || !isDuplicateWarning) {
      const insertPayload = {
        user_id: user.id,
        type: validData.type,
        amount: validData.amount,
        merchant_name: validData.merchant_name,
        sender_or_receiver: validData.sender_or_receiver || null,
        transaction_date: validData.transaction_date,
        transaction_time: validData.transaction_time || null,
        category_id: validData.category_id || null,
        payment_method: validData.payment_method,
        description: validData.description || null,
        reference_number: validData.reference_number || null,
        source: validData.source || 'manual',
        receipt_path: validData.receipt_path || null,
        confidence: validData.confidence || null,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(insertPayload as never)
        .select('*, category:categories(*)')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data, warning: null });
    }

    // Return duplicate warning
    return NextResponse.json(
      {
        warning: 'duplicate_detected',
        message: 'Ditemukan transaksi serupa di database dengan nominal, tanggal, dan merchant yang sama.',
        duplicates: potentialDuplicates,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
