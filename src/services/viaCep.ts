import { supabase } from './supabaseClient';
import { BuscarCepResult, ViaCepResponse } from '@/types/checkout';

export async function buscarCep(cep: string): Promise<BuscarCepResult> {
  const cleanedCep = cep.replace(/\D/g, '');

  if (cleanedCep.length !== 8) {
    return {
      sucesso: false,
      logradouro: '',
      bairro: '',
      cidade: '',
      uf: '',
      taxaEntrega: 0,
      bairroEncontrado: false,
      mensagemErro: 'CEP inválido. Deve conter 8 dígitos.',
    };
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
    
    if (!response.ok) {
      throw new Error('Falha ao conectar com o serviço ViaCEP.');
    }

    const data: ViaCepResponse = await response.json();

    if (data.erro) {
      return {
        sucesso: false,
        logradouro: '',
        bairro: '',
        cidade: '',
        uf: '',
        taxaEntrega: 0,
        bairroEncontrado: false,
        mensagemErro: 'CEP não encontrado. Verifique os números digitados.',
      };
    }

    const logradouro = data.logradouro || '';
    const bairro = data.bairro || '';
    const cidade = data.localidade || '';
    const uf = data.uf || '';

    let taxaEntrega = 0;
    let bairroEncontrado = false;

    if (bairro || cleanedCep) {
      const { data: zonas, error } = await supabase
        .from('zonas_frete')
        .select('*')
        .eq('ativo', true);

      if (!error && zonas && zonas.length > 0) {
        const normalize = (str: string) =>
          str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();

        const cepNum = parseInt(cleanedCep, 10);
        const normBairro = normalize(bairro);
        const normCidade = normalize(cidade);

        // 1. Busca por faixa de CEP
        let matchedZone = zonas.find((z) => {
          if (z.cep_inicio && z.cep_fim) {
            const inicioNum = parseInt(z.cep_inicio.replace(/\D/g, ''), 10);
            const fimNum = parseInt(z.cep_fim.replace(/\D/g, ''), 10);
            return cepNum >= inicioNum && cepNum <= fimNum;
          }
          return false;
        });

        // 2. Busca por nome do bairro se não casou por faixa
        if (!matchedZone && normBairro) {
          matchedZone = zonas.find((z) => {
            const normZona = normalize(z.bairro);
            return normZona.includes(normBairro) || normBairro.includes(normZona);
          });
        }

        // 3. Busca por cidade
        if (!matchedZone && normCidade) {
          matchedZone = zonas.find((z) => {
            const normZona = normalize(z.bairro);
            return normZona.includes(normCidade);
          });
        }

        if (matchedZone) {
          taxaEntrega = Number(matchedZone.valor_frete);
          bairroEncontrado = true;
        }
      }
    }

    return {
      sucesso: true,
      logradouro,
      bairro,
      cidade,
      uf,
      taxaEntrega,
      bairroEncontrado,
      mensagemErro: bairroEncontrado
        ? undefined
        : 'Bairro não cadastrado em nossa área de entrega padrão. Entre em contato via WhatsApp para consultar frete especial.',
    };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Erro ao buscar o CEP. Tente novamente.';
    return {
      sucesso: false,
      logradouro: '',
      bairro: '',
      cidade: '',
      uf: '',
      taxaEntrega: 0,
      bairroEncontrado: false,
      mensagemErro: errMessage,
    };
  }
}
