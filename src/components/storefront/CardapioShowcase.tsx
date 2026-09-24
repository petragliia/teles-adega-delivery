'use client';

import React from 'react';
import { Crown, Snowflake, Beer, Wine, GlassWater, Sparkles, Bike, ShieldCheck, ShoppingCart } from 'lucide-react';
import { Produto } from '@/types/storefront';
import { CardapioProductCard } from './CardapioProductCard';
import { PRODUTOS_CARDAPIO } from '@/data/cardapioData';
import { useCartStore } from '@/store/useCartStore';

interface CardapioShowcaseProps {
  selectedCategorySlug: string;
  produtos?: Produto[];
}

export function CardapioShowcase({ selectedCategorySlug, produtos }: CardapioShowcaseProps) {
  const openCart = useCartStore((state) => state.clearCart); // or action to open drawer

  // Se produtos vierem do Supabase com dados preenchidos, mescla ou utiliza a base do cardápio
  const allProducts = produtos && produtos.length > 0 ? produtos : PRODUTOS_CARDAPIO;

  // Filtragem por seções
  const destilados = allProducts.filter(
    (p) => p.categoria_id === 'destilados' || p.categoria_nome?.toLowerCase().includes('destilad')
  );

  const gelosSnacks = allProducts.filter(
    (p) =>
      p.categoria_id === 'gelos-e-snacks' ||
      p.categoria_id === 'gelo-saborizado' ||
      p.categoria_id === 'snacks' ||
      p.categoria_nome?.toLowerCase().includes('gelo') ||
      p.categoria_nome?.toLowerCase().includes('snack')
  );

  const cervejas = allProducts.filter(
    (p) => p.categoria_id === 'cervejas' || p.categoria_nome?.toLowerCase().includes('cerveja')
  );

  const drinks = allProducts.filter(
    (p) =>
      p.categoria_id === 'drinks' ||
      p.categoria_id === 'combos' ||
      p.categoria_nome?.toLowerCase().includes('drink') ||
      p.categoria_nome?.toLowerCase().includes('combo')
  );

  const outrasBebidas = allProducts.filter(
    (p) =>
      p.categoria_id === 'outras-bebidas' ||
      p.categoria_id === 'energeticos' ||
      p.categoria_id === 'refrigerantes' ||
      p.categoria_nome?.toLowerCase().includes('energetic') ||
      p.categoria_nome?.toLowerCase().includes('outras') ||
      p.categoria_nome?.toLowerCase().includes('refrigerante')
  );

  const showAll = selectedCategorySlug === 'todas';
  const showDestilados = showAll || selectedCategorySlug === 'destilados';
  const showGelos = showAll || selectedCategorySlug === 'gelos-e-snacks' || selectedCategorySlug === 'gelo-saborizado';
  const showCervejas = showAll || selectedCategorySlug === 'cervejas';
  const showDrinks = showAll || selectedCategorySlug === 'drinks' || selectedCategorySlug === 'combos';
  const showOutras = showAll || selectedCategorySlug === 'outras-bebidas' || selectedCategorySlug === 'energeticos';

  return (
    <section className="w-full bg-[#070605] py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        {/* ================= 1. SEÇÃO DESTILADOS ================= */}
        {showDestilados && destilados.length > 0 && (
          <div className="relative rounded-2xl md:rounded-3xl border border-[#C69234]/40 bg-gradient-to-b from-[#16130D] via-[#0E0C09] to-[#080706] p-4 sm:p-6 shadow-2xl shadow-amber-950/20 backdrop-blur-md">
            {/* Header da Seção */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#362712] pb-3 mb-4 gap-1">
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-[#F59E0B] drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <h2 className="text-lg sm:text-2xl font-black tracking-[0.2em] uppercase font-serif bg-gradient-to-r from-amber-200 via-[#F59E0B] to-amber-500 bg-clip-text text-transparent">
                  DESTILADOS
                </h2>
              </div>
              <span className="text-[10px] sm:text-xs text-[#BFA069] tracking-[0.25em] font-medium uppercase">
                TRADIÇÃO • QUALIDADE • SABOR
              </span>
            </div>

            {/* Grid dos Produtos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3.5">
              {destilados.map((item) => (
                <CardapioProductCard key={item.id} produto={item} />
              ))}
            </div>
          </div>
        )}

        {/* ================= 2. SEÇÃO GELOS E SNACKS ================= */}
        {showGelos && gelosSnacks.length > 0 && (
          <div className="relative rounded-2xl md:rounded-3xl border border-[#C69234]/40 bg-gradient-to-b from-[#16130D] via-[#0E0C09] to-[#080706] p-4 sm:p-6 shadow-2xl shadow-amber-950/20 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#362712] pb-3 mb-4 gap-1">
              <div className="flex items-center gap-2.5">
                <Snowflake className="w-5 h-5 sm:w-6 sm:h-6 text-[#F59E0B] drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <h2 className="text-lg sm:text-2xl font-black tracking-[0.2em] uppercase font-serif bg-gradient-to-r from-amber-200 via-[#F59E0B] to-amber-500 bg-clip-text text-transparent">
                  GELOS E SNACKS
                </h2>
              </div>
              <span className="text-[10px] sm:text-xs text-[#BFA069] tracking-[0.25em] font-medium uppercase">
                REFRESCÂNCIA EM QUALQUER MOMENTO
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
              {gelosSnacks.map((item) => (
                <CardapioProductCard key={item.id} produto={item} />
              ))}
            </div>
          </div>
        )}

        {/* ================= 3. SEÇÃO CERVEJAS ================= */}
        {showCervejas && cervejas.length > 0 && (
          <div className="relative rounded-2xl md:rounded-3xl border border-[#C69234]/40 bg-gradient-to-b from-[#16130D] via-[#0E0C09] to-[#080706] p-4 sm:p-6 shadow-2xl shadow-amber-950/20 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#362712] pb-3 mb-4 gap-1">
              <div className="flex items-center gap-2.5">
                <Beer className="w-5 h-5 sm:w-6 sm:h-6 text-[#F59E0B] drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <h2 className="text-lg sm:text-2xl font-black tracking-[0.2em] uppercase font-serif bg-gradient-to-r from-amber-200 via-[#F59E0B] to-amber-500 bg-clip-text text-transparent">
                  CERVEJAS
                </h2>
              </div>
              <span className="text-[10px] sm:text-xs text-[#BFA069] tracking-[0.25em] font-medium uppercase">
                AS MELHORES MARCAS, SEMPRE GELADAS
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
              {cervejas.map((item) => (
                <CardapioProductCard key={item.id} produto={item} />
              ))}
            </div>
          </div>
        )}

        {/* ================= 4 & 5. SEÇÕES DRINKS E OUTRAS BEBIDAS (LADO A LADO) ================= */}
        {(showDrinks || showOutras) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Box Drinks e Coquetéis */}
            {showDrinks && drinks.length > 0 && (
              <div
                className={`relative rounded-2xl md:rounded-3xl border border-[#C69234]/40 bg-gradient-to-b from-[#16130D] via-[#0E0C09] to-[#080706] p-4 sm:p-6 shadow-2xl shadow-amber-950/20 backdrop-blur-md ${
                  showOutras && outrasBebidas.length > 0 ? 'lg:col-span-6' : 'lg:col-span-12'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#362712] pb-3 mb-4 gap-1">
                  <div className="flex items-center gap-2">
                    <Wine className="w-5 h-5 sm:w-6 sm:h-6 text-[#F59E0B] drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    <h2 className="text-base sm:text-xl font-black tracking-[0.18em] uppercase font-serif bg-gradient-to-r from-amber-200 via-[#F59E0B] to-amber-500 bg-clip-text text-transparent">
                      DRINKS E COQUETÉIS
                    </h2>
                  </div>
                  <span className="text-[9px] sm:text-[11px] text-[#BFA069] tracking-[0.2em] font-medium uppercase">
                    SABORES QUE SURPREENDEM
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
                  {drinks.map((item) => (
                    <CardapioProductCard key={item.id} produto={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Box Outras Bebidas */}
            {showOutras && outrasBebidas.length > 0 && (
              <div
                className={`relative rounded-2xl md:rounded-3xl border border-[#C69234]/40 bg-gradient-to-b from-[#16130D] via-[#0E0C09] to-[#080706] p-4 sm:p-6 shadow-2xl shadow-amber-950/20 backdrop-blur-md ${
                  showDrinks && drinks.length > 0 ? 'lg:col-span-6' : 'lg:col-span-12'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#362712] pb-3 mb-4 gap-1">
                  <div className="flex items-center gap-2">
                    <GlassWater className="w-5 h-5 sm:w-6 sm:h-6 text-[#F59E0B] drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    <h2 className="text-base sm:text-xl font-black tracking-[0.18em] uppercase font-serif bg-gradient-to-r from-amber-200 via-[#F59E0B] to-amber-500 bg-clip-text text-transparent">
                      OUTRAS BEBIDAS
                    </h2>
                  </div>
                  <span className="text-[9px] sm:text-[11px] text-[#BFA069] tracking-[0.2em] font-medium uppercase">
                    REFRIGERANTES, SUCOS E MAIS
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
                  {outrasBebidas.map((item) => (
                    <CardapioProductCard key={item.id} produto={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 6. BANNER INFERIOR DOURADO (EXATO COMO NA IMAGEM) ================= */}
        <div className="relative rounded-2xl md:rounded-3xl border border-[#C69234]/50 bg-gradient-to-r from-[#1E170C] via-[#141008] to-[#1C160B] p-4 sm:p-6 shadow-2xl shadow-amber-950/40 overflow-hidden">
          {/* Brilho âmbar de fundo */}
          <div className="pointer-events-none absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent" />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            {/* Ícones de Compromisso */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-8 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#F59E0B]">
                  <Snowflake className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-white font-black uppercase tracking-wider block text-[11px] sm:text-xs">
                    BEBIDAS SEMPRE
                  </span>
                  <span className="text-amber-400 font-bold block text-[10px] sm:text-[11px]">
                    GELADAS
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#F59E0B]">
                  <Bike className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-white font-black uppercase tracking-wider block text-[11px] sm:text-xs">
                    ENTREGA RÁPIDA
                  </span>
                  <span className="text-amber-400 font-bold block text-[10px] sm:text-[11px]">
                    E SEGURA
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#F59E0B]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-white font-black uppercase tracking-wider block text-[11px] sm:text-xs">
                    SUA BEBIDA FAVORITA
                  </span>
                  <span className="text-amber-400 font-bold block text-[10px] sm:text-[11px]">
                    ONDE VOCÊ ESTIVER
                  </span>
                </div>
              </div>
            </div>

            {/* Chamada Cursiva "Peça agora!" */}
            <div className="flex items-center gap-3">
              <span className="font-serif italic font-extrabold text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-[#F59E0B] to-yellow-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]">
                Peça agora!
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
