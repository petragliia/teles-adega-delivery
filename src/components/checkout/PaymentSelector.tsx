'use client';

import React from 'react';
import { CreditCard, Banknote, ShieldAlert, CheckCircle2, QrCode } from 'lucide-react';
import { FormaPagamento } from '@/types/storefront';

interface PaymentSelectorProps {
  formaPagamento: FormaPagamento;
  onSelectFormaPagamento: (forma: FormaPagamento) => void;
  valorTotal: number;
  trocoPara: number | undefined;
  onTrocoChange: (valor: number | undefined) => void;
}

export function PaymentSelector({
  formaPagamento,
  onSelectFormaPagamento,
  valorTotal,
  trocoPara,
  onTrocoChange,
}: PaymentSelectorProps) {
  const trocoInvalido =
    formaPagamento === 'dinheiro' &&
    trocoPara !== undefined &&
    trocoPara > 0 &&
    trocoPara < valorTotal;

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
      <div className="flex items-center gap-3 border-b border-[#262626] pb-4">
        <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">2. Forma de Pagamento</h2>
          <p className="text-xs text-zinc-400">Escolha como deseja pagar a sua entrega</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Opção Pix */}
        <button
          type="button"
          onClick={() => onSelectFormaPagamento('pix')}
          className={`p-4 rounded-xl border flex flex-col items-center text-center transition ${
            formaPagamento === 'pix'
              ? 'bg-[#F59E0B]/10 border-[#F59E0B] text-white shadow-lg shadow-[#F59E0B]/10'
              : 'bg-[#0D0D0D] border-[#262626] text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E] mb-2">
            <QrCode className="w-6 h-6" />
          </div>
          <span className="font-bold text-base text-white">Pix Instantâneo</span>
          <span className="text-xs text-zinc-400 mt-1">Aprovação imediata & Chave copia-e-cola</span>
        </button>

        {/* Opção Dinheiro */}
        <button
          type="button"
          onClick={() => onSelectFormaPagamento('dinheiro')}
          className={`p-4 rounded-xl border flex flex-col items-center text-center transition ${
            formaPagamento === 'dinheiro'
              ? 'bg-[#F59E0B]/10 border-[#F59E0B] text-white shadow-lg shadow-[#F59E0B]/10'
              : 'bg-[#0D0D0D] border-[#262626] text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] mb-2">
            <Banknote className="w-6 h-6" />
          </div>
          <span className="font-bold text-base text-white">Dinheiro</span>
          <span className="text-xs text-zinc-400 mt-1">Pagamento no ato da entrega</span>
        </button>
      </div>

      {/* Painel do Pix */}
      {formaPagamento === 'pix' && (
        <div className="p-4 bg-[#0D0D0D] border border-[#262626] rounded-xl text-xs space-y-2 text-zinc-300">
          <div className="flex items-center gap-2 text-[#22C55E] font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Pagamento por Chave Pix ou QR Code</span>
          </div>
          <p>
            Após confirmar o pedido, o QR Code Pix e a chave copia-e-cola serão gerados para você efetuar a transferência no aplicativo do seu banco.
          </p>
        </div>
      )}

      {/* Painel de Dinheiro */}
      {formaPagamento === 'dinheiro' && (
        <div className="p-4 bg-[#0D0D0D] border border-[#262626] rounded-xl space-y-3">
          <label className="block text-xs font-semibold text-zinc-300">
            Precisa de troco para quanto? (Opcional - Deixe em branco se for valor exato)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-zinc-500">R$</span>
            <input
              type="number"
              step="0.01"
              placeholder={`Ex: ${(valorTotal + 10).toFixed(2)}`}
              value={trocoPara || ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onTrocoChange(isNaN(val) ? undefined : val);
              }}
              className="w-full bg-[#161616] border border-[#262626] focus:border-[#F59E0B] text-white pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition"
            />
          </div>

          {trocoInvalido && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              O valor para troco deve ser maior ou igual ao total do pedido (R${' '}
              {valorTotal.toFixed(2).replace('.', ',')}).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
