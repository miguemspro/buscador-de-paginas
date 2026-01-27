import type { LeadInfo, LeadAnalysis } from '@/types/lead.types';
import { supabase } from '@/integrations/supabase/client';

export async function extractLeadFromImage(imageBase64: string): Promise<Partial<LeadInfo>> {
  // Use supabase.functions.invoke which automatically includes auth token
  const { data, error } = await supabase.functions.invoke('extract-salesforce-data', {
    body: { imageBase64 },
  });

  if (error) {
    console.error('Erro na extração:', error);
    if (error.message?.includes('401') || error.message?.includes('auth')) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    throw new Error('Falha ao extrair dados da imagem');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data.leadInfo;
}

export async function generateLeadAnalysis(leadInfo: LeadInfo): Promise<LeadAnalysis> {
  const { data, error } = await supabase.functions.invoke('generate-lead-analysis', {
    body: { leadInfo },
  });

  if (error) {
    console.error('Erro na análise:', error);
    if (error.message?.includes('401') || error.message?.includes('auth')) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    if (error.message?.includes('429')) {
      throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
    }
    if (error.message?.includes('402')) {
      throw new Error('Créditos insuficientes. Adicione créditos na sua conta.');
    }
    throw new Error('Erro ao gerar análise');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data.analysis;
}

export async function regenerateSection(
  leadInfo: LeadInfo,
  sectionId: string,
  currentAnalysis: LeadAnalysis
): Promise<LeadAnalysis> {
  const { data, error } = await supabase.functions.invoke('generate-lead-analysis', {
    body: { 
      leadInfo, 
      regenerateSection: sectionId,
      currentAnalysis 
    },
  });

  if (error) {
    console.error('Erro na regeneração:', error);
    if (error.message?.includes('401') || error.message?.includes('auth')) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    if (error.message?.includes('429')) {
      throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
    }
    if (error.message?.includes('402')) {
      throw new Error('Créditos insuficientes. Adicione créditos na sua conta.');
    }
    throw new Error('Erro ao regenerar seção');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data.analysis;
}
