-- 4.1 Tabela de eventos de analytics
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,  -- 'playbook_generated', 'evidence_validated', 'meeting_booked', etc
  user_id UUID,
  lead_company VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.2 Tabela de feedback do SDR
CREATE TABLE public.playbook_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID REFERENCES public.playbook_history(id),
  user_id UUID,
  dores_confirmadas TEXT[] DEFAULT '{}',
  case_utilizado VARCHAR(50) DEFAULT 'nao_apresentei', -- 'util', 'parcial', 'nao_util', 'nao_apresentei'
  resposta_lead VARCHAR(50) DEFAULT 'sem_resposta', -- 'positiva', 'neutra', 'negativa', 'sem_resposta'
  meeting_agendado BOOLEAN DEFAULT FALSE,
  meeting_data DATE,
  comentarios TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at DESC);
CREATE INDEX idx_playbook_feedback_playbook ON public.playbook_feedback(playbook_id);
CREATE INDEX idx_playbook_feedback_created ON public.playbook_feedback(created_at DESC);

-- RLS - analytics_events (público para inserção, leitura para admins)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can read analytics events"
ON public.analytics_events
FOR SELECT
USING (true);

-- RLS - playbook_feedback (público para inserção e leitura)
ALTER TABLE public.playbook_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert playbook feedback"
ON public.playbook_feedback
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can read playbook feedback"
ON public.playbook_feedback
FOR SELECT
USING (true);

CREATE POLICY "Anyone can update playbook feedback"
ON public.playbook_feedback
FOR UPDATE
USING (true);