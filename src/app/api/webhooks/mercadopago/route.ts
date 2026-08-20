import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-service-key';

  return createClient(supabaseUrl, supabaseKey);
}

function verificarAssinaturaMercadoPago(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string | null
): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return true; // Em ambiente de desenvolvimento sem secret configurado
  if (!xSignature || !xRequestId || !dataId) return false;

  const parts = xSignature.split(',');
  let ts = '';
  let hashV1 = '';

  for (const part of parts) {
    const [key, val] = part.split('=');
    if (key.trim() === 'ts') ts = val.trim();
    if (key.trim() === 'v1') hashV1 = val.trim();
  }

  if (!ts || !hashV1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  return hmac === hashV1;
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');

    const body = await req.json().catch(() => ({}));
    const paymentId = body?.data?.id || req.nextUrl.searchParams.get('data.id');
    const action = body?.action || body?.type;

    console.log(`[Webhook MercadoPago] Recebido - Action: ${action}, PaymentID: ${paymentId}`);

    if (process.env.MERCADO_PAGO_WEBHOOK_SECRET) {
      if (!verificarAssinaturaMercadoPago(xSignature, xRequestId, String(paymentId))) {
        console.warn('[Webhook MercadoPago] Assinatura x-signature inválida.');
        return NextResponse.json({ error: 'Invalid Signature' }, { status: 401 });
      }
    }

    if (action !== 'payment.created' && action !== 'payment.updated' && action !== 'payment') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
    }

    // Consulta Ativa de Checagem (GET /v1/payments/{id}) no Mercado Pago API se o token estiver presente
    let mpStatus = 'approved';
    let pedidoId = paymentId;

    if (process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        },
      });

      if (!mpRes.ok) {
        console.error(`[Webhook MercadoPago] Erro ao consultar pagamento ID ${paymentId} na API do MP.`);
        return NextResponse.json({ error: 'Failed to fetch payment status from MP' }, { status: 502 });
      }

      const paymentDetails = await mpRes.json();
      mpStatus = paymentDetails.status;
      pedidoId = paymentDetails.external_reference || paymentId;
    }

    if (mpStatus === 'approved') {
      const { data: pedido, error: fetchErr } = await supabaseAdmin
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();

      if (fetchErr || !pedido) {
        console.error(`[Webhook MercadoPago] Pedido ${pedidoId} não encontrado no Supabase.`);
        return NextResponse.json({ error: 'Pedido not found' }, { status: 404 });
      }

      const { error: updateErr } = await supabaseAdmin
        .from('pedidos')
        .update({
          status: 'em_preparo',
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', pedidoId);

      if (updateErr) {
        console.error(`[Webhook MercadoPago] Erro ao atualizar pedido ${pedidoId}:`, updateErr);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      // Notificação ao n8n
      if (process.env.N8N_BASE_URL) {
        try {
          await fetch(`${process.env.N8N_BASE_URL}/webhook/order-created`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event: 'order_payment_approved',
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
          console.error('[Webhook MercadoPago] Erro ao notificar n8n:', n8nErr);
        }
      }
    }

    return NextResponse.json({ success: true, paymentId, mpStatus }, { status: 200 });
  } catch (error: any) {
    console.error('[Webhook MercadoPago] Exceção não tratada:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
