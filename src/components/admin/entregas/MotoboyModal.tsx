'use client';

import React, { useState, useEffect } from 'react';
import { X, Bike, Phone, Loader2, CheckCircle2 } from 'lucide-react';
import { Motoboy } from '@/types/motoboy';

interface MotoboyModalProps {
  isOpen: boolean;
  onClose: () => void;
  motoboyToEdit: Motoboy | null;
  onSuccess: (motoboy: Motoboy, isEdit: boolean) => void;
}

export function MotoboyModal({
  isOpen,
  onClose,
  motoboyToEdit,
  onSuccess,
}: MotoboyModalProps) {
  const isEdit = Boolean(motoboyToEdit);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [ativo, setAtivo] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (motoboyToEdit) {
        setNome(motoboyToEdit.nome || '');
        setTelefone(motoboyToEdit.telefone || '');
        setAtivo(motoboyToEdit.ativo ?? true);
      } else {
        setNome('');
        setTelefone('');
        setAtivo(true);
      }
      setErrorMsg(null);
    }
  }, [isOpen, motoboyToEdit]);

  if (!isOpen) return null;

  const formatTelefone = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 11);
    if (cleaned.length > 6) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length > 2) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    }
    if (cleaned.length > 0) {
      return `(${cleaned}`;
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nome.trim()) {
      setErrorMsg('Informe o nome do motoboy.');
      return;
    }

    const cleanTel = telefone.replace(/\D/g, '');
    if (cleanTel.length < 10) {
      setErrorMsg('Informe um telefone/WhatsApp válido com DDD.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...(isEdit && motoboyToEdit?.id ? { id: motoboyToEdit.id } : {}),
        nome: nome.trim(),
        telefone: telefone.trim(),
        ativo,
      };

      const res = await fetch('/api/admin/entregas/motoboys', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok || resJson.error) {
        throw new Error(resJson.error || 'Erro ao salvar motoboy.');
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
      <div className="bg-[#161616] border border-[#262626] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEdit ? 'Editar Entregador' : 'Novo Entregador (Motoboy)'}
              </h2>
              <p className="text-xs text-zinc-400">
                Cadastre os dados de contato do entregador da equipe
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
              Nome do Entregador <span className="text-[#F59E0B]">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Carlos Teles 01"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#262626] focus:border-purple-500 text-white px-4 py-2.5 rounded-xl text-sm outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              WhatsApp / Telefone <span className="text-[#F59E0B]">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="(13) 99111-2233"
                value={telefone}
                onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                className="w-full bg-[#0D0D0D] border border-[#262626] focus:border-purple-500 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition font-mono"
                required
              />
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Será usado para envio de rotas e contato no despacho.
            </span>
          </div>

          {/* Toggle Ativo */}
          <div className="flex items-center justify-between pt-2 border-t border-[#262626]">
            <div>
              <span className="text-xs font-semibold text-white block">Entregador Ativo</span>
              <span className="text-[11px] text-zinc-400">
                Aparece na lista de seleção para despacho de pedidos.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAtivo(!ativo)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                ativo ? 'bg-purple-600' : 'bg-[#262626]'
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
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {isEdit ? 'Salvar Alterações' : 'Cadastrar Motoboy'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
