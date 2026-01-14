import type { LeadInfo, LeadAnalysis } from '@/types/lead.types';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-lead-analysis`;

export async function generateLeadAnalysis(leadInfo: LeadInfo): Promise<LeadAnalysis> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ leadInfo }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
    }
    if (response.status === 402) {
      throw new Error('Créditos insuficientes. Adicione créditos na sua conta.');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao gerar análise');
  }

  const data = await response.json();
  return data.analysis;
}

export async function regenerateSection(
  leadInfo: LeadInfo,
  sectionId: string,
  currentAnalysis: LeadAnalysis
): Promise<LeadAnalysis> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ 
      leadInfo, 
      regenerateSection: sectionId,
      currentAnalysis 
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
    }
    if (response.status === 402) {
      throw new Error('Créditos insuficientes. Adicione créditos na sua conta.');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao regenerar seção');
  }

  const data = await response.json();
  return data.analysis;
}
