-- 1. Criar view pública que oculta dados sensíveis
CREATE VIEW public.playbook_history_public
WITH (security_invoker=on) AS
SELECT 
  id,
  lead_company,
  lead_industry,
  sap_status,
  playbook_data,
  evidences_count,
  validated_evidences_count,
  generation_time_ms,
  cache_hit,
  created_at
  -- Oculta: lead_name, lead_email, lead_role, extracted_data
FROM public.playbook_history;

-- 2. Remover política de leitura pública da tabela base
DROP POLICY IF EXISTS "Playbooks are publicly readable" ON public.playbook_history;

-- 3. Criar política que nega acesso direto SELECT à tabela base (apenas service role)
CREATE POLICY "No direct select access"
  ON public.playbook_history 
  FOR SELECT
  USING (false);

-- 4. Adicionar comentário explicativo na view
COMMENT ON VIEW public.playbook_history_public IS 'View pública que oculta PII (nome, email, cargo do lead) para leitura segura';