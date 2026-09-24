'use client';

import React from 'react';
import Image from 'next/image';
import { Produto } from '@/types/storefront';

interface BeverageVisualProps {
  produto: Produto;
  className?: string;
}

export function BeverageVisual({ produto, className = '' }: BeverageVisualProps) {
  // Se tem foto_url válida pré-carregada
  if (produto.foto_url && produto.foto_url.trim().length > 0) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center p-2 ${className}`}>
        <Image
          src={produto.foto_url}
          alt={produto.nome}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 15vw"
          className="object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]"
        />
        {/* Reflexo de gelo inferior */}
        <div className="absolute -bottom-1 inset-x-4 h-2 bg-gradient-to-t from-amber-500/20 to-transparent blur-sm rounded-full pointer-events-none" />
      </div>
    );
  }

  // Renderizador de Arte Vetorial estilizada de acordo com o produto
  const nomeLower = produto.nome.toLowerCase();

  // 1. Tanqueray Gin (Garrafa verde icônica)
  if (nomeLower.includes('tanqueray')) {
    const isSevilla = nomeLower.includes('sevilla');
    return (
      <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
        <div className="relative w-16 h-28 sm:w-20 sm:h-32 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-110">
          {/* Tampa */}
          <div className="w-5 h-3 bg-zinc-300 rounded-t-sm shadow-sm" />
          {/* Gargalo */}
          <div className={`w-4 h-6 ${isSevilla ? 'bg-amber-700' : 'bg-emerald-900'} border border-emerald-600/50`} />
          {/* Corpo com ombro arredondado */}
          <div className={`relative w-12 sm:w-14 h-20 ${isSevilla ? 'bg-gradient-to-b from-amber-600 to-amber-900' : 'bg-gradient-to-b from-emerald-600 via-emerald-800 to-emerald-950'} rounded-t-xl rounded-b-md shadow-2xl flex flex-col items-center justify-center border border-emerald-500/40 overflow-hidden`}>
            {/* Brilho do vidro */}
            <div className="absolute top-0 left-1 w-1.5 h-full bg-white/20 blur-[0.5px]" />
            {/* Selo de cera vermelho */}
            <div className="w-4 h-4 rounded-full bg-red-600 border border-red-400 shadow-md mb-1 flex items-center justify-center">
              <span className="text-[6px] font-black text-white">T</span>
            </div>
            {/* Rótulo branco */}
            <div className="w-10 bg-white/95 py-0.5 px-1 rounded-sm text-center shadow">
              <span className="text-[7px] font-black tracking-widest text-emerald-950 block leading-none">TANQUERAY</span>
              <span className="text-[5px] text-zinc-600 block leading-none scale-90">LONDON DRY</span>
            </div>
          </div>
          {/* Cubos de gelo na base */}
          <div className="absolute -bottom-1 flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-white/40 border border-white/60 rotate-12 backdrop-blur-sm" />
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-200/40 border border-white/60 -rotate-12 backdrop-blur-sm" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Baly Tradicional / Melancia
  if (nomeLower.includes('baly')) {
    const isMelancia = nomeLower.includes('melancia');
    return (
      <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
        <div className="relative w-16 h-28 sm:w-20 sm:h-32 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <div className="w-4 h-2 bg-zinc-400 rounded-t-sm" />
          <div className={`w-3.5 h-5 ${isMelancia ? 'bg-rose-900' : 'bg-emerald-950'}`} />
          <div className={`relative w-10 sm:w-12 h-20 ${isMelancia ? 'bg-gradient-to-b from-rose-600 via-rose-700 to-rose-950' : 'bg-gradient-to-b from-emerald-600 via-emerald-800 to-emerald-950'} rounded-t-xl rounded-b-md shadow-2xl flex flex-col items-center justify-center border ${isMelancia ? 'border-rose-400/40' : 'border-emerald-400/40'}`}>
            <div className="w-8 bg-black/80 py-1 px-0.5 rounded text-center border border-zinc-700">
              <span className="text-[8px] font-black tracking-wider text-white block leading-none">BALY</span>
              <span className={`text-[5px] font-bold ${isMelancia ? 'text-rose-400' : 'text-emerald-400'} block leading-none mt-0.5`}>ENERGY</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Gelos Saborizados (Pacotes coloridos 1kg)
  if (nomeLower.includes('gelo')) {
    const isMelancia = nomeLower.includes('melancia');
    const isMaracuja = nomeLower.includes('maracujá') || nomeLower.includes('maracuja');
    const isCoco = nomeLower.includes('coco');

    const grad = isMelancia
      ? 'from-rose-600 to-rose-900 border-rose-400'
      : isMaracuja
      ? 'from-amber-500 to-amber-800 border-amber-300'
      : 'from-emerald-500 to-teal-800 border-emerald-300';

    return (
      <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
        <div className="relative w-16 h-28 sm:w-20 sm:h-32 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <div className={`w-14 sm:w-16 h-24 bg-gradient-to-b ${grad} rounded-xl border p-2 flex flex-col items-center justify-between shadow-2xl relative overflow-hidden`}>
            {/* Brilho plástico */}
            <div className="absolute top-0 right-1 w-2 h-full bg-white/20 -skew-x-12" />
            <span className="text-[7px] font-black uppercase text-white bg-black/40 px-1 py-0.5 rounded">GELO SABOR</span>
            <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white text-xs font-black">
              {isCoco ? '🥥' : isMelancia ? '🍉' : '🥭'}
            </div>
            <span className="text-[8px] font-black text-white text-center leading-none">
              {isCoco ? 'COCO' : isMelancia ? 'MELANCIA' : 'MARACUJÁ'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Coca-Cola 2L
  if (nomeLower.includes('coca')) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
        <div className="relative w-16 h-28 sm:w-20 sm:h-32 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <div className="w-4 h-3 bg-red-600 rounded-t-sm shadow" />
          <div className="w-3.5 h-5 bg-neutral-900" />
          <div className="relative w-11 sm:w-13 h-22 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black rounded-t-2xl rounded-b-md shadow-2xl flex flex-col items-center justify-center border border-zinc-800">
            <div className="w-full bg-red-600 py-1.5 px-0.5 text-center shadow-md">
              <span className="text-[8px] font-black tracking-tighter text-white block italic font-serif">Coca-Cola</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Cervejas em Lata (Brahma, Skol, Original, Spaten, Heineken, Amstel)
  if (
    nomeLower.includes('brahma') ||
    nomeLower.includes('skol') ||
    nomeLower.includes('original') ||
    nomeLower.includes('spaten') ||
    nomeLower.includes('amstel') ||
    nomeLower.includes('heineken') ||
    nomeLower.includes('cerveja')
  ) {
    let canColor = 'from-red-600 via-red-700 to-red-900 border-red-500';
    let brandText = 'BRAHMA';
    let textColor = 'text-white';

    if (nomeLower.includes('skol')) {
      canColor = 'from-amber-400 via-yellow-500 to-yellow-600 border-yellow-300';
      brandText = 'SKOL';
      textColor = 'text-red-700';
    } else if (nomeLower.includes('original')) {
      canColor = 'from-stone-100 via-stone-200 to-stone-300 border-amber-600';
      brandText = 'ORIGINAL';
      textColor = 'text-blue-900';
    } else if (nomeLower.includes('spaten')) {
      canColor = 'from-emerald-700 via-emerald-800 to-emerald-950 border-emerald-500';
      brandText = 'SPATEN';
      textColor = 'text-white';
    } else if (nomeLower.includes('amstel')) {
      canColor = 'from-red-600 via-white to-red-700 border-red-500';
      brandText = 'AMSTEL';
      textColor = 'text-red-900';
    } else if (nomeLower.includes('heineken')) {
      canColor = 'from-emerald-600 via-emerald-700 to-emerald-900 border-emerald-400';
      brandText = 'HEINEKEN';
      textColor = 'text-white';
    }

    return (
      <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
        <div className="relative w-16 h-28 sm:w-20 sm:h-32 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-110">
          {/* Topo da lata metálico */}
          <div className="w-10 sm:w-12 h-2.5 bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-400 rounded-t-md border-b border-zinc-600 shadow-sm" />
          {/* Corpo cilíndrico da lata */}
          <div className={`relative w-11 sm:w-13 h-20 sm:h-22 bg-gradient-to-r ${canColor} rounded-b-md shadow-2xl flex flex-col items-center justify-center border-x p-1 overflow-hidden`}>
            {/* Brilho metálico vertical */}
            <div className="absolute top-0 left-1.5 w-1.5 h-full bg-white/30 blur-[0.5px]" />
            <div className="absolute top-0 right-2 w-1 h-full bg-black/30" />
            <span className={`text-[9px] font-black tracking-wider ${textColor} block text-center leading-none drop-shadow`}>
              {brandText}
            </span>
            <span className="text-[6px] uppercase font-bold text-zinc-300 mt-1">Lager</span>
          </div>
          {/* Base com cubinhos de gelo */}
          <div className="absolute -bottom-1 flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-white/50 border border-white/70 rotate-6 backdrop-blur-sm" />
            <span className="w-3 h-3 rounded-sm bg-cyan-200/50 border border-white/70 -rotate-12 backdrop-blur-sm" />
          </div>
        </div>
      </div>
    );
  }

  // 6. Old Parr / Beefeater / Eternity Gin
  if (nomeLower.includes('old parr')) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
        <div className="relative w-16 h-28 sm:w-20 sm:h-32 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <div className="w-5 h-3 bg-amber-600 rounded-t-sm" />
          <div className="w-4 h-4 bg-amber-950" />
          <div className="relative w-13 sm:w-15 h-20 bg-gradient-to-b from-amber-900 via-amber-950 to-stone-950 rounded-lg shadow-2xl flex flex-col items-center justify-center border border-amber-600/40 p-1">
            <div className="w-10 bg-amber-200/90 py-1 rounded text-center border border-amber-500">
              <span className="text-[8px] font-black text-amber-950 block leading-none font-serif">Old Parr</span>
              <span className="text-[5px] font-bold text-amber-900 block leading-none">12 ANOS</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (nomeLower.includes('beefeater')) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
        <div className="relative w-16 h-28 sm:w-20 sm:h-32 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <div className="w-4 h-2.5 bg-red-600 rounded-t-sm" />
          <div className="w-3.5 h-4 bg-rose-200" />
          <div className="relative w-11 sm:w-13 h-22 bg-gradient-to-b from-rose-200 via-rose-300 to-pink-400 rounded-t-sm rounded-b-md shadow-2xl flex flex-col items-center justify-center border border-rose-300 p-1">
            <div className="w-9 bg-white/95 py-1 rounded text-center border border-rose-400">
              <span className="text-[7px] font-black text-red-700 block leading-none">BEEFEATER</span>
              <span className="text-[5px] font-bold text-rose-500 block leading-none mt-0.5">PINK GIN</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (nomeLower.includes('eternity')) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
        <div className="relative w-16 h-28 sm:w-20 sm:h-32 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <div className="w-4 h-2.5 bg-purple-400 rounded-t-sm" />
          <div className="w-3.5 h-4 bg-purple-200" />
          <div className="relative w-11 sm:w-13 h-22 bg-gradient-to-b from-purple-200 via-fuchsia-300 to-purple-500 rounded-t-sm rounded-b-md shadow-2xl flex flex-col items-center justify-center border border-purple-300 p-1">
            <div className="w-9 bg-white/95 py-1 rounded text-center border border-purple-400">
              <span className="text-[7px] font-black text-purple-900 block leading-none">ETERNITY</span>
              <span className="text-[5px] font-bold text-fuchsia-600 block leading-none mt-0.5">GIN</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 7. Suco Caixinha
  if (nomeLower.includes('suco')) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
        <div className="relative w-16 h-28 sm:w-20 sm:h-32 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <div className="w-12 h-20 bg-gradient-to-b from-emerald-800 via-black to-amber-600 rounded-md border border-amber-400/50 flex flex-col items-center justify-between p-1.5 shadow-xl">
            <span className="text-[7px] font-black text-white bg-black/60 px-1 rounded">DEL VALLE</span>
            <span className="text-sm">🍊</span>
            <span className="text-[6px] font-black text-amber-200 uppercase">Suco 200ml</span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback Genérico Elegante
  return (
    <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
      <div className="relative w-16 h-28 sm:w-20 sm:h-32 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-110">
        <div className="w-4 h-2 bg-amber-500 rounded-t-sm" />
        <div className="w-3 h-4 bg-amber-800" />
        <div className="relative w-11 h-20 bg-gradient-to-b from-amber-600 via-amber-800 to-stone-950 rounded-t-xl rounded-b-md shadow-2xl flex flex-col items-center justify-center border border-amber-500/30">
          <span className="text-[7px] font-black text-amber-200 uppercase text-center px-1">
            {produto.nome.split(' ')[0]}
          </span>
        </div>
      </div>
    </div>
  );
}
