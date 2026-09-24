/**
 * Asaas Payment Gateway Integration - Teles Adega Delivery
 * API v3 Client para Cobrança Pix e Webhook
 */

export interface ClienteAsaasParams {
  nome: string;
  telefone: string;
  cpfCnpj?: string;
  email?: string;
  externalReference?: string;
}

export interface CriarCobrancaPixParams {
  pedidoId: string;
  valorTotal: number;
  cliente: ClienteAsaasParams;
  descricao?: string;
}

export interface PixQrCodeResult {
  paymentId: string;
  encodedImage: string; // Base64 da imagem QR Code
  payload: string; // Código Pix Copia e Cola
  expirationDate?: string;
  value: number;
}

export interface AsaasPaymentDetails {
  id: string;
  customer: string;
  value: number;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  billingType: string;
  externalReference?: string;
  description?: string;
  dateCreated: string;
}

/**
 * Retorna a URL base do Asaas de acordo com a variável ASAAS_ENVIRONMENT
 */
export function getAsaasBaseUrl(): string {
  const env = (process.env.ASAAS_ENVIRONMENT || 'sandbox').toLowerCase().trim();
  if (env === 'production' || env === 'prod') {
    return 'https://api.asaas.com/v3';
  }
  return 'https://api-sandbox.asaas.com/v3';
}

/**
 * Retorna os headers padronizados para autenticação na API do Asaas
 */
export function getAsaasHeaders(): HeadersInit {
  const apiKey = process.env.ASAAS_API_KEY || '';
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'TelesAdegaDelivery/1.0',
    access_token: apiKey,
  };
}

/**
 * Valida o token de webhook configurado no painel do Asaas
 */
export function validarWebhookToken(tokenRecebido: string | null): boolean {
  const configuredToken = process.env.ASAAS_WEBHOOK_TOKEN;
  // Se não houver token configurado em ambiente de desenvolvimento, aceita a requisição
  if (!configuredToken) {
    console.warn('[Asaas Webhook] ASAAS_WEBHOOK_TOKEN não configurado no ambiente. Ignorando validação estrita de token.');
    return true;
  }
  return tokenRecebido === configuredToken;
}

/**
 * Localiza um cliente existente pelo telefone ou cadastra um novo no Asaas
 */
export async function obterOuCriarClienteAsaas(cliente: ClienteAsaasParams): Promise<string> {
  const apiKey = process.env.ASAAS_API_KEY;
  const cleanPhone = cliente.telefone.replace(/\D/g, '');

  if (!apiKey) {
    console.warn('[Asaas] ASAAS_API_KEY não configurada. Usando identificador fictício de cliente.');
    return `cus_mock_${cleanPhone || 'default'}`;
  }

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders();

  // 1. Tentar buscar cliente existente pelo telefone celular
  try {
    const searchUrl = `${baseUrl}/customers?mobilePhone=${encodeURIComponent(cleanPhone)}`;
    const searchRes = await fetch(searchUrl, {
      method: 'GET',
      headers,
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData?.data && searchData.data.length > 0) {
        return searchData.data[0].id;
      }
    }
  } catch (searchErr) {
    console.warn('[Asaas] Erro ao consultar cliente existente:', searchErr);
  }

  // 2. Se não encontrou, criar novo cliente
  const payloadCustomer = {
    name: cliente.nome,
    mobilePhone: cleanPhone,
    cpfCnpj: cliente.cpfCnpj ? cliente.cpfCnpj.replace(/\D/g, '') : undefined,
    email: cliente.email || undefined,
    externalReference: cliente.externalReference || undefined,
    notificationDisabled: true, // Notificações via WhatsApp serão orquestradas pelo Teles Adega / n8n
  };

  const createRes = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payloadCustomer),
  });

  if (!createRes.ok) {
    const errBody = await createRes.json().catch(() => ({}));
    const errMsg = errBody?.errors?.[0]?.description || createRes.statusText;
    console.error('[Asaas] Falha ao criar cliente no Asaas:', errBody);
    throw new Error(`Erro ao cadastrar cliente no Asaas: ${errMsg}`);
  }

  const newCustomer = await createRes.json();
  return newCustomer.id;
}

/**
 * Cria uma cobrança Pix no Asaas vinculada ao pedido
 */
