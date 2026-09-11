import { Pedido, PedidoItem } from '@/types/storefront';

export function parseEnderecoCompleto(enderecoCompleto?: string | null) {
  if (!enderecoCompleto) {
    return { rua: '', numero: '', complemento: '', bairro: '', pontoReferencia: '' };
  }

  // Formato: `${endereco_rua}, ${endereco_numero}${complemento ? ` (${complemento})` : ''} - ${bairro}${ponto_referencia ? ` [Ref: ${ponto_referencia}]` : ''}`
  const match = enderecoCompleto.match(
    /^([^,]+),\s*([^(\s-]+)(?:\s*\((.*?)\))?\s*-\s*([^[]+?)(?:\s*\[Ref:\s*(.*?)\])?$/
  );

  if (match) {
    return {
      rua: match[1]?.trim() || '',
      numero: match[2]?.trim() || '',
      complemento: match[3]?.trim() || '',
      bairro: match[4]?.trim() || '',
      pontoReferencia: match[5]?.trim() || '',
    };
  }

  return {
    rua: enderecoCompleto,
    numero: '',
    complemento: '',
    bairro: '',
    pontoReferencia: '',
  };
}

export function formatPedido(raw: Record<string, any>): Pedido {
  const cliente = raw.cliente;
  const parsedAddress = parseEnderecoCompleto(cliente?.endereco_completo);

  const rua = raw.endereco_rua || parsedAddress.rua || '';
  const numero = raw.endereco_numero || parsedAddress.numero || '';
  const bairro = raw.endereco_bairro || cliente?.bairro || parsedAddress.bairro || '';
  const complemento = raw.endereco_complemento || parsedAddress.complemento || '';
  const pontoReferencia = raw.ponto_referencia || parsedAddress.pontoReferencia || '';

  const itens: PedidoItem[] = ((raw.itens as Record<string, any>[]) || []).map((item) => ({
    id: item.id,
    pedido_id: item.pedido_id,
    produto_id: String(item.produto_id || ''),
    quantidade: Number(item.quantidade || 0),
    preco_unitario: Number(item.preco_unitario || 0),
    subtotal: Number(item.subtotal || 0),
    produto_nome: item.produto?.nome || item.produto_nome || 'Produto',
  }));

  return {
    id: String(raw.id || ''),
    cliente_id: raw.cliente_id,
    cliente_nome: raw.cliente_nome || cliente?.nome || 'Cliente',
    cliente_whatsapp: raw.cliente_whatsapp || cliente?.whatsapp || '',
    endereco_rua: rua,
    endereco_numero: numero,
    endereco_bairro: bairro,
    endereco_complemento: complemento,
    ponto_referencia: pontoReferencia,
    forma_pagamento: raw.forma_pagamento,
    troco_para: raw.troco_para,
    taxa_entrega: Number(raw.taxa_entrega || 0),
    valor_produtos: Number(raw.valor_produtos || 0),
    valor_total: Number(raw.valor_total || 0),
    status: raw.status,
    codigo_entrega: String(raw.codigo_entrega || ''),
    chave_idempotencia: String(raw.chave_idempotencia || ''),
    motoboy_id: raw.motoboy_id || null,
    motoboy: raw.motoboy || null,
    criado_em: raw.criado_em,
    atualizado_em: raw.atualizado_em,
    itens,
  };
}
