import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServerAdmin';

export const dynamic = 'force-dynamic';

// GET /api/admin/promocoes - Lista todas as promoções
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('promocoes')
      .select(`
        *,
        produto:produtos(
          id,
          nome,
          preco,
          foto_url,
          categoria_id,
          categoria:categorias(nome)
        )
      `)
      .order('criado_em', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/promocoes - Cria nova promoção
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getSupabaseAdmin();

    const insertPayload: Record<string, unknown> = {
      produto_id: body.produto_id,
      preco_promocional: Number(body.preco_promocional),
      data_inicio: body.data_inicio,
      data_fim: body.data_fim,
      dias_semana: body.dias_semana || [0, 1, 2, 3, 4, 5, 6],
      ativo: body.ativo ?? true,
    };

    const { data, error } = await supabase
      .from('promocoes')
      .insert([insertPayload])
      .select(`
        *,
        produto:produtos(
          id,
          nome,
          preco,
          foto_url,
          categoria_id,
          categoria:categorias(nome)
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao criar promoção';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/admin/promocoes - Atualiza promoção existente
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da promoção é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const payload: Record<string, unknown> = {};

    if (updateFields.produto_id !== undefined) payload.produto_id = updateFields.produto_id;
    if (updateFields.preco_promocional !== undefined) payload.preco_promocional = Number(updateFields.preco_promocional);
    if (updateFields.data_inicio !== undefined) payload.data_inicio = updateFields.data_inicio;
    if (updateFields.data_fim !== undefined) payload.data_fim = updateFields.data_fim;
    if (updateFields.dias_semana !== undefined) payload.dias_semana = updateFields.dias_semana;
    if (updateFields.ativo !== undefined) payload.ativo = Boolean(updateFields.ativo);

    const { data, error } = await supabase
      .from('promocoes')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        produto:produtos(
          id,
          nome,
          preco,
          foto_url,
          categoria_id,
          categoria:categorias(nome)
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar promoção';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/promocoes - Deleta uma promoção
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da promoção é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('promocoes').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao excluir promoção';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
