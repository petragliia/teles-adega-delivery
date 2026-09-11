import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServerAdmin';

export const dynamic = 'force-dynamic';

// GET /api/admin/produtos - Lista todos os produtos
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        categoria:categorias(nome)
      `)
      .order('nome', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/produtos - Cria um novo produto
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('produtos')
      .insert([
        {
          nome: body.nome,
          categoria_id: body.categoria_id,
          descricao: body.descricao || null,
          preco: Number(body.preco),
          foto_url: body.foto_url || null,
          estoque_atual: Number(body.estoque_atual ?? 0),
          estoque_minimo: Number(body.estoque_minimo ?? 5),
          ativo: body.ativo ?? true,
          destaque: body.destaque ?? false,
          atualizado_em: new Date().toISOString(),
        },
      ])
      .select(`
        *,
        categoria:categorias(nome)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao criar produto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/admin/produtos - Atualiza um produto existente ou ajusta estoque
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Sanitiza campos permitidos
    const payload: Record<string, unknown> = {
      atualizado_em: new Date().toISOString(),
    };

    if (updateFields.nome !== undefined) payload.nome = updateFields.nome;
    if (updateFields.categoria_id !== undefined) payload.categoria_id = updateFields.categoria_id;
    if (updateFields.descricao !== undefined) payload.descricao = updateFields.descricao || null;
    if (updateFields.preco !== undefined) payload.preco = Number(updateFields.preco);
    if (updateFields.foto_url !== undefined) payload.foto_url = updateFields.foto_url || null;
    if (updateFields.estoque_atual !== undefined) payload.estoque_atual = Number(updateFields.estoque_atual);
    if (updateFields.estoque_minimo !== undefined) payload.estoque_minimo = Number(updateFields.estoque_minimo);
    if (updateFields.ativo !== undefined) payload.ativo = Boolean(updateFields.ativo);
    if (updateFields.destaque !== undefined) payload.destaque = Boolean(updateFields.destaque);

    // Ajuste delta de estoque se solicitado
    if (updateFields.delta_estoque !== undefined) {
      const { data: current } = await supabase
        .from('produtos')
        .select('estoque_atual')
        .eq('id', id)
        .single();

      const currentStock = current?.estoque_atual ?? 0;
      payload.estoque_atual = Math.max(0, currentStock + Number(updateFields.delta_estoque));
    }

    const { data, error } = await supabase
      .from('produtos')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        categoria:categorias(nome)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar produto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/produtos - Deleta um produto por ID
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('produtos').delete().eq('id', id);

    if (error) {
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Este produto possui histórico de pedidos e não pode ser excluído permanentemente. Utilize a opção Ocultar da Vitrine.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao excluir produto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
