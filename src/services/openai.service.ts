import type { ConversationContext } from '../types/node.types';
import metaItConfig from '../data/meta_it_config.json';
import companySegments from '../data/company_segments.json';
import { supabase } from '@/integrations/supabase/client';

interface AISuggestion {
  suggestion: string;
  reasoning: string;
  alternatives: string[];
}

export class OpenAIService {

  private getClientesDoSegmento(segmento: string): string[] {
    if (!segmento) return [];

    const clientes = companySegments
      .filter((c) => c.segmento.toLowerCase() === segmento.toLowerCase())
      .map((c) => c.empresa)
      .slice(0, 3);

    return clientes;
  }

  async generateSuggestions(
    context: ConversationContext,
    nodeTitle: string,
    customPrompt?: string
  ): Promise<AISuggestion> {
    try {
      const { prospectInfo, conversationHistory, currentPhase, templateId } = context;

      const clientesExemplo = prospectInfo.industry
        ? this.getClientesDoSegmento(prospectInfo.industry)
        : [];

      const { data, error } = await supabase.functions.invoke('ai-suggestions', {
        body: {
          prospectInfo,
          conversationHistory,
          currentPhase,
          templateId,
          nodeTitle,
          customPrompt,
          metaItConfig: {
            empresa: metaItConfig.empresa,
            produtos: metaItConfig.produtos,
            diferenciais: metaItConfig.diferenciais,
          },
          clientesExemplo,
        },
      });

      if (error) {
        console.error('Erro ao chamar ai-suggestions:', error);
        throw error;
      }

      return data as AISuggestion;

    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);

      return {
        suggestion: 'Erro ao gerar sugestão. Por favor, tente novamente.',
        reasoning: 'Houve um problema na comunicação com a IA.',
        alternatives: [],
      };
    }
  }

  async generateQuickSuggestion(phase: string, industry?: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-suggestions', {
        body: {
          prospectInfo: { company: '', industry },
          conversationHistory: [],
          currentPhase: phase,
          templateId: 'quick',
          nodeTitle: phase,
          customPrompt: `Gere uma sugestão curta para a fase "${phase}" de uma prospecção ${industry ? `no setor ${industry}` : 'de TI'}.`,
          metaItConfig: {
            empresa: metaItConfig.empresa,
            produtos: metaItConfig.produtos,
            diferenciais: metaItConfig.diferenciais,
          },
          clientesExemplo: [],
        },
      });

      if (error) {
        console.error('Erro ao gerar sugestão rápida:', error);
        return 'Erro ao gerar sugestão';
      }

      return data?.suggestion || 'Sugestão não disponível';

    } catch (error) {
      console.error('Erro ao gerar sugestão rápida:', error);
      return 'Erro ao gerar sugestão';
    }
  }
}

export const openAIService = new OpenAIService();
