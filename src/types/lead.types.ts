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
