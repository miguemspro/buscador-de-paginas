import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cases de sucesso por segmento para referência do SDR
const CASES_BY_SEGMENT: Record<string, { company: string; result: string }[]> = {
  agro: [
    { company: "SLC Agrícola", result: "Redução de 40% no tempo de fechamento contábil com SAP S/4HANA" },
    { company: "Amaggi", result: "Integração de 15 unidades em tempo real com SAP BTP" },
    { company: "Tereos", result: "Automação de processos de originação com 60% menos erros" },
    { company: "Cooperativa Agrícola", result: "Visibilidade completa da cadeia com SAP IBP" },
  ],
  industria: [
    { company: "WEG", result: "Implementação global de SAP S/4HANA em 12 países" },
    { company: "Tigre", result: "Redução de 35% no lead time com SAP Digital Manufacturing" },
    { company: "Gerdau", result: "Integração de plantas com SAP MES e IoT" },
    { company: "Votorantim", result: "Transformação digital com SAP e economia de R$50M/ano" },
  ],
  varejo: [
    { company: "Riachuelo", result: "Omnichannel integrado com SAP Commerce e redução de ruptura em 25%" },
    { company: "Grupo Mateus", result: "Expansão de 50 lojas com SAP sem impacto operacional" },
    { company: "Pague Menos", result: "Integração de e-commerce com SAP em 3 meses" },
    { company: "Vivara", result: "Gestão unificada de estoques com SAP S/4HANA Retail" },
  ],
  financeiro: [
    { company: "BTG Pactual", result: "Compliance automatizado com SAP GRC" },
    { company: "Porto Seguro", result: "Redução de 45% no tempo de processamento de sinistros" },
    { company: "XP Investimentos", result: "Escalabilidade com SAP na nuvem" },
    { company: "Banco Inter", result: "Integração de backoffice com Open Banking via SAP BTP" },
  ],
  saude: [
    { company: "Rede D'Or", result: "Gestão integrada de 50+ hospitais com SAP" },
    { company: "Fleury", result: "Automação de laudos e redução de 30% no tempo de entrega" },
    { company: "Hapvida", result: "Integração pós-fusão com SAP em 6 meses" },
    { company: "Dasa", result: "Analytics preditivo para gestão de leitos" },
  ],
  energia: [
    { company: "Raízen", result: "Transformação S/4HANA com integração de cogeração" },
    { company: "CPFL", result: "Gestão de ativos com SAP PM/EAM e redução de 20% em manutenção" },
    { company: "Eneva", result: "Planejamento integrado de geração com SAP IBP" },
    { company: "Neoenergia", result: "Compliance regulatório automatizado com SAP" },
  ],
  logistica: [
    { company: "JSL", result: "TMS integrado com SAP e visibilidade em tempo real" },
    { company: "Movida", result: "Gestão de frota com SAP e redução de 15% em custos" },
    { company: "Localiza", result: "Escala pós-fusão com SAP S/4HANA" },
    { company: "Santos Brasil", result: "Automação portuária com SAP EWM" },
  ],
  tecnologia: [
    { company: "TOTVS", result: "Migração para SAP S/4HANA Cloud" },
    { company: "Positivo", result: "Gestão de supply chain global com SAP Ariba" },
    { company: "Intelbras", result: "Integração de fábricas com SAP Digital Core" },
  ],
  construcao: [
    { company: "MRV", result: "Gestão de empreendimentos com SAP RE-FX" },
    { company: "Cyrela", result: "Integração financeira e de projetos com SAP" },
    { company: "Even", result: "Controle de custos de obras com SAP PS" },
  ],
  servicos: [
    { company: "Grupo GPS", result: "Gestão de 100k+ colaboradores com SAP SuccessFactors" },
    { company: "Algar Tech", result: "Automação de processos de RH com SAP" },
  ],
};