export async function criarCobrancaPixAsaas(params: CriarCobrancaPixParams): Promise<PixQrCodeResult> {
  const apiKey = process.env.ASAAS_API_KEY;
  const shortOrderId = params.pedidoId.slice(0, 8);

  // MOCK / FALLBACK caso a chave da API ainda não tenha sido adicionada ao .env
  if (!apiKey) {
    console.warn(
      `[Asaas] ASAAS_API_KEY não configurada no ambiente (.env). Gerando cobrança Pix simulada para o pedido #${shortOrderId}.`
    );
    const mockPayload = `00020126580014br.gov.bcb.pix0136${params.pedidoId}520400005303986540${params.valorTotal.toFixed(2)}5802BR5919TELES ADEGA DELIVERY6013PRAIA GRANDE62070503***6304MOCK`;
    // Imagem base64 SVG estilizada como QR Code simulado
    const mockSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#ffffff"/><rect x="20" y="20" width="80" height="80" fill="#000000"/><rect x="30" y="30" width="60" height="60" fill="#ffffff"/><rect x="40" y="40" width="40" height="40" fill="#000000"/><rect x="200" y="20" width="80" height="80" fill="#000000"/><rect x="210" y="30" width="60" height="60" fill="#ffffff"/><rect x="220" y="40" width="40" height="40" fill="#000000"/><rect x="20" y="200" width="80" height="80" fill="#000000"/><rect x="30" y="210" width="60" height="60" fill="#ffffff"/><rect x="40" y="220" width="40" height="40" fill="#000000"/><text x="150" y="160" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#0D0D0D">PIX ASAAS SIMULADO</text><text x="150" y="180" font-family="sans-serif" font-size="11" text-anchor="middle" fill="#71717A">R$ ${params.valorTotal.toFixed(2)}</text></svg>`;
    const mockBase64 = Buffer.from(mockSvg).toString('base64');

    return {
      paymentId: `pay_mock_${params.pedidoId.replace(/-/g, '').slice(0, 12)}`,
      encodedImage: mockBase64,
      payload: mockPayload,
      expirationDate: new Date(Date.now() + 3600 * 1000).toISOString(),
      value: params.valorTotal,
    };
  }

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders();

  // 1. Verificar se já existe cobrança com este externalReference
  try {
    const existingCheckRes = await fetch(
      `${baseUrl}/payments?externalReference=${encodeURIComponent(params.pedidoId)}`,
      { method: 'GET', headers }
    );

    if (existingCheckRes.ok) {
      const existingData = await existingCheckRes.json();
      const activeCharge = existingData?.data?.find(
        (p: AsaasPaymentDetails) => p.status === 'PENDING' || p.status === 'RECEIVED' || p.status === 'CONFIRMED'
      );

      if (activeCharge) {
        console.log(`[Asaas] Cobrança existente encontrada: ${activeCharge.id} para pedido ${params.pedidoId}`);
        const qrCodeData = await obterQrCodePixAsaas(activeCharge.id);
        return {
          paymentId: activeCharge.id,
          encodedImage: qrCodeData.encodedImage,
          payload: qrCodeData.payload,
          expirationDate: qrCodeData.expirationDate,
          value: activeCharge.value,
        };
      }
    }
  } catch (checkErr) {
    console.warn('[Asaas] Aviso ao checar cobrança existente:', checkErr);
  }

  // 2. Obter ou criar cliente no Asaas
  const customerId = await obterOuCriarClienteAsaas(params.cliente);

  // 3. Vencimento: hoje + 1 dia (para Pix de delivery imediato)
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const dueDate = tomorrow.toISOString().split('T')[0];

  const paymentPayload = {
    customer: customerId,
    billingType: 'PIX',
    value: Number(params.valorTotal.toFixed(2)),
    dueDate,
    description: params.descricao || `Pedido #${shortOrderId} - Teles Adega Delivery`,
    externalReference: params.pedidoId,
    postalService: false,
  };

  const createPaymentRes = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify(paymentPayload),
  });

  if (!createPaymentRes.ok) {
    const errBody = await createPaymentRes.json().catch(() => ({}));
    const errMsg = errBody?.errors?.[0]?.description || createPaymentRes.statusText;
    console.error('[Asaas] Erro ao criar cobrança no Asaas:', errBody);
    throw new Error(`Falha ao criar cobrança Pix no Asaas: ${errMsg}`);
  }

  const paymentData: AsaasPaymentDetails = await createPaymentRes.json();

  // 4. Obter o QR Code e código Copia e Cola
  const qrCodeData = await obterQrCodePixAsaas(paymentData.id);

  return {
    paymentId: paymentData.id,
    encodedImage: qrCodeData.encodedImage,
    payload: qrCodeData.payload,
    expirationDate: qrCodeData.expirationDate,
    value: paymentData.value,
  };
}

/**
 * Consulta e retorna o QR Code Pix e Copia e Cola de uma cobrança existente
 */
export async function obterQrCodePixAsaas(
  paymentId: string
): Promise<{ encodedImage: string; payload: string; expirationDate?: string }> {
  const apiKey = process.env.ASAAS_API_KEY;

  if (!apiKey || paymentId.startsWith('pay_mock_')) {
    const mockSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#ffffff"/><text x="150" y="150" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#000">PIX SIMULADO</text></svg>`;
    return {
      encodedImage: Buffer.from(mockSvg).toString('base64'),
      payload: `00020126580014br.gov.bcb.pix0136mock-${paymentId}5204000053039865802BR5919TELES ADEGA6013PRAIA GRANDE62070503***6304MOCK`,
      expirationDate: new Date(Date.now() + 3600 * 1000).toISOString(),
    };
  }

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders();

  const qrRes = await fetch(`${baseUrl}/payments/${paymentId}/pixQrCode`, {
    method: 'GET',
    headers,
  });

  if (!qrRes.ok) {
    const errBody = await qrRes.json().catch(() => ({}));
    console.error(`[Asaas] Erro ao buscar QR Code Pix para pagamento ${paymentId}:`, errBody);
    throw new Error('Falha ao obter QR Code Pix do Asaas');
  }

  const qrData = await qrRes.json();
  return {
    encodedImage: qrData.encodedImage,
    payload: qrData.payload,
    expirationDate: qrData.expirationDate,
  };
}

/**
 * Consulta dados detalhados da cobrança pelo externalReference (pedidoId)
 */
export async function consultarCobrancaPorPedidoId(pedidoId: string): Promise<AsaasPaymentDetails | null> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) return null;

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders();

  try {
    const res = await fetch(
      `${baseUrl}/payments?externalReference=${encodeURIComponent(pedidoId)}`,
      { method: 'GET', headers }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (data?.data && data.data.length > 0) {
      return data.data[0] as AsaasPaymentDetails;
    }
  } catch (err) {
    console.error(`[Asaas] Erro ao consultar cobrança do pedido ${pedidoId}:`, err);
  }

  return null;
}
