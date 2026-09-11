'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { KanbanBoard } from '@/components/admin/kanban/KanbanBoard';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useAudioAlert } from '@/hooks/useAudioAlert';
import { supabase } from '@/services/supabaseClient';
import { Pedido } from '@/types/storefront';
import { formatPedido } from '@/lib/orderUtils';

export default function AdminDashboardPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const { playNewOrderSound } = useAudioAlert();

  const fetchPedidos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          cliente:clientes(*),
          itens:itens_pedido(
            id,
            pedido_id,
            quantidade,
            preco_unitario,
            subtotal,
            produto:produtos(nome)
          )
        `)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      const formatted: Pedido[] = ((data as Record<string, unknown>[]) || []).map(formatPedido);
      setPedidos(formatted);
    } catch (err: unknown) {
      console.error('Erro ao carregar pedidos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // Handlers para eventos em tempo real
  const handleNewOrder = useCallback(
    async (newOrder: Pedido) => {
      // 1. Tocar o alerta sonoro imediatamente para pedidos novos
      if (newOrder.status === 'pendente_aprovacao' || newOrder.status === 'aguardando_pagamento') {
        playNewOrderSound();
      }

      // 2. Buscar o pedido completo com cliente e itens cadastrados no Supabase
      try {
        const { data: fullOrderData, error: fullOrderErr } = await supabase
          .from('pedidos')
          .select(`
            *,
            cliente:clientes(*),
            itens:itens_pedido(
              id,
              pedido_id,
              quantidade,
              preco_unitario,
              subtotal,
              produto:produtos(nome)
            )
          `)
          .eq('id', newOrder.id)
          .single();

        if (!fullOrderErr && fullOrderData) {
          const formatted = formatPedido(fullOrderData as Record<string, unknown>);
          setPedidos((prev) => {
            if (prev.some((p) => p.id === newOrder.id)) {
              return prev.map((p) => (p.id === newOrder.id ? formatted : p));
            }
            return [formatted, ...prev];
          });
          return;
        }
      } catch (err: unknown) {
        console.error('Erro ao carregar detalhes do novo pedido:', err);
      }

      // Fallback seguro
      const fallbackFormatted = formatPedido(newOrder as unknown as Record<string, unknown>);
      setPedidos((prev) => {
        if (prev.some((p) => p.id === newOrder.id)) return prev;
        return [fallbackFormatted, ...prev];
      });
    },
    [playNewOrderSound]
  );

  const handleUpdateOrder = useCallback((updatedOrder: Pedido) => {
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id === updatedOrder.id) {
          return {
            ...p,
            ...updatedOrder,
            cliente_nome: p.cliente_nome || updatedOrder.cliente_nome,
            cliente_whatsapp: p.cliente_whatsapp || updatedOrder.cliente_whatsapp,
            endereco_rua: p.endereco_rua || updatedOrder.endereco_rua,
            endereco_numero: p.endereco_numero || updatedOrder.endereco_numero,
            endereco_bairro: p.endereco_bairro || updatedOrder.endereco_bairro,
            itens: p.itens && p.itens.length > 0 ? p.itens : updatedOrder.itens,
          };
        }
        return p;
      })
    );
  }, []);

  useRealtimeOrders(handleNewOrder, handleUpdateOrder);

  // Ações rápidas no Kanban
  const handleAprovarPedido = async (id: string) => {
    try {
      const res = await fetch('/api/admin/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'em_preparo' }),
      });
      const resJson = await res.json();
      if (!res.ok || resJson.error) throw new Error(resJson.error || 'Erro ao aprovar');

      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'em_preparo' } : p))
      );
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Erro ao aprovar';
      alert(`Erro ao aprovar pedido: ${errMessage}`);
    }
  };

  const handleRecusarPedido = async (id: string) => {
    const motivo = prompt('Por favor, informe o motivo do cancelamento:');
    if (!motivo) return;

    try {
      const res = await fetch('/api/admin/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'cancelado', observacao: motivo }),
      });
      const resJson = await res.json();
      if (!res.ok || resJson.error) throw new Error(resJson.error || 'Erro ao recusar');

      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'cancelado' } : p))
      );
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Erro ao recusar';
      alert(`Erro ao recusar pedido: ${errMessage}`);
    }
  };

  const handleAtribuirMotoboy = async (id: string) => {
    try {
      const res = await fetch('/api/admin/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'em_rota' }),
      });
      const resJson = await res.json();
      if (!res.ok || resJson.error) throw new Error(resJson.error || 'Erro ao despachar');

      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'em_rota' } : p))
      );
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Erro ao despachar';
      alert(`Erro ao despachar pedido: ${errMessage}`);
    }
  };

  const handleValidarCodigo = async (id: string) => {
    try {
      const res = await fetch('/api/admin/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'entregue' }),
      });
      const resJson = await res.json();
      if (!res.ok || resJson.error) throw new Error(resJson.error || 'Erro ao finalizar');

      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'entregue' } : p))
      );
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Erro ao finalizar';
      alert(`Erro ao finalizar entrega: ${errMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#F59E0B] animate-spin" />
        <p className="text-xs text-zinc-400 font-medium">Carregando esteira de pedidos...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            Esteira Operacional Kanban
          </h1>
          <p className="text-xs text-zinc-400">
            Gerencie os pedidos recebidos em tempo real ({pedidos.length} pedidos no total)
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPedidos}
          className="px-3 py-1.5 bg-[#161616] hover:bg-[#222222] border border-[#262626] rounded-xl text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar
        </button>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          pedidos={pedidos}
          onAprovarPedido={handleAprovarPedido}
          onRecusarPedido={handleRecusarPedido}
          onAtribuirMotoboy={handleAtribuirMotoboy}
          onValidarCodigo={handleValidarCodigo}
        />
      </div>
    </div>
  );
}
