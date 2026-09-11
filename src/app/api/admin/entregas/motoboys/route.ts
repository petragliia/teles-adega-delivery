import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServerAdmin';

export const dynamic = 'force-dynamic';

// GET /api/admin/entregas/motoboys - Lista todos os motoboys
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('motoboys')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno ao listar motoboys';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/entregas/motoboys - Cria novo motoboy
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, telefone, ativo } = body;

    if (!nome || nome.trim() === '') {
      return NextResponse.json({ error: 'O nome do motoboy é obrigatório.' }, { status: 400 });
    }

    if (!telefone || telefone.trim() === '') {
      return NextResponse.json({ error: 'O telefone / WhatsApp do motoboy é obrigatório.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('motoboys')
      .insert([
        {
          nome: nome.trim(),
          telefone: telefone.trim(),
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
    const message = err instanceof Error ? err.message : 'Erro ao cadastrar motoboy';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/admin/entregas/motoboys - Atualiza motoboy existente
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, nome, telefone, ativo } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do motoboy é obrigatório.' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (nome !== undefined) updatePayload.nome = String(nome).trim();
    if (telefone !== undefined) updatePayload.telefone = String(telefone).trim();
    if (ativo !== undefined) updatePayload.ativo = Boolean(ativo);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('motoboys')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar motoboy';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/entregas/motoboys?id=... - Exclui um motoboy
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do motoboy é obrigatório.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('motoboys')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao excluir motoboy';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