// Função para encontrar cases relevantes baseado no segmento
function findRelevantCases(industry: string | undefined): { company: string; result: string }[] {
  if (!industry) return CASES_BY_SEGMENT.industria;
  
  const lowerIndustry = industry.toLowerCase();
  
  const segmentMap: Record<string, string[]> = {
    agro: ['agro', 'agrícola', 'agricultura', 'fazenda', 'commodities', 'grãos', 'soja', 'milho', 'café', 'açúcar', 'etanol'],
    industria: ['indústria', 'manufatura', 'fábrica', 'industrial', 'metalurgia', 'siderurgia', 'química', 'plástico'],
    varejo: ['varejo', 'retail', 'loja', 'comércio', 'e-commerce', 'shopping', 'supermercado', 'farmácia'],
    financeiro: ['banco', 'financeiro', 'seguro', 'investimento', 'fintech', 'crédito', 'pagamento'],
    saude: ['saúde', 'hospital', 'clínica', 'laboratório', 'farmacêutica', 'médico', 'diagnóstico'],
    energia: ['energia', 'elétrica', 'petróleo', 'gás', 'renovável', 'solar', 'eólica', 'utilidade'],
    logistica: ['logística', 'transporte', 'distribuição', 'armazém', 'frota', 'supply chain'],
    tecnologia: ['tecnologia', 'software', 'ti', 'tech', 'digital', 'telecom'],
    construcao: ['construção', 'imobiliário', 'incorporadora', 'engenharia', 'obras'],
    servicos: ['serviços', 'consultoria', 'terceirização', 'facilities', 'bpo'],
  };
  
  for (const [segment, keywords] of Object.entries(segmentMap)) {
    if (keywords.some(kw => lowerIndustry.includes(kw))) {
      return CASES_BY_SEGMENT[segment] || CASES_BY_SEGMENT.industria;
    }
  }
  
  return CASES_BY_SEGMENT.industria;
}

