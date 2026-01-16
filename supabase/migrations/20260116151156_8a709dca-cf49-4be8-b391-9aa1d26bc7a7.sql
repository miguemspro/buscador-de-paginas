-- 1. CITATION_VALIDATIONS: Remover política de leitura pública
DROP POLICY IF EXISTS "Validations are publicly readable" ON public.citation_validations;

-- 2. RESEARCH_CACHE: Remover política de leitura pública
DROP POLICY IF EXISTS "Cache is publicly readable" ON public.research_cache;