import { create } from 'zustand';
import type { PlaybookStep, ExtractedLeadData, GeneratedPlaybook } from '../types/playbook.types';

interface PlaybookState {
  // Estado do fluxo
  currentStep: PlaybookStep;
  
  // Dados
  imagePreview: string | null;
  extractedData: ExtractedLeadData | null;
  playbook: GeneratedPlaybook | null;
  
  // UI State
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  activeCardIndex: number;
  
  // Ações
  setStep: (step: PlaybookStep) => void;
  setImagePreview: (preview: string | null) => void;
  setExtractedData: (data: ExtractedLeadData | null) => void;
  setPlaybook: (playbook: GeneratedPlaybook | null) => void;
  setLoading: (loading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  setActiveCardIndex: (index: number) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 'upload' as PlaybookStep,
  imagePreview: null,
  extractedData: null,
  playbook: null,
  isLoading: false,
  loadingMessage: '',
  error: null,
  activeCardIndex: 0,
};

export const usePlaybookStore = create<PlaybookState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step, error: null }),
  
  setImagePreview: (preview) => set({ imagePreview: preview }),
  
  setExtractedData: (data) => set({ extractedData: data }),
  
  setPlaybook: (playbook) => set({ playbook }),
  
  setLoading: (loading, message = '') => set({ 
    isLoading: loading, 
    loadingMessage: message,
    error: loading ? null : undefined 
  }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  setActiveCardIndex: (index) => set({ activeCardIndex: index }),
  
  reset: () => set(initialState),
}));
