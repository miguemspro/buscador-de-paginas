import { create } from 'zustand';
import type { PlaybookStep, ExtractedLeadData, GeneratedPlaybook } from '../types/playbook.types';

// Novo: fases de pesquisa para Fase 1
export type ResearchPhase = 
  | 'extracting'     // OCR
  | 'confirming'     // Nova: confirmação do lead
  | 'enriching'      // Enriquecendo perfil via Apify
  | 'company'        // Pesquisa empresa
  | 'lead'           // Pesquisa lead
  | 'sector'         // Pesquisa setorial
  | 'validating'     // Validando citações
  | 'generating'     // Gerando playbook
  | 'complete';

interface PlaybookState {
  // Estado do fluxo
  currentStep: PlaybookStep;
  researchPhase: ResearchPhase;
  
  // Dados
  imagePreview: string | null;
  extractedData: ExtractedLeadData | null;
  playbook: GeneratedPlaybook | null;
  playbookId: string | null;
  
  // Métricas de pesquisa (Fase 1)
  evidencesFound: number;
  cacheHit: boolean;
  
  // UI State
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  activeCardIndex: number;
  
  // Ações
  setStep: (step: PlaybookStep) => void;
  setResearchPhase: (phase: ResearchPhase) => void;
  setImagePreview: (preview: string | null) => void;
  setExtractedData: (data: ExtractedLeadData | null) => void;
  setPlaybook: (playbook: GeneratedPlaybook | null, id?: string) => void;
  setLoading: (loading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  setActiveCardIndex: (index: number) => void;
  setResearchMetrics: (evidences: number, cacheHit: boolean) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 'upload' as PlaybookStep,
  researchPhase: 'extracting' as ResearchPhase,
  imagePreview: null,
  extractedData: null,
  playbook: null,
  playbookId: null,
  evidencesFound: 0,
  cacheHit: false,
  isLoading: false,
  loadingMessage: '',
  error: null,
  activeCardIndex: 0,
};

export const usePlaybookStore = create<PlaybookState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step, error: null }),
  
  setResearchPhase: (phase) => set({ researchPhase: phase }),
  
  setImagePreview: (preview) => set({ imagePreview: preview }),
  
  setExtractedData: (data) => set({ extractedData: data }),
  
  setPlaybook: (playbook, id) => set({ playbook, playbookId: id || null }),
  
  setLoading: (loading, message = '') => set({ 
    isLoading: loading, 
    loadingMessage: message,
    error: loading ? null : undefined 
  }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  setActiveCardIndex: (index) => set({ activeCardIndex: index }),
  
  setResearchMetrics: (evidences, cacheHit) => set({ 
    evidencesFound: evidences, 
    cacheHit 
  }),
  
  reset: () => set(initialState),
}));
