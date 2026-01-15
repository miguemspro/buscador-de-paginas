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

// ============================================
// 1) RESUMO EXECUTIVO - 5 bullets estruturados
// ============================================
export interface ExecutiveSummary {
  companyContext: string;      // Empresa + por que SAP é crítico
  leadProfile: string;         // Quem é o lead e o que valoriza
  priorities2026: string;      // 2 hipóteses de prioridade
  approachAngle: string;       // Melhor ângulo (diagnóstico primeiro)
  publicContext: string;       // Contexto público recente
}

// ============================================
// 2) EVIDÊNCIAS E NOTÍCIAS - 6 a 10 itens COM LINKS
// ============================================
export interface Evidence {
  title: string;               // Título da notícia/evidência
  indication: string;          // O que indica (interpretação)
  link: string;                // URL da fonte
  source: string;              // Nome da fonte (LinkedIn, site, etc)
  date?: string;               // Data aproximada (ex: "Jan 2026")
}

// ============================================
// 3) DORES PROVÁVEIS - 10 itens
// ============================================
export interface ProbablePain {
  pain: string;                // A dor em si
  reason: string;              // Motivo plausível
}

// ============================================
// 4) COMO A META PODE AJUDAR - 10 itens (1:1 com dores)
// ============================================
export interface MetaSolution {
  pain: string;                // Dor correspondente
  solution: string;            // Solução Meta IT
  description: string;         // Explicação breve
}

// ============================================
// 5) PERGUNTAS DISCOVERY - 12 perguntas em 3 grupos
// ============================================
export interface DiscoveryQuestions {
  phaseAndPriorities: string[];    // 4 sobre fase/projetos/prioridades 2026
  operationsIntegration: string[]; // 4 sobre operação/integrações/estabilidade
  qualification: string[];         // 4 sobre qualificação (janela, stakeholders, capacidade)
}

// ============================================
// 6) TEXTO FINAL DE ABORDAGEM - estrutura consultiva
// ============================================
export interface ApproachScript {
  opening: string;              // Abertura educada
  publicSignalsMention: string; // Menção aos sinais públicos
  clearIntention: string;       // Intenção clara (entender antes de apresentar)
  strategicQuestions: string[]; // 2 perguntas estratégicas
  fullText: string;             // Texto completo linear
}

// ============================================
// PLAYBOOK COMPLETO - 6 seções
// ============================================
export interface GeneratedPlaybook {
  executiveSummary: ExecutiveSummary;
  evidences: Evidence[];             // 6-10 itens
  probablePains: ProbablePain[];     // 10 itens
  metaSolutions: MetaSolution[];     // 10 itens
  discoveryQuestions: DiscoveryQuestions;
  approachScript: ApproachScript;
}
