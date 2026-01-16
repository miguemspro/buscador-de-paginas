// ============================================
// FASE 1: Tipos para Pesquisa em Etapas
// ============================================

// ============================================
// 1.2 Pesquisa da Empresa
// ============================================
export interface CompanyEvidence {
  id: string;
  tipo: 'empresa' | 'lead' | 'setor' | 'concorrente';
  titulo: string;
  descricao: string;
  data_publicacao: string | null;
  links: string[];  // 1-2 links obrigatórios
  relevancia_sap: 1 | 2 | 3 | 4 | 5;
  confianca: 'alta' | 'media' | 'baixa';
  fonte: string;
}

// ============================================
// 1.3 Pesquisa do Lead
// ============================================
export interface LeadProfile {
  linkedin_url: string | null;
  historico_profissional: string | null;
  atividade_recente: string | null;
  prioridades_inferidas: string[];
  fonte_dados: 'linkedin_publico' | 'site_empresa' | 'google' | 'fornecido_sdr';
}

// ============================================
// 1.4 Pesquisa Setorial
// ============================================
export interface SectorResearch {
  setor: string;
  tendencias_2025_2026: string[];
  movimentos_sap: string[];
  concorrentes: ConcurrenteInfo[];
  prioridades_tipicas: string[];
  fontes_consultadas: string[];
}

export interface ConcurrenteInfo {
  nome: string;
  movimento_tech: string;
  fonte: string;
}

// ============================================
// 1.5 Validação de Citações
// ============================================
export interface CitationValidation {
  url: string;
  is_valid: boolean;
  http_status?: number;
  error?: string;
  validated_at: string;
}

// ============================================
// 1.6 Cache de Resultados
// ============================================
export interface CacheEntry {
  cache_key: string;
  cache_type: 'empresa' | 'lead' | 'setor';
  result_data: unknown;
  expires_at: string;
  hit_count: number;
}

// TTL padrão por tipo de cache (em horas)
export const CACHE_TTL_HOURS: Record<CacheEntry['cache_type'], number> = {
  empresa: 24,
  lead: 168, // 7 dias
  setor: 72
};

// ============================================
// Resultado consolidado da pesquisa
// ============================================
export interface ResearchResult {
  empresa: {
    evidencias: CompanyEvidence[];
    cache_hit: boolean;
  };
  lead: {
    perfil: LeadProfile | null;
    cache_hit: boolean;
  };
  setor: {
    pesquisa: SectorResearch | null;
    cache_hit: boolean;
  };
  validacao: {
    total_links: number;
    links_validos: number;
    links_invalidos: string[];
  };
}
