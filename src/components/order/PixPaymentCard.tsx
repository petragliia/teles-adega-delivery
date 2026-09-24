'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, Copy, CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { StatusPedido } from '@/types/storefront';

interface PixPaymentCardProps {
  pedidoId: string;
  valorTotal: number;
  status: StatusPedido;
  initialPixData?: {
    encodedImage?: string;
    payload?: string;
    expirationDate?: string;
  } | null;
}

export function PixPaymentCard({
  pedidoId,
  valorTotal,
  status,
  initialPixData,
}: PixPaymentCardProps) {
  const [pixData, setPixData] = useState(initialPixData || null);
  const [loading, setLoading] = useState(!initialPixData && status === 'aguardando_pagamento');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPago = status !== 'aguardando_pagamento' && status !== 'cancelado';

  useEffect(() => {
    if (initialPixData) {
      setPixData(initialPixData);
      setLoading(false);
      return;
    }

    if (status !== 'aguardando_pagamento') {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchPixInfo() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/checkout/pix?pedidoId=${pedidoId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Erro ao carregar chave Pix');
        }

        if (isMounted) {
          if (data.pix) {
            setPixData(data.pix);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('[PixPaymentCard] Erro:', err);
          setError('Não foi possível carregar os dados do Pix. Tente recarregar.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPixInfo();

    return () => {
      isMounted = false;
    };
  }, [pedidoId, status, initialPixData]);

  const handleCopyPix = async () => {
    if (!pixData?.payload) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(pixData.payload);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = pixData.payload;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Falha ao copiar Pix:', err);
    }
  };

  // Se já foi pago
  if (isPago) {
    return (
      <div className="bg-[#161616] border border-emerald-500/30 rounded-2xl p-5 md:p-6 shadow-xl space-y-3 transition">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Pagamento Pix Confirmado!
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            </h3>
            <p className="text-xs text-zinc-400">
              O Asaas detectou seu Pix e o pedido já entrou em preparo na adega.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#161616] border border-[#F59E0B]/50 rounded-2xl p-5 md:p-6 shadow-2xl shadow-[#F59E0B]/5 space-y-5">
      {/* Header com destaque */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E]">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Pagamento Pix Instantâneo</h3>
            <p className="text-xs text-zinc-400">Liberação automática em poucos segundos</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total a Pagar</span>
          <span className="text-lg font-bold text-[#F59E0B]">
            R$ {valorTotal.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      {loading && (
        <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
          <Loader2 className="w-8 h-8 text-[#F59E0B] animate-spin" />
          <p className="text-xs text-zinc-400">Gerando cobrança Pix segura via Asaas...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && pixData && (
        <div className="space-y-5">
          {/* Imagem do QR Code */}
          {pixData.encodedImage && (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-md">
                <img
                  src={
                    pixData.encodedImage.startsWith('data:')
                      ? pixData.encodedImage
                      : `data:image/png;base64,${pixData.encodedImage}`
                  }
                  alt="QR Code Pix Asaas"
                  className="w-48 h-48 object-contain"
                />
              </div>
              <p className="text-[11px] text-zinc-400 text-center">
                Aponte a câmera do seu banco para o QR Code acima
              </p>
            </div>
          )}

          {/* Pix Copia e Cola */}
          {pixData.payload && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                Ou copie a chave Pix Copia e Cola:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={pixData.payload}
                  className="flex-1 bg-[#0D0D0D] border border-[#262626] text-zinc-300 text-xs px-3 py-2.5 rounded-xl font-mono truncate outline-none select-all focus:border-[#F59E0B]"
                />
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-lg ${
                    copied
                      ? 'bg-[#22C55E] text-white shadow-[#22C55E]/20'
                      : 'bg-[#F59E0B] hover:bg-[#D97706] text-[#0D0D0D] shadow-[#F59E0B]/10'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Pix
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Status Live Indicator */}
          <div className="p-3 bg-[#0D0D0D] border border-[#262626] rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F59E0B]"></span>
              </span>
              <span className="text-zinc-300 font-medium">Aguardando transferência...</span>
            </div>
            <span className="text-[11px] text-zinc-500">Atualização em tempo real</span>
          </div>

          {/* Instruções */}
          <div className="text-[11px] text-zinc-400 bg-[#0D0D0D]/60 p-3 rounded-xl border border-[#262626]/60 space-y-1">
            <p className="font-semibold text-zinc-300">Como pagar:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-zinc-400">
              <li>Abra o aplicativo do seu banco</li>
              <li>Escolha a opção <strong>Pix &gt; Copia e Cola</strong> (ou ler QR Code)</li>
              <li>Cole o código copiado e confirme a transferência</li>
              <li>Assim que detectado, o pedido muda automaticamente para <strong>Em Preparo</strong>!</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
