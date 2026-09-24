'use client';

import React from 'react';
import { Plus, Minus, Check, ShoppingBag, Sparkles } from 'lucide-react';
import { Produto } from '@/types/storefront';
import { useCartStore } from '@/store/useCartStore';
import { useHydrated } from '@/hooks/useHydrated';
import { BeverageVisual } from './BeverageVisual';

interface CardapioProductCardProps {
  produto: Produto;
}

export function CardapioProductCard({ produto }: CardapioProductCardProps) {
  const hydrated = useHydrated();
  const itens = useCartStore((state) => state.itens);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const cartItem = hydrated
    ? itens.find((item) => item.produto.id === produto.id)
    : undefined;
  const quantidadeNoCarrinho = cartItem ? cartItem.quantidade : 0;

  const isEsgotado = !produto.ativo || produto.estoque_atual <= 0;
  const precoVigente = produto.preco_vigente ?? produto.preco;

  const formatarPreco = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEsgotado) return;
    addItem(produto, 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantidadeNoCarrinho < produto.estoque_atual) {
      updateQuantity(produto.id, quantidadeNoCarrinho + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(produto.id, quantidadeNoCarrinho - 1);
  };

  return (
    <div className="group relative flex flex-col justify-between items-center bg-gradient-to-b from-[#14120F] to-[#0A0A0A] hover:from-[#1C1813] hover:to-[#0E0C09] border border-[#2D2314] hover:border-[#F59E0B]/80 rounded-2xl p-2.5 sm:p-3.5 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 w-full text-center">
      {/* Selo sutil de Destaque */}
      {produto.destaque && (
        <div className="absolute top-2 right-2 z-10">
          <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Sparkles className="w-3 h-3" />
          </span>
        </div>
      )}

      {/* Área da Imagem / Garrafa com reflexo de gelo */}
      <div className="relative w-full h-32 sm:h-36 flex items-center justify-center mb-2 overflow-hidden">
        <BeverageVisual produto={produto} />

        {/* Esgotado Overlay */}
        {isEsgotado && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-[2px] rounded-xl flex items-center justify-center z-20">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-950/60 border border-rose-500/40 px-2 py-1 rounded">
              Esgotado
            </span>
          </div>
        )}
      </div>

      {/* Textos: Nome do Produto e Volume */}
      <div className="w-full flex-1 flex flex-col justify-between space-y-0.5 mb-2">
        <h3 className="text-white font-black text-xs sm:text-[13px] tracking-tight uppercase leading-tight line-clamp-2 group-hover:text-amber-300 transition-colors">
          {produto.nome}
        </h3>
        <p className="text-[10px] sm:text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
          {produto.volume || (produto.descricao ? produto.descricao.split(' ')[0] : 'GELADA')}
        </p>
      </div>

      {/* Botão de Preço Dourado (Estilo Cartaz) & Controles de Carrinho */}
      <div className="w-full pt-1.5 border-t border-[#261E12]">
        {quantidadeNoCarrinho > 0 ? (
          <div className="w-full flex items-center justify-between bg-[#16130D] border border-amber-500/60 rounded-xl p-1 shadow-inner">
            <button
              onClick={handleDecrement}
              type="button"
              className="w-7 h-7 rounded-lg bg-[#241D12] text-amber-400 hover:bg-amber-500 hover:text-black flex items-center justify-center font-black transition active:scale-90"
              aria-label="Diminuir"
            >
              <Minus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-xs font-black text-white leading-none">
                {quantidadeNoCarrinho}
              </span>
              <span className="text-[9px] font-bold text-amber-400/90 leading-none">
                {formatarPreco(precoVigente * quantidadeNoCarrinho)}
              </span>
            </div>
            <button
              onClick={handleIncrement}
              disabled={quantidadeNoCarrinho >= produto.estoque_atual}
              type="button"
              className="w-7 h-7 rounded-lg bg-[#F59E0B] text-black hover:bg-amber-400 flex items-center justify-center font-black transition active:scale-90 disabled:opacity-40"
              aria-label="Aumentar"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            disabled={isEsgotado}
            type="button"
            className="w-full py-1.5 px-2 bg-gradient-to-r from-[#F59E0B] via-amber-400 to-[#D97706] hover:brightness-110 active:scale-95 text-[#0D0D0D] font-black text-xs sm:text-sm rounded-xl shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 group/btn"
          >
            <span>{formatarPreco(precoVigente)}</span>
            <Plus className="w-3.5 h-3.5 stroke-[3] opacity-0 -translate-x-1 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-200" />
          </button>
        )}
      </div>
    </div>
  );
}
