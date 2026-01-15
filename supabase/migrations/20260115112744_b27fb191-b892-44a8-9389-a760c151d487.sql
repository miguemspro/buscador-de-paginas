-- Tabela para armazenar cases da Meta IT
CREATE TABLE public.meta_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  industry_keywords TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  results TEXT[] NOT NULL DEFAULT '{}',
  sap_solutions TEXT[] NOT NULL DEFAULT '{}',
  case_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS (mas permitir leitura pública para uso interno)
ALTER TABLE public.meta_cases ENABLE ROW LEVEL SECURITY;

-- Policy para leitura pública (cases são dados de marketing)
CREATE POLICY "Cases are publicly readable" 
ON public.meta_cases 
FOR SELECT 
USING (true);

-- Index para busca por indústria
CREATE INDEX idx_meta_cases_industry ON public.meta_cases(industry);
CREATE INDEX idx_meta_cases_keywords ON public.meta_cases USING GIN(industry_keywords);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_meta_cases_updated_at
BEFORE UPDATE ON public.meta_cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();