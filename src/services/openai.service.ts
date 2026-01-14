import OpenAI from 'openai';
import type { ConversationContext } from '../types/node.types';
import metaItConfig from '../data/meta_it_config.json';
import companySegments from '../data/company_segments.json';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

if (!API_KEY) {
  console.warn('⚠️ VITE_OPENAI_API_KEY não configurada. A IA não funcionará.');
}

const openai = new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true,
});

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

  private buildPrompt(context: ConversationContext, nodeTitle: string, customPrompt?: string): string {
    const { prospectInfo, conversationHistory, currentPhase, templateId } = context;

    const clientesExemplo = prospectInfo.industry
      ? this.getClientesDoSegmento(prospectInfo.industry)
      : [];

    const clientesTexto = clientesExemplo.length > 0
      ? `\nExemplos de clientes atendidos no setor ${prospectInfo.industry}: ${clientesExemplo.join(', ')}`
      : '';

    const historicoTexto = conversationHistory.length > 0
      ? conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')
      : 'Nenhuma conversa ainda';

    return `Você é um assistente especializado em vendas consultivas para SDRs de TI da Meta IT.

INFORMAÇÕES DA META IT:
- Nome: ${metaItConfig.empresa.nome}
- Anos de mercado: ${metaItConfig.empresa.anos_mercado}
- Descrição: ${metaItConfig.empresa.descricao}

PRODUTOS/SERVIÇOS:
${metaItConfig.produtos.map(p => `- ${p.nome}: ${p.descricao}`).join('\n')}

DIFERENCIAIS:
${metaItConfig.diferenciais.map((d, i) => `${i + 1}. ${d}`).join('\n')}
${clientesTexto}

CONTEXTO DA CONVERSA:
- Metodologia ativa: ${templateId}
- Fase atual: ${currentPhase} - ${nodeTitle}
- Empresa prospect: ${prospectInfo.company || 'não informada'}
- Setor: ${prospectInfo.industry || 'não informado'}
- Cargo do contato: ${prospectInfo.role || 'não informado'}

HISTÓRICO DA CONVERSA:
${historicoTexto}

RESTRIÇÕES IMPORTANTES:
1. NÃO repita perguntas ou informações já mencionadas no histórico
2. NÃO alucine informações que não foram mencionadas
3. NÃO seja redundante ou prolixo
4. BASE-SE exclusivamente no histórico anterior e informações da Meta IT
5. Seja natural, consultivo e conversacional (não robotizado)
6. Use o nome do prospect se disponível
7. Se tiver clientes do mesmo setor, mencione-os naturalmente
8. Personalize para o setor/indústria do prospect

TAREFA:
Gere uma sugestão de texto para a fase "${currentPhase}" (${nodeTitle}) que seja:
- Contextualizada com a conversa anterior
- Específica para o setor ${prospectInfo.industry || 'TI'}
- Alinhada com a metodologia ${templateId}
- Natural e conversacional
- Direta e sem rodeios
${customPrompt ? `\n\nINSTRUÇÃO ADICIONAL DO USUÁRIO:\n${customPrompt}` : ''}

FORMATO DE RESPOSTA (JSON):
{
  "suggestion": "texto principal da sugestão aqui",
  "reasoning": "breve explicação (1-2 frases) do porquê dessa sugestão",
  "alternatives": ["alternativa 1", "alternativa 2"]
}

IMPORTANTE: Responda APENAS com o JSON, sem texto adicional antes ou depois.`;
  }

  async generateSuggestions(
    context: ConversationContext,
    nodeTitle: string,
    customPrompt?: string
  ): Promise<AISuggestion> {
    try {
      const prompt = this.buildPrompt(context, nodeTitle, customPrompt);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em vendas consultivas B2B para SDRs de TI. Responda sempre em JSON válido.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content;

      if (!responseContent) {
        throw new Error('Resposta vazia da API');
      }

      const parsed = JSON.parse(responseContent) as AISuggestion;

      return parsed;

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
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente de vendas consultivas. Seja breve e direto.',
          },
          {
            role: 'user',
            content: `Gere uma sugestão curta para a fase "${phase}" de uma prospecção ${industry ? `no setor ${industry}` : 'de TI'}.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      return completion.choices[0]?.message?.content || 'Sugestão não disponível';

    } catch (error) {
      console.error('Erro ao gerar sugestão rápida:', error);
      return 'Erro ao gerar sugestão';
    }
  }
}

export const openAIService = new OpenAIService();
