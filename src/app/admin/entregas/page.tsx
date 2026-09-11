'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Bike,
  DollarSign,
  Loader2,
  RefreshCw,
  Plus,
  MapPin,
  Users,
  Phone,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
} from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { CodeValidationInput } from '@/components/admin/entregas/CodeValidationInput';
import { DeliveryZoneModal, DeliveryZone } from '@/components/admin/entregas/DeliveryZoneModal';
import { MotoboyModal } from '@/components/admin/entregas/MotoboyModal';
import { Motoboy } from '@/types/motoboy';
import { Pedido } from '@/types/storefront';
import { formatPedido } from '@/lib/orderUtils';

export default function AdminEntregasPage() {
  const [activeTab, setActiveTab] = useState<'expedicao' | 'zonas' | 'motoboys'>('expedicao');

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [zonas, setZonas] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [zoneToEdit, setZoneToEdit] = useState<DeliveryZone | null>(null);

  const [motoboyModalOpen, setMotoboyModalOpen] = useState(false);
  const [motoboyToEdit, setMotoboyToEdit] = useState<Motoboy | null>(null);

  // Search filters
  const [searchZona, setSearchZona] = useState('');
  const [searchMotoboy, setSearchMotoboy] = useState('');

  // Notification / feedback
  const [toastMessage, setToastMessage] = useState<{
    tipo: 'success' | 'error';
    texto: string;
  } | null>(null);

  const showToast = (texto: string, tipo: 'success' | 'error' = 'success') => {
    setToastMessage({ tipo, texto });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Busca todos os motoboys (ativos e inativos para o painel de gestão)
      const { data: motoboysData, error: mErr } = await supabase
        .from('motoboys')
        .select('*')
        .order('criado_em', { ascending: false });

      if (motoboysData) setMotoboys(motoboysData);
      if (mErr) console.warn('Erro ao carregar motoboys:', mErr);

      // 2. Busca todas as zonas de entrega
      const { data: zonasData, error: zErr } = await supabase
        .from('zonas_frete')
        .select('*')
        .order('bairro', { ascending: true });

      if (zonasData) setZonas(zonasData as DeliveryZone[]);
      if (zErr) console.warn('Erro ao carregar zonas:', zErr);

      // 3. Busca pedidos em preparo ou em rota
      const { data: pedidosData, error: pErr } = await supabase
        .from('pedidos')
        .select(`
          *,
          cliente:clientes(*),
          motoboy:motoboys(nome, telefone)
        `)
        .in('status', ['em_preparo', 'em_rota'])
        .order('criado_em', { ascending: false });

      if (pErr) throw pErr;
      setPedidos(((pedidosData as Record<string, unknown>[]) || []).map(formatPedido));
    } catch (err: unknown) {
      console.error('Erro ao carregar dados de entregas:', err);
      showToast('Erro ao carregar dados da aba de entregas.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Atribuição de motoboy ao pedido
  const handleAtribuirMotoboy = async (pedidoId: string, motoboyId: string) => {
    if (!motoboyId) return;

    try {
      const { error } = await supabase
        .from('pedidos')
        .update({
          status: 'em_rota',
          motoboy_id: motoboyId,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', pedidoId);

      if (error) throw error;
      showToast('Motoboy atribuído e pedido despachado em rota!');
      fetchData();
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Erro ao atribuir motoboy';
      showToast(`Erro ao atribuir motoboy: ${errMessage}`, 'error');
    }
  };

  // Concluir entrega
  const handleFinalizarEntrega = async (pedidoId: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({
          status: 'entregue',
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', pedidoId);

      if (error) throw error;
      showToast('Entrega confirmada com sucesso!');
      fetchData();
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Erro ao finalizar entrega';
      showToast(`Erro ao finalizar entrega: ${errMessage}`, 'error');
    }
  };

  // Toggle de status de zona de frete
  const handleToggleZonaAtiva = async (zona: DeliveryZone) => {
    try {
      const novoStatus = !zona.ativo;
      const res = await fetch('/api/admin/entregas/zonas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: zona.id, ativo: novoStatus }),
      });
      const resJson = await res.json();
      if (!res.ok || resJson.error) throw new Error(resJson.error);

      setZonas((prev) =>
        prev.map((z) => (z.id === zona.id ? { ...z, ativo: novoStatus } : z))
      );
      showToast(`Área ${zona.bairro} ${novoStatus ? 'ativada' : 'desativada'}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar status';
      showToast(msg, 'error');
    }
  };

  // Excluir zona de frete
  const handleDeleteZona = async (id: string, bairro: string) => {
    if (!confirm(`Tem certeza que deseja excluir a área de entrega "${bairro}"?`)) return;

    try {
      const res = await fetch(`/api/admin/entregas/zonas?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const resJson = await res.json();
      if (!res.ok || resJson.error) throw new Error(resJson.error);

      setZonas((prev) => prev.filter((z) => z.id !== id));
      showToast(`Área "${bairro}" excluída com sucesso.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir';
      showToast(msg, 'error');
    }
  };

  // Toggle de status de motoboy
  const handleToggleMotoboyAtivo = async (motoboy: Motoboy) => {
    try {
      const novoStatus = !motoboy.ativo;
      const res = await fetch('/api/admin/entregas/motoboys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: motoboy.id, ativo: novoStatus }),
      });
      const resJson = await res.json();
      if (!res.ok || resJson.error) throw new Error(resJson.error);

      setMotoboys((prev) =>
        prev.map((m) => (m.id === motoboy.id ? { ...m, ativo: novoStatus } : m))
      );
      showToast(`Entregador ${motoboy.nome} ${novoStatus ? 'ativado' : 'desativado'}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar status';
      showToast(msg, 'error');
    }
  };

  // Excluir motoboy
  const handleDeleteMotoboy = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o motoboy "${nome}"?`)) return;

    try {
      const res = await fetch(`/api/admin/entregas/motoboys?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const resJson = await res.json();
      if (!res.ok || resJson.error) throw new Error(resJson.error);

      setMotoboys((prev) => prev.filter((m) => m.id !== id));
      showToast(`Motoboy "${nome}" excluído com sucesso.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir motoboy';
      showToast(msg, 'error');
    }
  };

  // Filtragem de Zonas
  const filteredZonas = useMemo(() => {
    if (!searchZona.trim()) return zonas;
    const term = searchZona.toLowerCase();
    return zonas.filter(
      (z) =>
        z.bairro.toLowerCase().includes(term) ||
        (z.cep_inicio && z.cep_inicio.includes(term)) ||
        (z.cep_fim && z.cep_fim.includes(term))
    );
  }, [zonas, searchZona]);

  // Filtragem de Motoboys
  const filteredMotoboys = useMemo(() => {
    if (!searchMotoboy.trim()) return motoboys;
    const term = searchMotoboy.toLowerCase();
    return motoboys.filter(
      (m) =>
        m.nome.toLowerCase().includes(term) ||
        m.telefone.includes(term)
    );
  }, [motoboys, searchMotoboy]);

  // Apenas motoboys ativos para a lista de atribuição de pedidos
  const motoboysAtivos = useMemo(() => {
    return motoboys.filter((m) => m.ativo);
  }, [motoboys]);

  if (loading && pedidos.length === 0 && zonas.length === 0 && motoboys.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#F59E0B] animate-spin" />
        <p className="text-xs text-zinc-400 font-medium">Carregando módulo de entregas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast flutuante */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold border animate-bounce ${
            toastMessage.tipo === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30'
              : 'bg-red-950/90 text-red-300 border-red-500/30'
          }`}
        >
          {toastMessage.tipo === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          {toastMessage.texto}
        </div>
      )}

      {/* Header Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#262626] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Bike className="w-7 h-7 text-[#F59E0B]" />
            Módulo de Entregas & Logística
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Gestão completa de expedição em tempo real, áreas e taxas de entrega, e equipe de motoboys.
          </p>
        </div>

        {/* Ações de Topo */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchData}
            title="Atualizar dados"
            className="p-2.5 bg-[#161616] hover:bg-[#222222] border border-[#262626] rounded-xl text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setZoneToEdit(null);
              setZoneModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-[#F59E0B] hover:bg-[#d97706] text-[#0D0D0D] font-bold text-xs rounded-xl shadow-lg shadow-[#F59E0B]/10 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Área de Entrega
          </button>

          <button
            type="button"
            onClick={() => {
              setMotoboyToEdit(null);
              setMotoboyModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Novo Motoboy
          </button>

          <Link
            href="/admin/entregas/caixa"
            className="px-3.5 py-2.5 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#22C55E]/10 flex items-center gap-2 transition"
          >
            <DollarSign className="w-4 h-4" />
            Fechamento de Caixa
          </Link>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 border-b border-[#262626] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('expedicao')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'expedicao'
              ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30'
              : 'text-zinc-400 hover:text-white hover:bg-[#161616]'
          }`}
        >
          <Bike className="w-4 h-4" />
          Expedição & Rotas
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'expedicao'
                ? 'bg-[#F59E0B] text-[#0D0D0D]'
                : 'bg-[#262626] text-zinc-300'
            }`}
          >
            {pedidos.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('zonas')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'zonas'
              ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30'
              : 'text-zinc-400 hover:text-white hover:bg-[#161616]'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Áreas de Entrega (Frete)
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'zonas'
                ? 'bg-[#F59E0B] text-[#0D0D0D]'
                : 'bg-[#262626] text-zinc-300'
            }`}
          >
            {zonas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('motoboys')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'motoboys'
              ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30'
              : 'text-zinc-400 hover:text-white hover:bg-[#161616]'
          }`}
        >
          <Users className="w-4 h-4" />
          Gestão de Motoboys
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'motoboys'
                ? 'bg-[#F59E0B] text-[#0D0D0D]'
                : 'bg-[#262626] text-zinc-300'
            }`}
          >
            {motoboys.length}
          </span>
        </button>
      </div>

      {/* ABA 1: EXPEDIÇÃO DE PEDIDOS */}
      {activeTab === 'expedicao' && (
        <div className="space-y-4">
          {pedidos.length === 0 ? (
            <div className="p-16 text-center bg-[#161616] border border-[#262626] rounded-2xl text-zinc-400 text-sm space-y-3">
              <Bike className="w-12 h-12 mx-auto text-zinc-600" />
              <p className="font-semibold text-white">Nenhum pedido aguardando despacho no momento</p>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Quando um cliente fizer um pedido e o status for alterado para &quot;Em Preparo&quot;, ele aparecerá aqui para atribuição de rota ao motoboy.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pedidos.map((pedido) => (
                <div
                  key={pedido.id}
                  className="bg-[#161616] border border-[#262626] rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between"
                >
                  {/* Top info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                      <span className="text-sm font-mono font-bold text-white">
                        #{pedido.id.slice(0, 6)}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          pedido.status === 'em_rota'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {pedido.status === 'em_rota' ? '🛵 Em Rota' : '📦 Em Preparo'}
                      </span>
                    </div>

                    {/* Customer details */}
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-white text-sm">{pedido.cliente_nome}</p>
                      <p className="text-zinc-300">
                        {pedido.endereco_rua}, Nº {pedido.endereco_numero} -{' '}
                        <strong className="text-white">{pedido.endereco_bairro}</strong>
                      </p>
                      <p className="text-zinc-400">WhatsApp: {pedido.cliente_whatsapp}</p>
                      <p className="text-[#F59E0B] font-semibold pt-1">
                        Pagamento: {pedido.forma_pagamento.toUpperCase()} | Total: R${' '}
                        {Number(pedido.valor_total).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>

                  {/* Actions / Assignment */}
                  <div className="space-y-3 pt-3 border-t border-[#262626]">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-zinc-400">
                        Entregador Responsável:
                      </label>
                      <select
                        value={pedido.motoboy_id || ''}
                        onChange={(e) => handleAtribuirMotoboy(pedido.id, e.target.value)}
                        className="w-full bg-[#0D0D0D] border border-[#262626] focus:border-[#F59E0B] text-white px-3 py-2 rounded-xl text-xs outline-none transition"
                      >
                        <option value="">-- Selecione o Motoboy para Despacho --</option>
                        {motoboysAtivos.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nome} ({m.telefone})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Botão de Acesso Direto à Rota do Motoboy */}
                    <Link
                      href={`/motoboy/entrega/${pedido.id}`}
                      target="_blank"
                      className="w-full py-2.5 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-[#8B5CF6] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                      <Bike className="w-4 h-4" />
                      Abrir Rota do Entregador (GPS)
                    </Link>

                    {/* OTP Validation Input if Order is in Route */}
                    {pedido.status === 'em_rota' && (
                      <CodeValidationInput
                        pedidoId={pedido.id}
                        codigoEsperado={pedido.codigo_entrega}
                        onSuccess={() => handleFinalizarEntrega(pedido.id)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: ÁREAS DE ENTREGA (ZONAS DE FRETE) */}
      {activeTab === 'zonas' && (
        <div className="space-y-4">
          {/* Barra de Busca e Métricas */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#161616] border border-[#262626] p-4 rounded-2xl">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar bairro ou faixa de CEP..."
                value={searchZona}
                onChange={(e) => setSearchZona(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#262626] focus:border-[#F59E0B] text-white pl-10 pr-4 py-2 rounded-xl text-xs outline-none transition"
              />
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <div>
                Total Cadastrado:{' '}
                <strong className="text-white font-mono">{zonas.length}</strong>
              </div>
              <div className="h-4 w-px bg-[#262626]" />
              <div>
                Ativas:{' '}
                <strong className="text-emerald-400 font-mono">
                  {zonas.filter((z) => z.ativo).length}
                </strong>
              </div>
            </div>
          </div>

          {/* Grid de Áreas de Entrega */}
          {filteredZonas.length === 0 ? (
            <div className="p-16 text-center bg-[#161616] border border-[#262626] rounded-2xl text-zinc-400 text-sm space-y-3">
              <MapPin className="w-12 h-12 mx-auto text-zinc-600" />
              <p className="font-semibold text-white">Nenhuma área de entrega encontrada</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Clique no botão abaixo para adicionar bairros atendidos e suas taxas de frete.
              </p>
              <button
                type="button"
                onClick={() => {
                  setZoneToEdit(null);
                  setZoneModalOpen(true);
                }}
                className="px-4 py-2 bg-[#F59E0B] text-[#0D0D0D] font-bold text-xs rounded-xl transition"
              >
                + Adicionar Área de Entrega
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredZonas.map((zona) => (
                <div
                  key={zona.id}
                  className={`bg-[#161616] border rounded-2xl p-5 shadow-xl flex flex-col justify-between transition ${
                    zona.ativo
                      ? 'border-[#262626] hover:border-[#F59E0B]/40'
                      : 'border-[#262626] opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            zona.ativo
                              ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white leading-tight">
                            {zona.bairro}
                          </h3>
                          <span
                            className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              zona.ativo
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {zona.ativo ? 'Ativo' : 'Desativado'}
                          </span>
                        </div>
                      </div>

                      {/* Taxa de Frete em Destaque */}
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                          Taxa de Frete
                        </span>
                        <span className="text-base font-black text-[#F59E0B] font-mono">
                          {Number(zona.valor_frete) === 0
                            ? 'Grátis'
                            : `R$ ${Number(zona.valor_frete).toFixed(2).replace('.', ',')}`}
                        </span>
                      </div>
                    </div>

                    {/* Faixa de CEP */}
                    <div className="bg-[#0D0D0D] border border-[#262626] rounded-xl p-3 text-xs space-y-1">
                      <span className="text-[11px] text-zinc-400 block font-semibold">
                        Faixa de CEP Atendida:
                      </span>
                      {zona.cep_inicio || zona.cep_fim ? (
                        <p className="text-white font-mono text-xs">
                          {zona.cep_inicio || 'Início Livre'} → {zona.cep_fim || 'Fim Livre'}
                        </p>
                      ) : (
                        <p className="text-zinc-500 text-xs italic">
                          Atende por correspondência do nome do bairro
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ações da Zona */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#262626]">
                    <button
                      type="button"
                      onClick={() => handleToggleZonaAtiva(zona)}
                      className={`text-xs font-bold transition ${
                        zona.ativo ? 'text-zinc-400 hover:text-white' : 'text-emerald-400'
                      }`}
                    >
                      {zona.ativo ? 'Desativar' : 'Ativar Área'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setZoneToEdit(zona);
                          setZoneModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-zinc-300 hover:text-white transition"
                        title="Editar área"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => zona.id && handleDeleteZona(zona.id, zona.bairro)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                        title="Excluir área"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: GESTÃO DE MOTOBOYS */}
      {activeTab === 'motoboys' && (
        <div className="space-y-4">
          {/* Barra de Busca e Contadores */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#161616] border border-[#262626] p-4 rounded-2xl">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar entregador por nome ou telefone..."
                value={searchMotoboy}
                onChange={(e) => setSearchMotoboy(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#262626] focus:border-purple-500 text-white pl-10 pr-4 py-2 rounded-xl text-xs outline-none transition"
              />
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <div>
                Total de Motoboys:{' '}
                <strong className="text-white font-mono">{motoboys.length}</strong>
              </div>
              <div className="h-4 w-px bg-[#262626]" />
              <div>
                Ativos para entrega:{' '}
                <strong className="text-purple-400 font-mono">{motoboysAtivos.length}</strong>
              </div>
            </div>
          </div>

          {/* Grid de Motoboys */}
          {filteredMotoboys.length === 0 ? (
            <div className="p-16 text-center bg-[#161616] border border-[#262626] rounded-2xl text-zinc-400 text-sm space-y-3">
              <Users className="w-12 h-12 mx-auto text-zinc-600" />
              <p className="font-semibold text-white">Nenhum motoboy encontrado</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Cadastre seus entregadores para despachar pedidos e acompanhar trajetos em tempo real.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMotoboyToEdit(null);
                  setMotoboyModalOpen(true);
                }}
                className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl transition"
              >
                + Cadastrar Motoboy
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMotoboys.map((motoboy) => {
                const cleanPhone = motoboy.telefone.replace(/\D/g, '');
                const pedidosDoMotoboy = pedidos.filter((p) => p.motoboy_id === motoboy.id);

                return (
                  <div
                    key={motoboy.id}
                    className={`bg-[#161616] border rounded-2xl p-5 shadow-xl flex flex-col justify-between transition ${
                      motoboy.ativo
                        ? 'border-[#262626] hover:border-purple-500/40'
                        : 'border-[#262626] opacity-60'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                              motoboy.ativo
                                ? 'bg-purple-600/15 text-purple-400 border border-purple-500/30'
                                : 'bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            <Bike className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-white">{motoboy.nome}</h3>
                            <span
                              className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                motoboy.ativo
                                  ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {motoboy.ativo ? 'Disponível' : 'Inativo'}
                            </span>
                          </div>
                        </div>

                        {pedidosDoMotoboy.length > 0 && (
                          <span className="px-2.5 py-1 bg-amber-500/10 text-[#F59E0B] border border-amber-500/30 rounded-lg text-[10px] font-bold">
                            {pedidosDoMotoboy.length} em rota
                          </span>
                        )}
                      </div>

                      {/* Telefone e WhatsApp */}
                      <div className="bg-[#0D0D0D] border border-[#262626] rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-zinc-300 font-mono">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          {motoboy.telefone}
                        </div>
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/55${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition"
                          >
                            WhatsApp
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Ações do Motoboy */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#262626]">
                      <button
                        type="button"
                        onClick={() => handleToggleMotoboyAtivo(motoboy)}
                        className={`text-xs font-bold transition ${
                          motoboy.ativo ? 'text-zinc-400 hover:text-white' : 'text-purple-400'
                        }`}
                      >
                        {motoboy.ativo ? 'Desativar' : 'Ativar Entregador'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMotoboyToEdit(motoboy);
                            setMotoboyModalOpen(true);
                          }}
                          className="p-2 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-zinc-300 hover:text-white transition"
                          title="Editar entregador"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMotoboy(motoboy.id, motoboy.nome)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                          title="Excluir entregador"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modais */}
      <DeliveryZoneModal
        isOpen={zoneModalOpen}
        onClose={() => {
          setZoneModalOpen(false);
          setZoneToEdit(null);
        }}
        zoneToEdit={zoneToEdit}
        onSuccess={(zone, isEdit) => {
          if (isEdit) {
            setZonas((prev) => prev.map((z) => (z.id === zone.id ? zone : z)));
            showToast('Área de entrega atualizada com sucesso!');
          } else {
            setZonas((prev) => [zone, ...prev]);
            showToast('Nova área de entrega adicionada com sucesso!');
          }
        }}
      />

      <MotoboyModal
        isOpen={motoboyModalOpen}
        onClose={() => {
          setMotoboyModalOpen(false);
          setMotoboyToEdit(null);
        }}
        motoboyToEdit={motoboyToEdit}
        onSuccess={(motoboy, isEdit) => {
          if (isEdit) {
            setMotoboys((prev) => prev.map((m) => (m.id === motoboy.id ? motoboy : m)));
            showToast('Dados do entregador atualizados com sucesso!');
          } else {
            setMotoboys((prev) => [motoboy, ...prev]);
            showToast('Novo motoboy cadastrado com sucesso!');
          }
        }}
      />
    </div>
  );
}
