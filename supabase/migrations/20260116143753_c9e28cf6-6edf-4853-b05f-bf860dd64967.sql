-- ============================================
-- FASE 1.6: Cache de Resultados de Pesquisa
-- ============================================

-- Tabela de cache para pesquisas (empresa, lead, setor)
CREATE TABLE public.research_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,  -- "empresa:acme.com.br" ou "setor:varejo"
  cache_type VARCHAR(50) NOT NULL CHECK (cache_type IN ('empresa', 'lead', 'setor')),
  result_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  hit_count INTEGER DEFAULT 0,
  last_hit_at TIMESTAMP WITH TIME ZONE
);

-- Índice para busca por chave
CREATE INDEX idx_research_cache_key ON public.research_cache(cache_key);

-- Índice para limpeza de expirados
CREATE INDEX idx_research_cache_expires ON public.research_cache(expires_at);

-- RLS - cache é público para leitura (anonimo pode ler)
ALTER TABLE public.research_cache ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Cache is publicly readable"
  ON public.research_cache
  FOR SELECT
  USING (true);

-- Política de inserção/atualização via service role (edge functions)
CREATE POLICY "Service role can manage cache"
  ON public.research_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- FASE 1.5: Log de Validação de Citações  
-- ============================================

-- Tabela para registrar validações de links
CREATE TABLE public.citation_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID,
  evidence_url TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT false,
  http_status INTEGER,
  validation_error TEXT,
  validated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca por URL
CREATE INDEX idx_citation_url ON public.citation_validations(evidence_url);

-- RLS
ALTER TABLE public.citation_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Validations are publicly readable"
  ON public.citation_validations
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage validations"
  ON public.citation_validations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- FASE 1: Histórico de Playbooks Gerados
-- ============================================

-- Tabela para salvar playbooks gerados
CREATE TABLE public.playbook_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados do lead
  lead_name TEXT,
  lead_role TEXT,
  lead_company TEXT NOT NULL,
  lead_industry TEXT,
  lead_email TEXT,
  sap_status TEXT,
  
  -- Dados extraídos
  extracted_data JSONB,
  
  -- Playbook gerado
  playbook_data JSONB NOT NULL,
  
  -- Evidências encontradas
  evidences_count INTEGER DEFAULT 0,
  validated_evidences_count INTEGER DEFAULT 0,
  
  -- Metadados
  generation_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca por empresa
CREATE INDEX idx_playbook_company ON public.playbook_history(lead_company);

-- RLS
ALTER TABLE public.playbook_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Playbooks are publicly readable"
  ON public.playbook_history
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage playbooks"
  ON public.playbook_history
  FOR ALL
  USING (true)
  WITH CHECK (true);