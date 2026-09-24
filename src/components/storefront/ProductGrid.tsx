'use client';

import React, { useEffect, useState } from 'react';
import { Produto } from '@/types/storefront';
import { supabase } from '@/services/supabaseClient';
import { CardapioShowcase } from './CardapioShowcase';
import { PRODUTOS_CARDAPIO } from '@/data/cardapioData';

export interface ProductGridProps {
  selectedCategorySlug: string;
  initialProdutos?: Produto[];
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  selectedCategorySlug,
  initialProdutos,
}) => {
  const [produtos, setProdutos] = useState<Produto[]>(initialProdutos || PRODUTOS_CARDAPIO);
  const [loading, setLoading] = useState<boolean>(initialProdutos === undefined);

  useEffect(() => {
    if (initialProdutos !== undefined && initialProdutos.length > 0) {
      setProdutos(initialProdutos);
      setLoading(false);
      return;
    }

    async function fetchProdutos() {
      setLoading(true);
      try {
        const { data: viewData, error: viewError } = await supabase
          .from('vw_produtos_vitrine')
          .select('*')
          .eq('ativo', true);

        if (!viewError && viewData && viewData.length > 0) {
          const mapped: Produto[] = (viewData as Record<string, unknown>[]).map((item) => ({
            ...(item as unknown as Produto),
            preco: Number(item.preco_vigente ?? item.preco_original ?? item.preco ?? 0),
            preco_original: Number(item.preco_original ?? item.preco ?? 0),
            preco_vigente: Number(item.preco_vigente ?? item.preco ?? 0),
            em_promocao: Boolean(item.em_promocao),
            percentual_desconto: Number(item.percentual_desconto || 0),
          }));
          setProdutos(mapped);
          return;
        }

        const { data, error } = await supabase
          .from('produtos')
          .select('*')
          .eq('ativo', true)
          .order('destaque', { ascending: false });

        if (!error && data && data.length > 0) {
          setProdutos(
            (data as Record<string, unknown>[]).map((p) => ({
              ...(p as unknown as Produto),
              preco: Number(p.preco || 0),
              preco_original: Number(p.preco || 0),
              preco_vigente: Number(p.preco || 0),
              em_promocao: false,
              percentual_desconto: 0,
            }))
          );
        } else {
          setProdutos(PRODUTOS_CARDAPIO);
        }
      } catch (err) {
        console.error('Erro ao buscar produtos no Supabase:', err);
        setProdutos(PRODUTOS_CARDAPIO);
      } finally {
        setLoading(false);
      }
    }

    fetchProdutos();
  }, [initialProdutos]);

  if (loading) {
    return (
      <section className="w-full bg-[#070605] py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {[1, 2].map((sectionIdx) => (
            <div
              key={sectionIdx}
              className="rounded-3xl border border-[#3A2C14]/50 bg-[#12100C] p-6 animate-pulse space-y-4"
            >
              <div className="h-6 w-48 bg-[#2A200F] rounded-lg" />
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="h-44 bg-[#1C160B] rounded-2xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <CardapioShowcase
      selectedCategorySlug={selectedCategorySlug}
      produtos={produtos.length > 0 ? produtos : PRODUTOS_CARDAPIO}
    />
  );
};
