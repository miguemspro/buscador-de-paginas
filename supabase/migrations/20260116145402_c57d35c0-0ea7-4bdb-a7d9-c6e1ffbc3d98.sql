-- 1. Remover política de leitura pública de meta_cases
DROP POLICY IF EXISTS "Cases are publicly readable" ON public.meta_cases;

-- 2. Criar política que restringe leitura apenas ao service role (edge functions)
CREATE POLICY "Service role can read cases"
  ON public.meta_cases 
  FOR SELECT
  USING (false);

-- 3. Criar política para service role gerenciar cases
CREATE POLICY "Service role can manage cases"
  ON public.meta_cases
  FOR ALL
  USING (true)
  WITH CHECK (true);