import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServerAdmin';

export const dynamic = 'force-dynamic';

// PUT /api/admin/pedidos - Atualiza status do pedido ou atribui motoboy
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, motoboy_id, observacao } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do pedido é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const payload: Record<string, unknown> = {
      atualizado_em: new Date().toISOString(),
    };

    if (status !== undefined) payload.status = status;
    if (motoboy_id !== undefined) payload.motoboy_id = motoboy_id || null;
    if (observacao !== undefined) payload.observacao = observacao;

    const { data, error } = await supabase
      .from('pedidos')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        cliente:clientes(*),
        motoboy:motoboys(*),
        itens:itens_pedido(*, produto:produtos(*))
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar pedido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
