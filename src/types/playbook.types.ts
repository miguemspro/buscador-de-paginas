// Tipos para o fluxo de playbook step-by-step

export type PlaybookStep = 
  | 'upload'      // Passo 1: Upload do print
  | 'extracting'  // Passo 1.5: Extraindo dados
  | 'context'     // Passo 2: Contexto extraído
  | 'generating'  // Passo 2.5: Gerando análise
  | 'playbook';   // Passo 3: Playbook completo

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

// Novo formato de insights estruturados
export interface KeyInsight {
  insight: string;
  source: string;
  relevance: string;
}

// Dores com impacto e pergunta de validação
export interface ProbablePain {
  pain: string;
  impact: string;
  question: string;
}

// Soluções com contexto de como mencionar
export interface MetaSolution {
  solution: string;
  description: string;
  alignedPain: string;
  howToMention: string;
}

// Cases para citar
export interface CaseToCite {
  company: string;
  result: string;
  howToIntroduce: string;
}

// Objeção e resposta
export interface ObjectionHandler {
  objection: string;
  response: string;
}

export interface GeneratedPlaybook {
  // Contexto
  leadSummary: string;
  keyInsights: KeyInsight[];
  
  // Script LINEAR (texto corrido)
  linearScript: string;
  
  // Objeções
  objectionHandlers: ObjectionHandler[];
  
  // Dores e soluções para referência
  probablePains: ProbablePain[];
  metaSolutions: MetaSolution[];
  
  // Cases para citar
  casesToCite: CaseToCite[];
}
