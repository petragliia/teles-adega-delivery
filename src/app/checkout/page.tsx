'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { AddressCheckoutForm, AddressFormValues } from '@/components/checkout/AddressCheckoutForm';
import { PaymentSelector } from '@/components/checkout/PaymentSelector';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { useCartStore, selectCartSubtotal, selectCartTotal } from '@/store/useCartStore';
import { useHydrated } from '@/hooks/useHydrated';
import { FormaPagamento, StatusPedido } from '@/types/storefront';
import { supabase } from '@/services/supabaseClient';

export default function CheckoutPage() {
  const router = useRouter();
  const isHydrated = useHydrated();

  const itens = useCartStore((state) => state.itens);
  const taxaEntrega = useCartStore((state) => state.taxaEntrega);
  const rawSubtotal = useCartStore(selectCartSubtotal);
  const rawTotal = useCartStore(selectCartTotal);
  const clearCart = useCartStore((state) => state.clearCart);

  const [addressData, setAddressData] = useState<AddressFormValues | null>(null);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');
  const [trocoPara, setTrocoPara] = useState<number | undefined>(undefined);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F59E0B] animate-spin" />
      </div>
    );
  }

  const subtotal = rawSubtotal;
  const total = rawTotal;

  if (itens.length === 0) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#161616] border border-[#262626] flex items-center justify-center text-[#F59E0B] mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold mb-2">Sua sacola está vazia</h1>
        <p className="text-sm text-zinc-400 max-w-sm mb-6">
          Adicione bebidas geladas ao carrinho antes de prosseguir com o checkout.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-[#0D0D0D] font-bold text-sm rounded-xl transition"
        >
          Voltar para a Vitrine
        </Link>
      </div>
    );
  }

  const handleConfirmOrder = async () => {
    setErrorMessage(null);

    // Validação de endereço
    if (!addressData) {
      const formEl = document.getElementById('address-form') as HTMLFormElement | null;
      if (formEl) {
        formEl.requestSubmit();
      }
      setErrorMessage('Por favor, verifique os campos obrigatórios do endereço (marcados com *) acima.');
      return;
    }

    // Validação de troco
    if (formaPagamento === 'dinheiro' && trocoPara !== undefined && trocoPara > 0 && trocoPara < total) {
      setErrorMessage(`O valor informado para troco (R$ ${trocoPara.toFixed(2)}) deve ser maior ou igual ao valor total do pedido (R$ ${total.toFixed(2)}).`);
      return;
    }

    setIsSubmitting(true);

    try {
      const chaveIdempotencia = crypto.randomUUID();

      const payload = {
        cliente_nome: addressData.cliente_nome,
        cliente_whatsapp: addressData.cliente_whatsapp,
        endereco_rua: addressData.endereco_rua,
        endereco_numero: addressData.endereco_numero,
        endereco_bairro: addressData.bairro,
        endereco_complemento: addressData.endereco_complemento || null,
        ponto_referencia: addressData.ponto_referencia || null,
        forma_pagamento: formaPagamento,
        troco_para: formaPagamento === 'dinheiro' ? trocoPara || null : null,
        taxa_entrega: taxaEntrega,
        valor_produtos: subtotal,
        valor_total: total,
        chave_idempotencia: chaveIdempotencia,
        itens: itens.map((item) => ({
          produto_id: item.produto.id,
          quantidade: item.quantidade,
          preco_unitario: item.precoUnitario,
          subtotal: item.subtotal,
        })),
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await response.json();

      if (!response.ok || resJson.error) {
        throw new Error(resJson.error || 'Erro ao processar pedido.');
      }

      // Limpar a store Zustand e redirecionar
      clearCart();
      router.push(`/pedido/${resJson.data.id}`);
    } catch (err: unknown) {
      console.error('Erro ao processar pedido:', err);
      const errMessage = err instanceof Error ? err.message : 'Ocorreu um erro ao enviar seu pedido. Tente novamente.';
      setErrorMessage(errMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a loja
          </Link>
          <div className="text-right">
            <h1 className="text-xl font-bold text-white">Checkout Teles Adega</h1>
            <p className="text-xs text-[#F59E0B] font-medium">Finalização Segura</p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AddressCheckoutForm
              onAddressSubmit={(values) => setAddressData(values)}
              initialValues={addressData || undefined}
            />

            <PaymentSelector
              formaPagamento={formaPagamento}
              onSelectFormaPagamento={(forma) => setFormaPagamento(forma)}
              valorTotal={total}
              trocoPara={trocoPara}
              onTrocoChange={(valor) => setTrocoPara(valor)}
            />
          </div>

          <div className="space-y-6">
            <OrderSummary />

            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="w-full py-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-[#22C55E]/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando seu pedido...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Confirmar e Enviar Pedido
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-zinc-500">
              Ao confirmar, seu pedido será enviado para a esteira de preparo da adega.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
