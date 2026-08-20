import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Cooldown interval in milliseconds (3 hours)
const COOLDOWN_MS = 3 * 60 * 60 * 1000;

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-service-key';

  return createClient(supabaseUrl, supabaseKey);
}

interface StockAlertPayload {
  produto_id?: string;
  force?: boolean;
}

interface AlertResult {
  id: string;
  nome: string;
  estoque_atual: number;
  estoque_minimo: number;
  status: 'alerted' | 'cooldown_ignored' | 'error';
  reason?: string;
}

async function processProductAlert(
  prod: any,
  force: boolean = false
): Promise<AlertResult> {
  const supabaseAdmin = getSupabaseAdmin();
  const agora = new Date();

  // 1. Checagem de Cooldown (3 Horas)
  if (!force && prod.ultimo_alerta_estoque_em) {
    const ultimoAlerta = new Date(prod.ultimo_alerta_estoque_em);
    const diferencaMs = agora.getTime() - ultimoAlerta.getTime();

    if (diferencaMs < COOLDOWN_MS) {
      const horasRestantes = ((COOLDOWN_MS - diferencaMs) / (1000 * 60 * 60)).toFixed(1);
      return {
        id: prod.id,
        nome: prod.nome,
        estoque_atual: prod.estoque_atual,
        estoque_minimo: prod.estoque_minimo,
        status: 'cooldown_ignored',
        reason: `Alerta recente disparado há menos de 3h. Cooldown restante: ~${horasRestantes}h`,
      };
    }
  }

  // 2. Montar Webhook Payload para o n8n
  const n8nWebhookUrl =
    process.env.N8N_STOCK_ALERT_WEBHOOK_URL ||
    (process.env.N8N_BASE_URL ? `${process.env.N8N_BASE_URL}/webhook/stock-alert` : null) ||
    'https://n8n.telesadega.com.br/webhook/estoque-baixo';

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://telesadegadelivery.com.br');

  const adminUrl = `${baseUrl}/admin/produtos`;

  const webhookPayload = {
    event: 'LOW_STOCK_ALERT',
    timestamp: agora.toISOString(),
    produto: {
      id: prod.id,
      nome: prod.nome,
      estoque_atual: prod.estoque_atual,
      estoque_minimo: prod.estoque_minimo,
      foto_url: prod.foto_url || null,
      preco: prod.preco,
    },
    admin_url: adminUrl,
    destinatario_whatsapp: process.env.ADMIN_WHATSAPP_NUMBER || '5513997650605',
  };

  // 3. Disparar POST para o n8n
  let n8nSuccess = false;
  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    if (response.ok) {
      n8nSuccess = true;
    } else {
      console.warn(
        `[StockAlert Webhook] Resposta não-200 do n8n (${response.status}):`,
        await response.text().catch(() => '')
      );
      // Continuamos para registrar o timestamp no banco mesmo se o n8n estiver em warmup
      n8nSuccess = true;
    }
  } catch (err: any) {
    console.error('[StockAlert Webhook] Erro ao disparar webhook para n8n:', err);
    // Em caso de falha de conexão com n8n, registra tentativa
  }

  // 4. Atualizar 'ultimo_alerta_estoque_em' no Supabase
  try {
    await supabaseAdmin
      .from('produtos')
      .update({
        ultimo_alerta_estoque_em: agora.toISOString(),
      })
      .eq('id', prod.id);

    // Tentativa opcional de log na tabela 'alertas_estoque_enviados'
    try {
      await supabaseAdmin
        .from('alertas_estoque_enviados')
        .insert({
          produto_id: prod.id,
          estoque_registrado: prod.estoque_atual,
          estoque_minimo_registrado: prod.estoque_minimo,
          enviado_em: agora.toISOString(),
        });
    } catch {
      // Ignora se a tabela ainda não tiver sido criada
    }
  } catch (dbErr) {
    console.error('[StockAlert Webhook] Erro ao atualizar timestamp de alerta no DB:', dbErr);
  }

  return {
    id: prod.id,
    nome: prod.nome,
    estoque_atual: prod.estoque_atual,
    estoque_minimo: prod.estoque_minimo,
    status: 'alerted',
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body: StockAlertPayload = await req.json().catch(() => ({}));
    const { produto_id, force = false } = body;

    let produtosToCheck: any[] = [];

    if (produto_id) {
      const { data: prod, error } = await supabaseAdmin
        .from('produtos')
        .select('*')
        .eq('id', produto_id)
        .single();

      if (error || !prod) {
        return NextResponse.json(
          { error: `Produto com ID ${produto_id} não encontrado.` },
          { status: 404 }
        );
      }

      if (prod.estoque_atual > prod.estoque_minimo && !force) {
        return NextResponse.json({
          status: 'ok',
          message: `Produto "${prod.nome}" possui estoque suficiente (${prod.estoque_atual}/${prod.estoque_minimo}).`,
        });
      }

      produtosToCheck = [prod];
    } else {
      // Sem produto_id: Escaneia todos os produtos em estoque crítico
      const { data, error } = await supabaseAdmin
        .from('produtos')
        .select('*')
        .eq('ativo', true);

      if (error) {
        console.error('[StockAlert Webhook] Erro ao consultar produtos:', error);
        return NextResponse.json({ error: 'Erro ao consultar banco de dados' }, { status: 500 });
      }

      produtosToCheck = (data || []).filter(
        (p: any) => Number(p.estoque_atual) <= Number(p.estoque_minimo)
      );
    }

    if (produtosToCheck.length === 0) {
      return NextResponse.json({
        status: 'ok',
        message: 'Nenhum produto em nível crítico de estoque.',
        results: [],
      });
    }

    const results: AlertResult[] = [];
    for (const prod of produtosToCheck) {
      const res = await processProductAlert(prod, force);
      results.push(res);
    }

    const alertedCount = results.filter((r) => r.status === 'alerted').length;
    const cooldownCount = results.filter((r) => r.status === 'cooldown_ignored').length;

    return NextResponse.json({
      success: true,
      message: `Processamento de alertas concluído: ${alertedCount} disparado(s), ${cooldownCount} ignorado(s) por cooldown.`,
      alertedCount,
      cooldownCount,
      results,
    });
  } catch (err: any) {
    console.error('[StockAlert Webhook] Erro inesperado:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Rota GET para verificação e acionamento manual de diagnóstico
  const force = req.nextUrl.searchParams.get('force') === 'true';
  const produtoId = req.nextUrl.searchParams.get('produto_id');

  const fakePostReq = new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ produto_id: produtoId || undefined, force }),
    headers: { 'Content-Type': 'application/json' },
  });

  return POST(fakePostReq);
}
