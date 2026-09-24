import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServerAdmin';
import { validarWebhookToken, consultarCobrancaPorPedidoId } from '@/lib/payments/asaas';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const asaasToken = req.headers.get('asaas-access-token');

    // 1. Validação de autenticação do Webhook
    if (!validarWebhookToken(asaasToken)) {
      console.warn('[Webhook Asaas] Token de acesso inválido no header asaas-access-token.');
      return NextResponse.json({ error: 'Unauthorized webhook token' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const event = body?.event;
    const payment = body?.payment;

    console.log(`[Webhook Asaas] Recebido evento: ${event} para cobrança ID: ${payment?.id}`);

    if (!payment || !payment.id) {
      return NextResponse.json({ error: 'Missing payment object in webhook' }, { status: 400 });
    }

    // 2. Identificar o pedido pelo externalReference
    let pedidoId = payment.externalReference;

    // Caso o externalReference não tenha vindo no payload, consultar na API
    if (!pedidoId) {
      console.log(`[Webhook Asaas] externalReference ausente no webhook. Buscando detalhes da cobrança ${payment.id}...`);
      const details = await consultarCobrancaPorPedidoId(payment.id);
      pedidoId = details?.externalReference;
    }

    if (!pedidoId) {
      console.warn(`[Webhook Asaas] Não foi possível vincular o pagamento ${payment.id} a nenhum pedido.`);
      return NextResponse.json({ status: 'ignored', reason: 'Missing externalReference' }, { status: 200 });
    }

    // 3. Processar eventos de confirmação de pagamento Pix
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const { data: pedido, error: fetchErr } = await supabaseAdmin
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();

      if (fetchErr || !pedido) {
        console.error(`[Webhook Asaas] Pedido ${pedidoId} não encontrado no Supabase:`, fetchErr);
        return NextResponse.json({ error: 'Pedido not found' }, { status: 404 });
      }

      // Evita reprocessamento se o pedido já estiver em preparo, em rota ou entregue
      if (pedido.status !== 'aguardando_pagamento' && pedido.status !== 'pendente_aprovacao') {
        console.log(`[Webhook Asaas] Pedido ${pedidoId} já está com status '${pedido.status}'. Idempotência respeitada.`);
        return NextResponse.json({ success: true, alreadyProcessed: true }, { status: 200 });
      }

      // Atualiza pedido para "em_preparo" (Pago e aguardando separação)
      const { error: updateErr } = await supabaseAdmin
        .from('pedidos')
        .update({
          status: 'em_preparo',
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', pedidoId);

      if (updateErr) {
        console.error(`[Webhook Asaas] Erro ao atualizar status do pedido ${pedidoId} para em_preparo:`, updateErr);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log(`[Webhook Asaas] ✅ Pedido #${pedidoId.slice(0, 8)} atualizado para 'em_preparo' (Pago via Pix Asaas)!`);

      // 4. Notificação ao n8n para disparo de WhatsApp de confirmação
      if (process.env.N8N_BASE_URL) {
        try {
          await fetch(`${process.env.N8N_BASE_URL}/webhook/order-created`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event: 'order_payment_approved',
              gateway: 'asaas',
              asaas_payment_id: payment.id,
              pedido: {
                id: pedido.id,
                cliente_nome: pedido.cliente_nome,
                cliente_whatsapp: pedido.cliente_whatsapp,
                valor_total: pedido.valor_total,
                codigo_entrega: pedido.codigo_entrega,
                status: 'em_preparo',
              },
            }),
          });
        } catch (n8nErr) {
          console.error('[Webhook Asaas] Erro ao notificar n8n:', n8nErr);
        }
      }

      return NextResponse.json({
        success: true,
        pedidoId,
        status: 'em_preparo',
        event,
      }, { status: 200 });
    }

    // 5. Tratar eventos de cancelamento / estorno
    if (event === 'PAYMENT_REFUNDED' || event === 'PAYMENT_DELETED') {
      console.log(`[Webhook Asaas] Pagamento ${payment.id} cancelado/estornado no Asaas.`);
      // Se o pedido ainda estiver aguardando pagamento, cancela
      await supabaseAdmin
        .from('pedidos')
        .update({
          status: 'cancelado',
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', pedidoId)
        .eq('status', 'aguardando_pagamento');

      return NextResponse.json({ success: true, event, pedidoId }, { status: 200 });
    }

    // Para outros eventos (ex: criação da cobrança PAYMENT_CREATED)
    return NextResponse.json({ received: true, event }, { status: 200 });
  } catch (error: unknown) {
    console.error('[Webhook Asaas] Exceção não tratada:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
