// ============================================
// Tipos para Admin - Fase 2
// ============================================

// Case Meta IT (2.1)
export interface MetaCase {
  id: string;
  company_name: string;
  industry: string;
  industry_keywords: string[];
  country: string;
  company_size: 'pequeno' | 'medio' | 'grande' | 'enterprise';
  product_sold: string | null;
  sap_modules: string[];
  sap_solutions: string[];
  project_type: string | null;
  title: string;
  description: string;
  challenge: string | null;
  solution: string | null;
  key_result: string | null;
  results: string[];
  metrics: {
    reducao_tempo?: string | null;
    reducao_custo?: string | null;
    aumento_eficiencia?: string | null;
  };
  case_url: string | null;
  project_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Solução Meta IT (2.3)
export interface MetaSolution {
  id: string;
  name: string;
  category: string;
  description: string;
  benefits: string[];
  related_pains: string[];
  sap_modules: string[];
  target_roles: string[];
  use_cases: string[];
  expected_result: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Formulário de Case
export interface CaseFormData {
  company_name: string;
  industry: string;
  industry_keywords: string[];
  country: string;
  company_size: string;
  product_sold: string;
  sap_modules: string[];
  sap_solutions: string[];
  project_type: string;
  title: string;
  description: string;
  challenge: string;
  solution: string;
  key_result: string;
  results: string[];
  metrics: {
    reducao_tempo: string;
    reducao_custo: string;
    aumento_eficiencia: string;
  };
  case_url: string;
  project_date: string;
  is_active: boolean;
}

// Formulário de Solução
export interface SolutionFormData {
  name: string;
  category: string;
  description: string;
  benefits: string[];
  related_pains: string[];
  sap_modules: string[];
  target_roles: string[];
  use_cases: string[];
  expected_result: string;
  is_active: boolean;
}

// Constantes
export const INDUSTRIES = [
  'Agronegócio',
  'Construção/Imobiliário',
  'Energia',
  'Farmacêutico',
  'Financeiro',
  'Indústria/Manufatura',
  'Logística/Transporte',
  'Saúde',
  'Serviços',
  'Tecnologia',
  'Varejo',
];

export const COMPANY_SIZES = [
  { value: 'pequeno', label: 'Pequeno (até 100 funcionários)' },
  { value: 'medio', label: 'Médio (100-500 funcionários)' },
  { value: 'grande', label: 'Grande (500-5000 funcionários)' },
  { value: 'enterprise', label: 'Enterprise (5000+ funcionários)' },
];

export const SAP_MODULES = [
  'MM', 'SD', 'FI', 'CO', 'PP', 'PM', 'QM', 'TM', 'EWM', 'WM',
  'HR', 'HCM', 'PS', 'CS', 'LE', 'APO', 'CRM', 'SRM', 'PLM',
];

export const PROJECT_TYPES = [
  { value: 'implementacao', label: 'Implementação' },
  { value: 'migracao', label: 'Migração S/4HANA' },
  { value: 'upgrade', label: 'Upgrade' },
  { value: 'ams', label: 'AMS (Sustentação)' },
  { value: 'dados', label: 'Dados e Analytics' },
  { value: 'btp', label: 'BTP' },
  { value: 'drc', label: 'DRC (Reforma Tributária)' },
  { value: 'integracao', label: 'Integração' },
];

export const SOLUTION_CATEGORIES = [
  { value: 'erp', label: 'ERP' },
  { value: 'integracao', label: 'Integração' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'suporte', label: 'Suporte/AMS' },
  { value: 'dados', label: 'Dados e IA' },
  { value: 'fiscal', label: 'Fiscal' },
  { value: 'cloud', label: 'Cloud/BTP' },
];

export const TARGET_ROLES = [
  // C-level
  'CEO',
  'CFO',
  'CIO',
  'CTO',
  'COO',
  // Diretoria
  'Diretor de TI',
  'Diretor Financeiro',
  'Diretor de Operações',
  'Diretor Comercial',
  'Diretor de Supply Chain',
  // Gerência
  'Gerente de TI',
  'Gerente de Projetos',
  'Gerente SAP',
  'Gerente Financeiro',
  'Gerente de Compras',
  'Gerente Tributário',
  // Coordenação/Head
  'Head de TI',
  'Coordenador SAP',
  'Coordenador de Sistemas',
  // Especialistas
  'Arquiteto SAP',
  'Consultor SAP',
  'Analista de Negócios',
  'Especialista Fiscal',
  'Key User',
];

export const SAP_SOLUTIONS = [
  'S/4HANA',
  'BTP',
  'CPI',
  'PI/PO',
  'Fiori',
  'SolMan',
  'Ariba',
  'SuccessFactors',
  'DRC',
  'SAC',
  'BW/4HANA',
  'BO',
  'GRC',
  'Basis',
];
