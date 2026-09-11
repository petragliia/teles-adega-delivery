'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, DollarSign, Loader2, CheckCircle2 } from 'lucide-react';

export interface DeliveryZone {
  id?: string;
  bairro: string;
  cep_inicio?: string | null;
  cep_fim?: string | null;
  valor_frete: number;
  ativo: boolean;
  criado_em?: string;
}

interface DeliveryZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneToEdit: DeliveryZone | null;
  onSuccess: (zone: DeliveryZone, isEdit: boolean) => void;
}

export function DeliveryZoneModal({
  isOpen,
  onClose,
  zoneToEdit,
  onSuccess,
}: DeliveryZoneModalProps) {
  const isEdit = Boolean(zoneToEdit);

  const [bairro, setBairro] = useState('');
  const [cepInicio, setCepInicio] = useState('');
  const [cepFim, setCepFim] = useState('');
  const [valorFrete, setValorFrete] = useState<string | number>('');
  const [ativo, setAtivo] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (zoneToEdit) {
        setBairro(zoneToEdit.bairro || '');
        setCepInicio(zoneToEdit.cep_inicio || '');
        setCepFim(zoneToEdit.cep_fim || '');
        setValorFrete(zoneToEdit.valor_frete ?? '');
        setAtivo(zoneToEdit.ativo ?? true);
      } else {
        setBairro('');
        setCepInicio('');
        setCepFim('');
        setValorFrete('');
        setAtivo(true);
      }
      setErrorMsg(null);
    }
  }, [isOpen, zoneToEdit]);

  if (!isOpen) return null;

  const formatCep = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 8);
    if (cleaned.length > 5) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!bairro.trim()) {
      setErrorMsg('Informe o nome do bairro ou área de entrega.');
      return;
    }

    const valorNum = Number(String(valorFrete).replace(',', '.'));
    if (isNaN(valorNum) || valorNum < 0) {
      setErrorMsg('Informe um valor de frete válido (>= 0).');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...(isEdit && zoneToEdit?.id ? { id: zoneToEdit.id } : {}),
        bairro: bairro.trim(),
        cep_inicio: cepInicio ? cepInicio.trim() : null,
        cep_fim: cepFim ? cepFim.trim() : null,
        valor_frete: valorNum,
        ativo,
      };

      const res = await fetch('/api/admin/entregas/zonas', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok || resJson.error) {
        throw new Error(resJson.error || 'Erro ao salvar área de entrega.');
      }

      onSuccess(resJson.data, isEdit);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar solicitação.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161616] border border-[#262626] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEdit ? 'Editar Área de Entrega' : 'Nova Área de Entrega'}
              </h2>
              <p className="text-xs text-zinc-400">
                Defina o bairro/região, faixa de CEP e a taxa de frete cobrada
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-zinc-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Bairro ou Região de Entrega <span className="text-[#F59E0B]">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Santos - Gonzaga ou Cubatão - Jardim Casqueiro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#262626] focus:border-[#F59E0B] text-white px-4 py-2.5 rounded-xl text-sm outline-none transition"
              required
            />
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Usado para match com o endereço retornado pelo CEP do cliente.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                CEP Inicial (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: 11050-000"
                value={cepInicio}
                onChange={(e) => setCepInicio(formatCep(e.target.value))}
                className="w-full bg-[#0D0D0D] border border-[#262626] focus:border-[#F59E0B] text-white px-4 py-2.5 rounded-xl text-sm outline-none transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                CEP Final (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: 11065-900"
                value={cepFim}
                onChange={(e) => setCepFim(formatCep(e.target.value))}
                className="w-full bg-[#0D0D0D] border border-[#262626] focus:border-[#F59E0B] text-white px-4 py-2.5 rounded-xl text-sm outline-none transition font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Taxa de Frete (R$) <span className="text-[#F59E0B]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">
                R$
              </span>
              <input
                type="number"
                step="0.50"
                min="0"
                placeholder="0,00"
                value={valorFrete}
                onChange={(e) => setValorFrete(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#262626] focus:border-[#F59E0B] text-white pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition font-bold"
                required
              />
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Deixe 0 para frete grátis nesta área.
            </span>
          </div>

          {/* Toggle Ativo */}
          <div className="flex items-center justify-between pt-2 border-t border-[#262626]">
            <div>
              <span className="text-xs font-semibold text-white block">Área Ativa</span>
              <span className="text-[11px] text-zinc-400">
                Se desativada, não será oferecida automaticamente no checkout.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAtivo(!ativo)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                ativo ? 'bg-[#F59E0B]' : 'bg-[#262626]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  ativo ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262626]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#222222] hover:bg-[#2a2a2a] text-zinc-300 font-bold text-xs transition"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#d97706] text-[#0D0D0D] font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#F59E0B]/10 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {isEdit ? 'Salvar Alterações' : 'Criar Área'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
