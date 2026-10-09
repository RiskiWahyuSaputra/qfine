import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { budgetSchema } from '@/lib/validations';

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
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

    const { data, error } = await supabase
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('user_id', user.id)
      .eq('period_month', month)
      .eq('period_year', year);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
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
    const validation = budgetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const validData = validation.data;

    // Upsert budget on user_id, category_id, period_month, period_year
    const upsertPayload = {
      user_id: user.id,
      category_id: validData.category_id,
      amount: validData.amount,
      period_month: validData.period_month,
      period_year: validData.period_year,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('budgets')
      .upsert(upsertPayload as never, {
        onConflict: 'user_id,category_id,period_month,period_year',
      })
      .select('*, category:categories(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
