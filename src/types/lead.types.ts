// ============================================
// FASE 1.1: Schema LeadCard - Dados extraídos do OCR
// ============================================

// Tipos para o formulário de lead e análise gerada pela IA

export interface LeadInfo {
  // Dados básicos do Lead (Salesforce)
  name: string;
  role: string;
  company: string;
  linkedinUrl?: string;
  phone?: string;
  email?: string;

  // Contexto SAP
  sapStatus: 'sap_services' | 'sap_ecc' | 's4hana' | 'business_one' | 'no_sap' | 'unknown';
  sapVersion?: string;
  priority?: string;

  // Contexto Empresa
  industry: string;
  companySize: 'small' | 'medium' | 'large' | 'enterprise';
  challenges?: string[];

  // Informações Adicionais
  publicSignals?: string;
  notes?: string;
  leadSource?: string;
}

export interface LeadCard {
  // Dados da empresa
  empresa: string;
  site: string | null;
  segmento: string | null;
  regiao: string | null;
  
  // Dados do lead
  lead_nome: string;
  lead_cargo: string | null;
  fonte_perfil_publico: string | null;
  
  // Dados do CRM
  anotacoes_sdr: string | null;
  data_captura: string;
  lead_source: string | null;
  lead_owner: string | null;
  
  // Status SAP
  sap_status: 'sap_services' | 'sap_ecc' | 's4hana' | 'business_one' | 'no_sap' | 'unknown';
  prioridade: string | null;
  porte_empresa: 'small' | 'medium' | 'large' | 'enterprise' | null;
  
  // Contato
  email: string | null;
  telefone: string | null;
  linkedin_url: string | null;
}

// Campos obrigatórios para validação
export const REQUIRED_LEAD_FIELDS: (keyof LeadCard)[] = ['empresa', 'lead_nome'];

// Validação de campos obrigatórios
export function validateLeadCard(lead: Partial<LeadCard>): { 
  isValid: boolean; 
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Campos obrigatórios
  if (!lead.empresa || lead.empresa.trim() === '') {
    missingFields.push('empresa');
  }
  if (!lead.lead_nome || lead.lead_nome.trim() === '') {
    missingFields.push('lead_nome');
  }

  // Avisos para campos importantes mas não obrigatórios
  if (!lead.lead_cargo) {
    warnings.push('Cargo do lead não identificado - recomendado preencher');
  }
  if (!lead.segmento) {
    warnings.push('Segmento da empresa não identificado - pesquisa setorial pode ser limitada');
  }
  if (!lead.sap_status || lead.sap_status === 'unknown') {
    warnings.push('Status SAP não identificado - dores podem ser menos precisas');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings
  };
}

// Mapeamento de status SAP
export const SAP_STATUS_LABELS: Record<LeadCard['sap_status'], string> = {
  sap_services: 'SAP Services',
  sap_ecc: 'SAP ECC',
  s4hana: 'S/4HANA',
  business_one: 'Business One',
  no_sap: 'Sem SAP',
  unknown: 'Não identificado'
};

// Mapeamento de porte
export const COMPANY_SIZE_LABELS: Record<NonNullable<LeadCard['porte_empresa']>, string> = {
  small: 'Pequeno',
  medium: 'Médio',
  large: 'Grande',
  enterprise: 'Enterprise'
};

export interface EvidenceItem {
  sinal: string;
  indicacao: string;
  fonte?: string;
}

export interface SolutionItem {
  solucao: string;
  dorAlinhada: string;
}

export interface DiscoveryQuestions {
  faseProjetosPrioridades: string[]; // 4 perguntas
  operacaoIntegracoes: string[]; // 4 perguntas
  qualificacao: string[]; // 4 perguntas
}

export interface LeadAnalysis {
  resumoExecutivo: {
    bullets: string[];
  };
  evidenciasSinais: {
    items: EvidenceItem[];
  };
  doresProvaveis: string[];
  solucoesMeta: SolutionItem[];
  perguntasDiscovery: DiscoveryQuestions;
  textoAbordagem: string;
}

export interface AnalysisSection {
  id: string;
  title: string;
  icon: string;
  type: 'summary' | 'evidence' | 'pains' | 'solutions' | 'questions' | 'script';
  content?: string | string[] | EvidenceItem[] | SolutionItem[] | DiscoveryQuestions;
}

export const INDUSTRY_OPTIONS = [
  'Agronegócio',
  'Alimentos e Bebidas',
  'Automotivo',
  'Bancos e Instituições Financeiras',
  'Bens de Consumo',
  'Construção Civil',
  'E-commerce',
  'Educação',
  'Energia e Utilities',
  'Farmacêutico',
  'Governo e Setor Público',
  'Logística e Transporte',
  'Manufatura',
  'Mineração',
  'Óleo e Gás',
  'Papel e Celulose',
  'Químico',
  'Saúde',
  'Seguros',
  'Serviços Profissionais',
  'Tecnologia',
  'Telecom',
  'Varejo',
  'Outro',
] as const;

export const SAP_STATUS_OPTIONS = [
  { value: 'sap_services', label: 'SAP Services' },
  { value: 'sap_ecc', label: 'SAP ECC' },
  { value: 's4hana', label: 'S/4HANA' },
  { value: 'business_one', label: 'Business One' },
  { value: 'no_sap', label: 'Não usa SAP' },
  { value: 'unknown', label: 'Não sei' },
] as const;

export const COMPANY_SIZE_OPTIONS = [
  { value: 'small', label: 'Pequena (até 100 funcionários)' },
  { value: 'medium', label: 'Média (100-500 funcionários)' },
  { value: 'large', label: 'Grande (500-5000 funcionários)' },
  { value: 'enterprise', label: 'Enterprise (5000+ funcionários)' },
] as const;

export const CHALLENGE_OPTIONS = [
  'Migração S/4HANA',
  'Reforma Tributária',
  'Integração de Sistemas',
  'Modernização de Legado',
  'Analytics e BI',
  'Automação de Processos',
  'Compliance e GRC',
  'Performance SAP',
  'Redução de Custos TI',
  'Transformação Digital',
] as const;
