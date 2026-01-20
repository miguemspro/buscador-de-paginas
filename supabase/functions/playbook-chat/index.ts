import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface PlaybookChatRequest {
  message: string;
  playbook: any;
  extractedData: any;
  conversationHistory: ChatMessage[];
}

function buildContextPrompt(playbook: any, extractedData: any): string {
  const es = playbook.executiveSummary || {};
  const pains = playbook.probablePains || [];
  const solutions = playbook.metaSolutions || [];
  const cases = playbook.relevantCases || [];
  const evidences = playbook.evidences || [];
  const discovery = playbook.discoveryQuestions || {};

  return `
Você é um assistente especializado em vendas consultivas B2B para a Meta IT, uma consultoria SAP.
Você tem acesso a todo o contexto de um lead e deve ajudar o SDR a preparar abordagens, responder dúvidas e criar mensagens personalizadas.

=== CONTEXTO DO LEAD ===

DADOS BÁSICOS:
- Nome: ${extractedData?.name || 'Não informado'}
- Cargo: ${extractedData?.role || 'Não informado'}
- Empresa: ${extractedData?.company || 'Não informada'}
- Setor: ${extractedData?.industry || 'Não informado'}
- Status SAP: ${extractedData?.sapStatus || 'Não informado'}

RESUMO EXECUTIVO:
- Sobre a Empresa: ${es.companyContext || 'N/A'}
- Perfil do Lead: ${es.leadProfile || 'N/A'}

EVIDÊNCIAS ENCONTRADAS (${evidences.length}):
${evidences.map((e: any, i: number) => `${i + 1}. ${e.title} - ${e.indication} (${e.source})`).join('\n')}

DORES PROVÁVEIS (${pains.length}):
${pains.map((p: any, i: number) => `${i + 1}. ${p.pain} - Motivo: ${p.reason}`).join('\n')}

SOLUÇÕES META IT MAPEADAS (${solutions.length}):
${solutions.map((s: any, i: number) => `${i + 1}. ${s.solution} (resolve: ${s.pain}) - ${s.description}`).join('\n')}

CASES RELEVANTES (${cases.length}):
${cases.map((c: any, i: number) => `${i + 1}. ${c.company} - ${c.title}: ${c.result} (Relevância: ${c.relevance})`).join('\n')}

PERGUNTAS DE DISCOVERY:
Fase/Prioridades: ${discovery.phaseAndPriorities?.join('; ') || 'N/A'}
Operação/Integrações: ${discovery.operationsIntegration?.join('; ') || 'N/A'}
Qualificação: ${discovery.qualification?.join('; ') || 'N/A'}

=== INSTRUÇÕES ===

1. Responda de forma prática e direta, sempre baseado no contexto acima
2. Quando sugerir abordagens ou mensagens, personalize com os dados do lead
3. Mencione cases e soluções específicas quando relevante
4. Use um tom profissional mas conversacional
5. Se não tiver informação suficiente, seja honesto e sugira perguntas de validação
6. Responda em português brasileiro
7. Seja conciso - respostas com 2-4 parágrafos são ideais
`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, playbook, extractedData, conversationHistory } = await req.json() as PlaybookChatRequest;

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Mensagem é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build messages array with context
    const systemPrompt = buildContextPrompt(playbook, extractedData);
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    console.log('Calling Lovable AI with', messages.length, 'messages');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados. Entre em contato com o administrador.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Erro ao processar com IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const assistantResponse = data.choices?.[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';

    console.log('AI response received, length:', assistantResponse.length);

    return new Response(
      JSON.stringify({ response: assistantResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('playbook-chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
