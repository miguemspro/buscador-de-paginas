import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod validation schema
const ConversationMessageSchema = z.object({
  role: z.string().max(50),
  content: z.string().max(5000)
});

const ProspectInfoSchema = z.object({
  company: z.string().max(200),
  industry: z.string().max(100).optional(),
  role: z.string().max(100).optional()
});

const SuggestionRequestSchema = z.object({
  prospectInfo: ProspectInfoSchema,
  conversationHistory: z.array(ConversationMessageSchema).max(50),
  currentPhase: z.string().max(100),
  templateId: z.string().max(100),
  nodeTitle: z.string().max(200),
  customPrompt: z.string().max(2000).optional(),
  metaItConfig: z.object({
    empresa: z.object({
      nome: z.string().max(200),
      anos_mercado: z.number().max(200),
      descricao: z.string().max(1000)
    }),
    produtos: z.array(z.object({
      nome: z.string().max(200),
      descricao: z.string().max(500)
    })).max(50),
    diferenciais: z.array(z.string().max(500)).max(20)
  }),
  clientesExemplo: z.array(z.string().max(200)).max(20)
});

type SuggestionRequest = z.infer<typeof SuggestionRequestSchema>;

// Authentication helper
async function verifyAuth(req: Request): Promise<{ userId: string; email: string }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Autenticação necessária');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);
  
  if (error || !data?.claims) {
    throw new Error('Token inválido ou expirado');
  }

  return { 
    userId: data.claims.sub as string, 
    email: data.claims.email as string 
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    let authUser: { userId: string; email: string };
    try {
      authUser = await verifyAuth(req);
      console.log('Usuário autenticado:', authUser.email);
    } catch (authError) {
      return new Response(
        JSON.stringify({ 
          error: 'Autenticação necessária. Faça login para continuar.',
          suggestion: '',
          reasoning: '',
          alternatives: []
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    // Input validation
    const parseResult = SuggestionRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Dados inválidos',
          suggestion: '',
          reasoning: parseResult.error.errors.map(e => e.message).join(', '),
          alternatives: []
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const request = parseResult.data;
    const {
      prospectInfo,
      conversationHistory,
      currentPhase,
      templateId,
      nodeTitle,
      customPrompt,
      metaItConfig,
      clientesExemplo
    } = request;

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY missing');
      return new Response(
        JSON.stringify({ 
          error: 'Erro de configuração do serviço',
          suggestion: '',
          reasoning: '',
          alternatives: []
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientesTexto = clientesExemplo.length > 0
      ? `\nExemplos de clientes atendidos no setor ${prospectInfo.industry}: ${clientesExemplo.join(', ')}`
      : '';

    const historicoTexto = conversationHistory.length > 0
      ? conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')
      : 'Nenhuma conversa ainda';

    const prompt = `Você é um assistente especializado em vendas consultivas para SDRs de TI da Meta IT.

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
${customPrompt ? `\n\nINSTRUÇÃO ADICIONAL DO USUÁRIO:\n${customPrompt}` : ''}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em vendas consultivas B2B para SDRs de TI. Responda sempre em JSON válido com a estrutura: {"suggestion": "...", "reasoning": "...", "alternatives": ["...", "..."]}'
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro OpenAI:', response.status, errorText);
      return new Response(
        JSON.stringify({
          suggestion: 'Erro ao gerar sugestão. Por favor, tente novamente.',
          reasoning: 'Houve um problema na comunicação com a IA.',
          alternatives: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({
          suggestion: 'Resposta vazia da IA.',
          reasoning: 'A API não retornou conteúdo.',
          alternatives: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parsed = JSON.parse(content);

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função ai-suggestions:', error);
    return new Response(
      JSON.stringify({
        suggestion: 'Erro ao gerar sugestão. Por favor, tente novamente.',
        reasoning: error instanceof Error ? error.message : 'Erro desconhecido',
        alternatives: [],
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
