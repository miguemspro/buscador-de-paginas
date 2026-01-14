import type { NodeType } from './node.types';

export interface PhaseDefinition {
  id: string;
  title: string;
  type: NodeType;
  method?: 'SPIN' | 'GPCT' | 'BANT';
  description?: string;
  icon?: string;
  defaultContent?: string;
  children?: PhaseDefinition[];
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  phases: PhaseDefinition[];
}

export interface MetaITConfig {
  empresa: {
    nome: string;
    anos_mercado: number;
    descricao: string;
    site: string;
    contato: {
      email: string;
      telefone: string;
    };
  };
  produtos: Array<{
    id: string;
    nome: string;
    descricao: string;
    segmentos_alvo: string[];
  }>;
  diferenciais: string[];
  cases: any[];
}

export interface ClienteSegmento {
  empresa: string;
  segmento: string;
}
