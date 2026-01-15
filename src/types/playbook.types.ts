// Tipos para o fluxo de playbook step-by-step

export type PlaybookStep = 
  | 'upload'      // Passo 1: Upload do print
  | 'extracting'  // Passo 1.5: Extraindo dados
  | 'context'     // Passo 2: Contexto extraído
  | 'generating'  // Passo 2.5: Gerando análise
  | 'playbook';   // Passo 3: Playbook completo

export interface PlaybookCard {
  id: string;
  step: number;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'opener' | 'context' | 'hook' | 'questions' | 'objections' | 'close';
  content: string | string[];
  tips?: string[];
  copyable?: boolean;
}

export interface CallScript {
  opener: PlaybookCard;
  context: PlaybookCard;
  hook: PlaybookCard;
  discoveryQuestions: PlaybookCard;
  objectionHandlers: PlaybookCard;
  closeAttempt: PlaybookCard;
}

export interface ExtractedLeadData {
  name?: string;
  role?: string;
  company?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  sapStatus?: string;
  priority?: string;
  industry?: string;
  companySize?: string;
  publicSignals?: string;
  leadSource?: string;
}

export interface GeneratedPlaybook {
  // Contexto
  leadSummary: string;
  keyInsights: string[];
  
  // Script em cards
  callScript: {
    opener: string;
    contextBridge: string;
    valueHook: string;
    discoveryQuestions: string[];
    objectionHandlers: {
      objection: string;
      response: string;
    }[];
    closeAttempt: string;
  };
  
  // Dores e soluções para referência
  probablePains: string[];
  metaSolutions: {
    solution: string;
    alignedPain: string;
  }[];
}
