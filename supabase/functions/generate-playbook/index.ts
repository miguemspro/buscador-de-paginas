import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para buscar cases relevantes do banco de dados
async function findRelevantCasesFromDB(industry: string | undefined): Promise<{ company: string; result: string; title: string; solutions: string[] }[]> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (!industry) {
    // Se não há indústria, pegar cases genéricos de indústria
    const { data } = await supabase
      .from('meta_cases')
      .select('company_name, results, title, sap_solutions')
      .limit(4);
    
    return (data || []).map(c => ({
      company: c.company_name,
      result: c.results?.[0] || '',
      title: c.title,
      solutions: c.sap_solutions || []
    }));
  }

  const lowerIndustry = industry.toLowerCase();

  // Buscar cases onde alguma keyword bate com a indústria
  const { data: allCases } = await supabase
    .from('meta_cases')
    .select('company_name, industry, industry_keywords, results, title, sap_solutions, description');

  if (!allCases || allCases.length === 0) {
    return [];
  }

  // Filtrar cases que têm keywords matching
  const matchingCases = allCases.filter(caseItem => {
    const keywords = caseItem.industry_keywords || [];
    return keywords.some((kw: string) => lowerIndustry.includes(kw) || kw.includes(lowerIndustry));
  });

  // Se encontrou cases específicos, retornar eles
  if (matchingCases.length > 0) {
    return matchingCases.slice(0, 4).map(c => ({
      company: c.company_name,
      result: c.results?.[0] || c.description,
      title: c.title,
      solutions: c.sap_solutions || []
    }));
  }

  // Se não encontrou exato, buscar cases de indústrias similares
  // Tentar match parcial na indústria
  const partialMatches = allCases.filter(caseItem => {
    const caseIndustry = (caseItem.industry || '').toLowerCase();
    return caseIndustry.includes(lowerIndustry.split('/')[0]) || 
           lowerIndustry.includes(caseIndustry.split('/')[0]);
  });

  if (partialMatches.length > 0) {
    return partialMatches.slice(0, 4).map(c => ({
      company: c.company_name,
      result: c.results?.[0] || c.description,
      title: c.title,
      solutions: c.sap_solutions || []
    }));
  }

  // Fallback: retornar alguns cases genéricos de manufatura/indústria
  const fallbackCases = allCases
    .filter(c => c.industry?.toLowerCase().includes('indústria') || c.industry?.toLowerCase().includes('manufatura'))
    .slice(0, 4);

  return fallbackCases.map(c => ({
    company: c.company_name,
    result: c.results?.[0] || c.description,
    title: c.title,
    solutions: c.sap_solutions || []
  }));
}