// System prompt para geração do playbook consultivo
const SYSTEM_PROMPT = `Você é um especialista em vendas consultivas B2B da Meta IT, parceira premium SAP no Brasil com 35 anos de experiência.

Sua tarefa é gerar um PLAYBOOK CONSULTIVO COMPLETO para um SDR se preparar para uma ligação de prospecção.

REGRAS CRÍTICAS:
1. O playbook deve ter EXATAMENTE 6 seções estruturadas
2. Use tom consultivo e profissional, nunca vendedor agressivo
3. Baseie-se em sinais públicos reais do mercado e do segmento do lead
4. As evidências devem ter links plausíveis para fontes reais (LinkedIn, portais de negócios, SAP News)
5. O texto de abordagem deve ser CONVERSACIONAL, não um pitch de vendas
6. Foque em diagnóstico e entendimento antes de apresentar soluções

ESTRUTURA DAS 6 SEÇÕES:

1. RESUMO EXECUTIVO (5 bullets):
   - Contexto da empresa e por que SAP é crítico
   - Perfil do lead e o que ele valoriza (baseado no cargo)
   - 2 hipóteses de prioridade para 2025/2026
   - Melhor ângulo de abordagem
   - Contexto público recente

2. EVIDÊNCIAS E NOTÍCIAS (6-10 itens):
   - Notícias sobre a empresa relacionadas a tecnologia, SAP, integração, automação, compliance
   - Cada item com: título, o que indica, link da fonte, nome da fonte
   - Use fontes plausíveis: LinkedIn da empresa, SAP News, portais do setor, Valor Econômico, etc.

3. DORES PROVÁVEIS (10 itens):
   - Baseadas no segmento e contexto do lead
   - Cada dor com: descrição da dor + motivo plausível

4. COMO A META IT PODE AJUDAR (10 itens):
   - Mapeamento 1:1 com as dores
   - Cada item: dor que resolve + solução Meta IT + descrição

5. PERGUNTAS DE DISCOVERY (12 perguntas em 3 grupos):
   - 4 sobre fase/projetos e prioridades 2025/2026
   - 4 sobre operação/integrações/estabilidade
   - 4 sobre qualificação (janela crítica, stakeholders, capacidade, governança)

6. TEXTO FINAL DE ABORDAGEM:
   - Abertura educada e natural
   - Menção aos sinais públicos observados
   - Intenção clara: entender cenário antes de apresentar solução
   - 2 perguntas estratégicas para abrir a conversa
   - Texto completo para o SDR usar

SOBRE A META IT:
- 35 anos de experiência em soluções SAP
- +120 clientes em +25 segmentos
- Especialistas em: Migração S/4HANA, AMS, Outsourcing, Reforma Tributária, SAP BTP

IMPORTANTE: Os cases de sucesso serão fornecidos na mensagem do usuário. Use-os naturalmente no texto de abordagem quando apropriado.`;

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

    const relevantCases = findRelevantCases(leadData.industry);
    const casesText = relevantCases.map(c => `- ${c.company}: ${c.result}`).join('\n');

    const userPrompt = `Gere um PLAYBOOK CONSULTIVO COMPLETO para este lead:

DADOS DO LEAD:
- Nome: ${leadData.name || 'Não informado'}
- Cargo: ${leadData.role || 'Não informado'}
- Empresa: ${leadData.company || 'Não informada'}
- Segmento: ${leadData.industry || 'Não informado'}
- Porte: ${leadData.companySize || 'Não informado'}
- Status SAP: ${leadData.sapStatus || 'Não informado'}
- Prioridade: ${leadData.priority || 'Não informada'}
- Sinais Públicos: ${leadData.publicSignals || 'Não informados'}
- Origem: ${leadData.leadSource || 'Salesforce'}

CASES DE SUCESSO DO SEGMENTO (use naturalmente no texto de abordagem):
${casesText}

Gere o playbook completo com as 6 seções especificadas.`;

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
                    companyContext: { type: 'string', description: 'Contexto da empresa e por que SAP é crítico' },
                    leadProfile: { type: 'string', description: 'Perfil do lead e o que ele valoriza' },
                    priorities2026: { type: 'string', description: '2 hipóteses de prioridade para 2025/2026' },
                    approachAngle: { type: 'string', description: 'Melhor ângulo de abordagem (diagnóstico primeiro)' },
                    publicContext: { type: 'string', description: 'Contexto público recente observado' }
                  },
                  required: ['companyContext', 'leadProfile', 'priorities2026', 'approachAngle', 'publicContext']
                },
                evidences: {
                  type: 'array',
                  description: 'Evidências e notícias com links (6-10 itens)',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string', description: 'Título da notícia/evidência' },
                      indication: { type: 'string', description: 'O que isso indica para a abordagem' },
                      link: { type: 'string', description: 'URL da fonte (plausível)' },
                      source: { type: 'string', description: 'Nome da fonte (LinkedIn, portal, etc)' }
                    },
                    required: ['title', 'indication', 'link', 'source']
                  },
                  minItems: 6,
                  maxItems: 10
                },
                probablePains: {
                  type: 'array',
                  description: 'Dores prováveis baseadas no contexto (10 itens)',
                  items: {
                    type: 'object',
                    properties: {
                      pain: { type: 'string', description: 'Descrição da dor' },
                      reason: { type: 'string', description: 'Motivo plausível para essa dor' }
                    },
                    required: ['pain', 'reason']
                  },
                  minItems: 10,
                  maxItems: 10
                },
                metaSolutions: {
                  type: 'array',
                  description: 'Soluções Meta IT mapeadas 1:1 com as dores (10 itens)',
                  items: {
                    type: 'object',
                    properties: {
                      pain: { type: 'string', description: 'Dor que essa solução resolve' },
                      solution: { type: 'string', description: 'Nome da solução Meta IT' },
                      description: { type: 'string', description: 'Descrição breve da solução' }
                    },
                    required: ['pain', 'solution', 'description']
                  },
                  minItems: 10,
                  maxItems: 10
                },
                discoveryQuestions: {
                  type: 'object',
                  description: 'Perguntas de discovery organizadas em 3 grupos de 4',
                  properties: {
                    phaseAndPriorities: {
                      type: 'array',
                      items: { type: 'string' },
                      description: '4 perguntas sobre fase/projetos/prioridades 2025/2026',
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
                    publicSignalsMention: { type: 'string', description: 'Menção aos sinais públicos observados' },
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
    console.log('Playbook gerado com sucesso');

    return new Response(
      JSON.stringify({ playbook }),
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
