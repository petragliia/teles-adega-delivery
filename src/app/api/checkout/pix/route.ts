import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServerAdmin';
import { criarCobrancaPixAsaas, obterQrCodePixAsaas, consultarCobrancaPorPedidoId } from '@/lib/payments/asaas';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pedidoId = searchParams.get('pedidoId');

    if (!pedidoId) {
      return NextResponse.json({ error: 'Parâmetro pedidoId é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Buscar o pedido no banco
    const { data: pedido, error: pedidoErr } = await supabase
      .from('pedidos')
      .select('*, clientes(nome, whatsapp)')
      .eq('id', pedidoId)
      .single();

    if (pedidoErr || !pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    if (pedido.forma_pagamento !== 'pix') {
      return NextResponse.json({
        error: 'Este pedido não foi gerado com pagamento via Pix',
        forma_pagamento: pedido.forma_pagamento,
      }, { status: 400 });
    }

    // Se já foi pago / mudou de status
    if (pedido.status !== 'aguardando_pagamento') {
      return NextResponse.json({
        success: true,
        pago: true,
        status: pedido.status,
      });
    }

    // 2. Verificar se já existe cobrança no Asaas
    const cobrancaExistente = await consultarCobrancaPorPedidoId(pedidoId);

    if (cobrancaExistente) {
      const qrData = await obterQrCodePixAsaas(cobrancaExistente.id);
      return NextResponse.json({
        success: true,
        pago: cobrancaExistente.status === 'RECEIVED' || cobrancaExistente.status === 'CONFIRMED',
        status: pedido.status,
        pix: {
          paymentId: cobrancaExistente.id,
          encodedImage: qrData.encodedImage,
          payload: qrData.payload,
          expirationDate: qrData.expirationDate,
          value: cobrancaExistente.value,
        },
      });
    }

    // 3. Se não existe, gerar a cobrança agora
    const clienteNome = pedido.cliente_nome || pedido.clientes?.nome || 'Cliente Teles Adega';
    const clienteWhatsapp = pedido.cliente_whatsapp || pedido.clientes?.whatsapp || '';

    const pixData = await criarCobrancaPixAsaas({
      pedidoId: pedido.id,
      valorTotal: Number(pedido.valor_total),
      cliente: {
        nome: clienteNome,
        telefone: clienteWhatsapp,
        externalReference: pedido.cliente_id || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      pago: false,
      status: pedido.status,
      pix: pixData,
    });
  } catch (err: unknown) {
    console.error('[API Checkout Pix] Erro ao buscar ou gerar dados do Pix:', err);
    const message = err instanceof Error ? err.message : 'Erro ao obter dados do Pix';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