// System prompt para geração do playbook consultivo
const SYSTEM_PROMPT = `Você é um especialista em vendas consultivas B2B da Meta IT, parceira premium SAP no Brasil com 35 anos de experiência.

Sua tarefa é gerar um PLAYBOOK CONSULTIVO COMPLETO para um SDR se preparar para uma ligação de prospecção.

REGRAS CRÍTICAS - LEIA COM ATENÇÃO:

1. EVIDÊNCIAS: RETORNE SEMPRE UM ARRAY VAZIO []
   - Você NÃO tem acesso a informações reais e verificáveis sobre a empresa
   - NÃO invente notícias, eventos ou acontecimentos
   - O SDR vai pesquisar manualmente no LinkedIn e Google
   - Qualquer evidência inventada é pior que nenhuma evidência

2. DORES: DEVEM SER BASEADAS EM FATOS CONCRETOS
   - Baseie as dores APENAS em informações fornecidas (cargo, setor, status SAP)
   - NÃO suponha dores sem embasamento
   - Cada dor deve ter um MOTIVO REAL baseado no contexto fornecido
   - Se o lead é de Manufatura com SAP ECC, dores sobre deadline 2027 são válidas
   - Se não há informação sobre algo, NÃO presuma dores sobre isso

3. PERFIL DO LEAD: DEVE REFLETIR O CARGO
   - Baseie o perfil EXCLUSIVAMENTE no cargo informado
   - NÃO invente características pessoais
   - Descreva o que profissionais NESSE CARGO tipicamente valorizam
   - Exemplo: "Como IT Manager, provavelmente foca em estabilidade, compliance e eficiência operacional"

4. SOLUÇÕES: DEVEM MAPEAR DIRETAMENTE COM AS DORES
   - Cada solução deve resolver uma dor específica listada
   - Use os cases de sucesso fornecidos como referência
   - Mencione soluções SAP específicas quando aplicável

5. PRIORIDADES E CONTEXTO: BASEADOS NO SETOR
   - Use conhecimento geral sobre o setor do lead
   - Deadline SAP 2027 é relevante para quem usa ECC
   - Mencione tendências do setor, não da empresa específica

ESTRUTURA DAS 6 SEÇÕES:

1. RESUMO EXECUTIVO (5 bullets):
   - Contexto da empresa e por que SAP é crítico (baseado no setor)
   - Perfil do lead (baseado APENAS no cargo fornecido)
   - 2 hipóteses de prioridade (baseadas no setor, não na empresa)
   - Melhor ângulo de abordagem
   - Contexto do setor (tendências gerais, não notícias da empresa)

2. EVIDÊNCIAS E NOTÍCIAS: SEMPRE RETORNE ARRAY VAZIO []
   - Você NÃO tem acesso a informações reais
   - O SDR vai pesquisar manualmente

3. DORES PROVÁVEIS (5-10 itens):
   - APENAS dores com embasamento no contexto fornecido
   - Se há menos informações, liste menos dores
   - Cada dor deve ter motivo real e verificável

4. COMO A META IT PODE AJUDAR (mesmo número que dores):
   - 1:1 com as dores listadas
   - Use os cases de sucesso como referência

5. PERGUNTAS DE DISCOVERY (12 perguntas em 3 grupos):
   - 4 sobre fase/projetos e prioridades
   - 4 sobre operação/integrações
   - 4 sobre qualificação

6. TEXTO DE ABORDAGEM:
   - Sem mencionar evidências específicas (você não tem)
   - Foque em entender o cenário
   - Use conhecimento do setor, não da empresa

SOBRE A META IT:
- 35 anos de experiência em soluções SAP
- +120 clientes em +25 segmentos
- Especialistas em: Migração S/4HANA, AMS, Outsourcing, Reforma Tributária, SAP BTP`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const leadData = body.leadData || body;
    
    if (!leadData || typeof leadData !== 'object') {
      console.error('leadData inválido:', body);
      return new Response(
        JSON.stringify({ error: 'leadData é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // Buscar cases relevantes do banco de dados
    console.log('Buscando cases para indústria:', leadData.industry);
    const relevantCases = await findRelevantCasesFromDB(leadData.industry);
    console.log('Cases encontrados:', relevantCases.length);

    const casesText = relevantCases.length > 0 
      ? relevantCases.map(c => `- ${c.company} (${c.title}): ${c.result}`).join('\n')
      : 'Nenhum case específico encontrado para este segmento. Use cases genéricos de transformação SAP.';

    const userPrompt = `Gere um PLAYBOOK CONSULTIVO COMPLETO para este lead:

DADOS DO LEAD (use APENAS estas informações):
- Nome: ${leadData.name || 'Não informado'}
- Cargo: ${leadData.role || 'Não informado'}
- Empresa: ${leadData.company || 'Não informada'}
- Segmento: ${leadData.industry || 'Não informado'}
- Porte: ${leadData.companySize || 'Não informado'}
- Status SAP: ${leadData.sapStatus || 'Não informado'}
- Prioridade: ${leadData.priority || 'Não informada'}
- Sinais Públicos: ${leadData.publicSignals || 'Não informados'}
- Origem: ${leadData.leadSource || 'Salesforce'}

CASES DE SUCESSO REAIS DA META IT (use como referência para soluções):
${casesText}

LEMBRETE CRÍTICO:
- Evidências: SEMPRE array vazio []
- Dores: APENAS com embasamento no contexto acima
- Perfil: Baseado APENAS no cargo "${leadData.role || 'não informado'}"
- Não invente nada que não esteja nos dados fornecidos

Gere o playbook com as 6 seções especificadas.`;

    console.log('Gerando playbook para:', leadData.name, '-', leadData.company);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_playbook',
            description: 'Gera um playbook consultivo completo com 6 seções estruturadas',
            parameters: {
              type: 'object',
              properties: {
                executiveSummary: {
                  type: 'object',
                  description: 'Resumo executivo em 5 bullets',
                  properties: {
                    companyContext: { type: 'string', description: 'Contexto do SETOR e por que SAP é crítico (não da empresa específica)' },
                    leadProfile: { type: 'string', description: 'Perfil baseado APENAS no cargo informado' },
                    priorities2026: { type: 'string', description: '2 hipóteses de prioridade baseadas no SETOR' },
                    approachAngle: { type: 'string', description: 'Melhor ângulo de abordagem (diagnóstico primeiro)' },
                    publicContext: { type: 'string', description: 'Tendências gerais do SETOR (não notícias da empresa)' }
                  },
                  required: ['companyContext', 'leadProfile', 'priorities2026', 'approachAngle', 'publicContext']
                },
                evidences: {
                  type: 'array',
                  description: 'DEVE SER ARRAY VAZIO []. Você não tem acesso a informações reais da empresa.',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      indication: { type: 'string' },
                      link: { type: 'string' },
                      source: { type: 'string' }
                    }
                  },
                  maxItems: 0
                },
                probablePains: {
                  type: 'array',
                  description: 'Dores com embasamento REAL no contexto fornecido (5-10 itens)',
                  items: {
                    type: 'object',
                    properties: {
                      pain: { type: 'string', description: 'Descrição da dor' },
                      reason: { type: 'string', description: 'Motivo REAL baseado nas informações fornecidas' }
                    },
                    required: ['pain', 'reason']
                  },
                  minItems: 5,
                  maxItems: 10
                },
                metaSolutions: {
                  type: 'array',
                  description: 'Soluções Meta IT mapeadas 1:1 com as dores',
                  items: {
                    type: 'object',
                    properties: {
                      pain: { type: 'string', description: 'Dor que essa solução resolve' },
                      solution: { type: 'string', description: 'Nome da solução Meta IT' },
                      description: { type: 'string', description: 'Descrição breve da solução' }
                    },
                    required: ['pain', 'solution', 'description']
                  },
                  minItems: 5,
                  maxItems: 10
                },
                discoveryQuestions: {
                  type: 'object',
                  description: 'Perguntas de discovery organizadas em 3 grupos de 4',
                  properties: {
                    phaseAndPriorities: {
                      type: 'array',
                      items: { type: 'string' },
                      description: '4 perguntas sobre fase/projetos/prioridades',
                      minItems: 4,
                      maxItems: 4
                    },
                    operationsIntegration: {
                      type: 'array',
                      items: { type: 'string' },
                      description: '4 perguntas sobre operação/integrações/estabilidade',
                      minItems: 4,
                      maxItems: 4
                    },
                    qualification: {
                      type: 'array',
                      items: { type: 'string' },
                      description: '4 perguntas sobre qualificação (janela, stakeholders, capacidade)',
                      minItems: 4,
                      maxItems: 4
                    }
                  },
                  required: ['phaseAndPriorities', 'operationsIntegration', 'qualification']
                },
                approachScript: {
                  type: 'object',
                  description: 'Texto final de abordagem estruturado',
                  properties: {
                    opening: { type: 'string', description: 'Abertura educada e natural' },
                    publicSignalsMention: { type: 'string', description: 'Menção a tendências do SETOR (não da empresa)' },
                    clearIntention: { type: 'string', description: 'Intenção clara: entender antes de apresentar' },
                    strategicQuestions: {
                      type: 'array',
                      items: { type: 'string' },
                      description: '2 perguntas estratégicas para abrir a conversa',
                      minItems: 2,
                      maxItems: 2
                    },
                    fullText: { type: 'string', description: 'Texto completo linear para o SDR usar na ligação' }
                  },
                  required: ['opening', 'publicSignalsMention', 'clearIntention', 'strategicQuestions', 'fullText']
                }
              },
              required: ['executiveSummary', 'evidences', 'probablePains', 'metaSolutions', 'discoveryQuestions', 'approachScript']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_playbook' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Aguarde alguns segundos e tente novamente.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Resposta da API recebida');

    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'generate_playbook') {
      console.error('Resposta inesperada da API:', JSON.stringify(result, null, 2));
      throw new Error('Formato de resposta inesperado da API');
    }

    const playbook = JSON.parse(toolCall.function.arguments);
    
    // Garantir que evidences é sempre array vazio
    playbook.evidences = [];
    
    console.log('Playbook gerado com sucesso');

    return new Response(
      JSON.stringify({ playbook, relevantCases }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função generate-playbook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
