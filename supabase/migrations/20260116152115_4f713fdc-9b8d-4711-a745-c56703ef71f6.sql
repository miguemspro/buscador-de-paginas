-- ============================================
-- FASE 2.1: Estrutura para Admin de Cases
-- ============================================

-- 1. Adicionar campos que faltam na tabela meta_cases (comparando com schema do doc)
ALTER TABLE public.meta_cases 
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil',
  ADD COLUMN IF NOT EXISTS company_size TEXT DEFAULT 'enterprise',
  ADD COLUMN IF NOT EXISTS product_sold TEXT,
  ADD COLUMN IF NOT EXISTS sap_modules TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS project_type TEXT,
  ADD COLUMN IF NOT EXISTS challenge TEXT,
  ADD COLUMN IF NOT EXISTS solution TEXT,
  ADD COLUMN IF NOT EXISTS key_result TEXT,
  ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS project_date DATE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Criar tabela meta_solutions para Banco de Soluções (2.3)
CREATE TABLE IF NOT EXISTS public.meta_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  benefits TEXT[] DEFAULT '{}',
  related_pains TEXT[] DEFAULT '{}',
  sap_modules TEXT[] DEFAULT '{}',
  target_roles TEXT[] DEFAULT ARRAY['C-level', 'Diretor', 'Gerente'],
  use_cases TEXT[] DEFAULT '{}',
  expected_result TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. RLS para meta_solutions
ALTER TABLE public.meta_solutions ENABLE ROW LEVEL SECURITY;

-- Política de leitura restrita (bloqueia acesso público direto)
CREATE POLICY "No direct select access to solutions"
  ON public.meta_solutions 
  FOR SELECT
  USING (false);

-- Política para service role gerenciar
CREATE POLICY "Service role can manage solutions"
  ON public.meta_solutions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Trigger para updated_at em meta_solutions
CREATE TRIGGER update_meta_solutions_updated_at
  BEFORE UPDATE ON public.meta_solutions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Tabela de admin users para controle de acesso
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users readable by service role only"
  ON public.admin_users
  FOR SELECT
  USING (false);

CREATE POLICY "Service role can manage admin users"
  ON public.admin_users
  FOR ALL
  USING (true)
  WITH CHECK (true);