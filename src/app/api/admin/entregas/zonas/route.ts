import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServerAdmin';

export const dynamic = 'force-dynamic';

// GET /api/admin/entregas/zonas - Lista todas as áreas de entrega
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('zonas_frete')
      .select('*')
      .order('bairro', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno ao listar zonas de entrega';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/entregas/zonas - Cria nova área de entrega
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bairro, cep_inicio, cep_fim, valor_frete, ativo } = body;

    if (!bairro || bairro.trim() === '') {
      return NextResponse.json({ error: 'O nome do bairro ou área é obrigatório.' }, { status: 400 });
    }

    if (valor_frete === undefined || isNaN(Number(valor_frete)) || Number(valor_frete) < 0) {
      return NextResponse.json({ error: 'Informe um valor de frete válido (>= 0).' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('zonas_frete')
      .insert([
        {
          bairro: bairro.trim(),
          cep_inicio: cep_inicio ? cep_inicio.trim() : null,
          cep_fim: cep_fim ? cep_fim.trim() : null,
          valor_frete: Number(valor_frete),
          ativo: ativo !== undefined ? Boolean(ativo) : true,
        },
      ])
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao criar área de entrega';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/admin/entregas/zonas - Atualiza uma área de entrega existente
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, bairro, cep_inicio, cep_fim, valor_frete, ativo } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da área de entrega é obrigatório.' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (bairro !== undefined) updatePayload.bairro = String(bairro).trim();
    if (cep_inicio !== undefined) updatePayload.cep_inicio = cep_inicio ? String(cep_inicio).trim() : null;
    if (cep_fim !== undefined) updatePayload.cep_fim = cep_fim ? String(cep_fim).trim() : null;
    if (valor_frete !== undefined) updatePayload.valor_frete = Number(valor_frete);
    if (ativo !== undefined) updatePayload.ativo = Boolean(ativo);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('zonas_frete')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar área de entrega';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/entregas/zonas?id=... - Exclui uma área de entrega
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da área de entrega é obrigatório.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('zonas_frete')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao excluir área de entrega';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
