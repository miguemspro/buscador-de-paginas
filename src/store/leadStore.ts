import { create } from 'zustand';
import type { LeadInfo, LeadAnalysis, AnalysisSection } from '../types/lead.types';

interface LeadState {
  // Dados do Lead
  leadInfo: LeadInfo | null;
  
  // Análise Gerada
  analysis: LeadAnalysis | null;
  
  // Estado de UI
  isLoading: boolean;
  error: string | null;
  selectedSectionId: string | null;
  
  // Ações
  setLeadInfo: (info: LeadInfo) => void;
  setAnalysis: (analysis: LeadAnalysis) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedSectionId: (id: string | null) => void;
  clearAll: () => void;
  
  // Helpers
  getSectionContent: (sectionId: string) => AnalysisSection['content'] | null;
}

export const useLeadStore = create<LeadState>((set, get) => ({
  leadInfo: null,
  analysis: null,
  isLoading: false,
  error: null,
  selectedSectionId: null,

  setLeadInfo: (info) => set({ leadInfo: info }),
  
  setAnalysis: (analysis) => set({ analysis, error: null }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  setSelectedSectionId: (id) => set({ selectedSectionId: id }),
  
  clearAll: () => set({ 
    leadInfo: null, 
    analysis: null, 
    error: null, 
    selectedSectionId: null 
  }),

  getSectionContent: (sectionId) => {
    const { analysis } = get();
    if (!analysis) return null;
    
    switch (sectionId) {
      case 'resumo':
        return analysis.resumoExecutivo.bullets;
      case 'evidencias':
        return analysis.evidenciasSinais.items;
      case 'dores':
        return analysis.doresProvaveis;
      case 'solucoes':
        return analysis.solucoesMeta;
      case 'discovery':
        return analysis.perguntasDiscovery;
      case 'abordagem':
        return analysis.textoAbordagem;
      default:
        return null;
    }
  },
}));
