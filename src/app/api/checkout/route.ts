import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServerAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      cliente_nome,
      cliente_whatsapp,
      endereco_rua,
      endereco_numero,
      endereco_bairro,
      endereco_complemento,
      ponto_referencia,
      forma_pagamento,
      troco_para,
      taxa_entrega,
      valor_produtos,
      valor_total,
      itens,
      chave_idempotencia,
    } = body;

    if (!cliente_nome || !cliente_whatsapp || !itens || !itens.length) {
      return NextResponse.json(
        { error: 'Dados incompletos para processar o pedido' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 1. Obter ou criar cadastro do cliente
    const cleanPhone = cliente_whatsapp.replace(/\D/g, '');
    const enderecoCompleto = `${endereco_rua}, ${endereco_numero}${
      endereco_complemento ? ` (${endereco_complemento})` : ''
    } - ${endereco_bairro}${ponto_referencia ? ` [Ref: ${ponto_referencia}]` : ''}`;

    let clienteId: string | null = null;

    const { data: existingClient } = await supabase
      .from('clientes')
      .select('id')
      .eq('whatsapp', cleanPhone)
      .maybeSingle();

    if (existingClient?.id) {
      clienteId = existingClient.id;
      await supabase
        .from('clientes')
        .update({
          nome: cliente_nome,
          endereco_completo: enderecoCompleto,
          bairro: endereco_bairro,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', clienteId);
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clientes')
        .insert({
          nome: cliente_nome,
          whatsapp: cleanPhone,
          endereco_completo: enderecoCompleto,
          cep: '00000-000',
          bairro: endereco_bairro,
        })
        .select('id')
        .single();

      if (!clientError && newClient) {
        clienteId = newClient.id;
      }
    }

    // 2. Criar pedido
    const initialStatus = forma_pagamento === 'pix' ? 'aguardando_pagamento' : 'pendente_aprovacao';

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        cliente_id: clienteId,
        valor_produtos: Number(valor_produtos),
        taxa_entrega: Number(taxa_entrega || 0),
        valor_total: Number(valor_total),
        forma_pagamento,
        status: initialStatus,
        chave_idempotencia: chave_idempotencia || crypto.randomUUID(),
      })
      .select()
      .single();

    if (pedidoError) {
      return NextResponse.json({ error: pedidoError.message }, { status: 500 });
    }

    // 3. Inserir itens do pedido
    const itensPayload = itens.map((i: {
      produto_id: string;
      quantidade: number;
      preco_unitario: number;
      subtotal: number;
    }) => ({
      pedido_id: pedido.id,
      produto_id: i.produto_id,
      quantidade: Number(i.quantidade),
      preco_unitario: Number(i.preco_unitario),
      subtotal: Number(i.subtotal),
    }));

    const { error: itensError } = await supabase
      .from('itens_pedido')
      .insert(itensPayload);

    if (itensError) {
      return NextResponse.json({ error: itensError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: pedido });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno ao processar checkout';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
