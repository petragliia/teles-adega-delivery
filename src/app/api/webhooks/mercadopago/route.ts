import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Webhook Mercado Pago - DESCONTINUADO
 * Gateway de pagamento oficial migrado para Asaas (/api/webhooks/asaas)
 */
export async function POST(req: NextRequest) {
  console.warn('[Webhook MercadoPago] Requisição recebida na rota descontinuada. O gateway oficial foi migrado para o Asaas (/api/webhooks/asaas).');
  return NextResponse.json(
    {
      status: 'deprecated',
      message: 'Integração do Mercado Pago substituída pelo Gateway Asaas. Utilize /api/webhooks/asaas.',
    },
    { status: 200 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'deprecated',
      message: 'Integração do Mercado Pago substituída pelo Gateway Asaas. Utilize /api/webhooks/asaas.',
    },
    { status: 200 }
  );
}
