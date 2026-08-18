'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { KanbanBoard } from '@/components/admin/kanban/KanbanBoard';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useAudioAlert } from '@/hooks/useAudioAlert';
import { supabase } from '@/services/supabaseClient';

export default function AdminDashboardPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { playNewOrderSound } = useAudioAlert();

  const fetchPedidos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          itens:itens_pedido(
            quantidade,
            preco_unitario,
            subtotal,
            produto:produtos(nome)
          )
        `)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((p) => ({
        ...p,
        itens: (p.itens || []).map((item: any) => ({
          quantidade: item.quantidade,
          subtotal: item.subtotal,
          produto_nome: item.produto?.nome || 'Produto',
        })),
      }));

      setPedidos(formatted);
    } catch (err) {
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
    async (newOrder: any) => {
      // 1. Tocar o alerta sonoro imediatamente para pedidos novos
      if (newOrder.status === 'pendente_aprovacao' || newOrder.status === 'aguardando_pagamento') {
        playNewOrderSound();
      }

      // 2. Adicionar o pedido à lista imediatamente
      setPedidos((prev) => {
        if (prev.some((p) => p.id === newOrder.id)) return prev;
        return [{ ...newOrder, itens: [] }, ...prev];
      });

      // 3. Buscar os itens do pedido recém-criado no Supabase para exibir os nomes dos produtos
      try {
        const { data: itensData } = await supabase
          .from('itens_pedido')
          .select('quantidade, subtotal, produto:produtos(nome)')
          .eq('pedido_id', newOrder.id);

        if (itensData && itensData.length > 0) {
          const formattedItens = itensData.map((item: any) => ({
            quantidade: item.quantidade,
            subtotal: item.subtotal,
            produto_nome: item.produto?.nome || 'Produto',
          }));

          setPedidos((prev) =>
            prev.map((p) => (p.id === newOrder.id ? { ...p, itens: formattedItens } : p))
          );
        }
      } catch (err) {
        console.error('Erro ao carregar itens do novo pedido:', err);
      }
    },
    [playNewOrderSound]
  );

  const handleUpdateOrder = useCallback((updatedOrder: any) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === updatedOrder.id ? { ...p, ...updatedOrder } : p))
    );
  }, []);

  useRealtimeOrders(handleNewOrder, handleUpdateOrder);

  // Ações rápidas no Kanban
  const handleAprovarPedido = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'em_preparo', atualizado_em: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'em_preparo' } : p))
      );
    } catch (err: any) {
      alert(`Erro ao aprovar pedido: ${err.message}`);
    }
  };

  const handleRecusarPedido = async (id: string) => {
    const motivo = prompt('Por favor, informe o motivo do cancelamento:');
    if (!motivo) return;

    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'cancelado', atualizado_em: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'cancelado' } : p))
      );
    } catch (err: any) {
      alert(`Erro ao recusar pedido: ${err.message}`);
    }
  };

  const handleAtribuirMotoboy = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'em_rota', atualizado_em: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'em_rota' } : p))
      );
    } catch (err: any) {
      alert(`Erro ao despachar pedido: ${err.message}`);
    }
  };

  const handleValidarCodigo = async (id: string, codigo: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'entregue', atualizado_em: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'entregue' } : p))
      );
    } catch (err: any) {
      alert(`Erro ao finalizar entrega: ${err.message}`);
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
