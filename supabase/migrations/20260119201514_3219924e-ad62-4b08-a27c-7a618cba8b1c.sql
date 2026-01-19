-- 1. PLAYBOOK_HISTORY - Já tem política correta bloqueando acesso direto
-- Não precisa alterar

-- 2. ANALYTICS_EVENTS - Restringir para usuários autenticados
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Anyone can read analytics events" ON public.analytics_events;

-- Usuários autenticados podem inserir (com ou sem user_id)
CREATE POLICY "Authenticated users can insert analytics events"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Usuários autenticados podem ler todos (analytics são agregados)
CREATE POLICY "Authenticated users can read analytics events"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. PLAYBOOK_FEEDBACK - Bloquear acesso público
DROP POLICY IF EXISTS "Anyone can insert playbook feedback" ON public.playbook_feedback;
DROP POLICY IF EXISTS "Anyone can read playbook feedback" ON public.playbook_feedback;
DROP POLICY IF EXISTS "Anyone can update playbook feedback" ON public.playbook_feedback;

-- Bloquear SELECT
CREATE POLICY "Block direct select on playbook_feedback"
  ON public.playbook_feedback
  FOR SELECT
  USING (false);

-- Bloquear INSERT 
CREATE POLICY "Block direct insert on playbook_feedback"
  ON public.playbook_feedback
  FOR INSERT
  WITH CHECK (false);

-- Bloquear UPDATE
CREATE POLICY "Block direct update on playbook_feedback"
  ON public.playbook_feedback
  FOR UPDATE
  USING (false);

-- 4. META_CASES - Permitir leitura pública de cases ativos apenas
DROP POLICY IF EXISTS "Service role can read cases" ON public.meta_cases;

-- Leitura pública apenas de cases ativos
CREATE POLICY "Public can read active meta_cases"
  ON public.meta_cases
  FOR SELECT
  USING (is_active = true);

-- 5. META_SOLUTIONS - Permitir leitura pública de soluções ativas
DROP POLICY IF EXISTS "No direct select access to solutions" ON public.meta_solutions;

-- Leitura pública apenas de soluções ativas
CREATE POLICY "Public can read active meta_solutions"
  ON public.meta_solutions
  FOR SELECT
  USING (is_active = true);