import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cases de sucesso por segmento
const CASES_BY_SEGMENT: Record<string, { empresa: string; resultado: string; contexto: string }[]> = {
  "Agronegócio": [
    { empresa: "John Deere", resultado: "Redução de 40% no tempo de fechamento contábil após migração S/4HANA", contexto: "Migração para S/4HANA com integração de processos de supply chain" },
    { empresa: "Bunge", resultado: "Otimização de processos fiscais com economia de R$2M/ano", contexto: "Adequação tributária e automação de compliance" },
    { empresa: "OCP Fertilizantes", resultado: "Rollout global em 8 países com padronização de processos", contexto: "Implementação SAP integrada para operações internacionais" },
    { empresa: "Lavoro", resultado: "Integração de 15 empresas adquiridas em plataforma SAP única", contexto: "Consolidação de M&A com AMS contínuo" },
  ],
  "Serviços Financeiros": [
    { empresa: "Sicredi", resultado: "99.9% de uptime após migração para S/4HANA", contexto: "Migração crítica com zero downtime para cooperativa financeira" },
    { empresa: "Porto Seguro", resultado: "Automação de 80% dos processos de backoffice", contexto: "AMS com squad dedicado e melhoria contínua" },
    { empresa: "Banco BMG", resultado: "Redução de 60% no tempo de processamento de operações", contexto: "Otimização de processos com SAP BTP" },
    { empresa: "Getnet", resultado: "Integração de novos produtos 3x mais rápida", contexto: "Arquitetura SAP flexível para inovação em pagamentos" },
  ],
  "Saúde": [
    { empresa: "Unimed Brasil", resultado: "Padronização de processos em 300+ cooperativas", contexto: "Rollout nacional com template SAP customizado" },
    { empresa: "Cimed", resultado: "Compliance FDA/ANVISA automatizado no SAP", contexto: "Implementação de processos farmacêuticos regulados" },
    { empresa: "DB Diagnósticos", resultado: "Integração de laboratórios com redução de 50% em erros", contexto: "SAP integrado com sistemas de diagnóstico" },
  ],
  "Indústria": [
    { empresa: "Gerdau", resultado: "Ganho de 25% em eficiência operacional", contexto: "Migração S/4HANA com foco em manufatura" },
    { empresa: "Electrolux", resultado: "Visibilidade end-to-end da cadeia de suprimentos", contexto: "SAP IBP para planejamento integrado" },
    { empresa: "Volvo", resultado: "Redução de 35% no lead time de produção", contexto: "Otimização de processos com SAP MES" },
    { empresa: "Philip Morris", resultado: "Compliance global automatizado em 20 países", contexto: "Rollout SAP com adequações locais" },
  ],
  "Comércio e Varejo": [
    { empresa: "Lojas Renner", resultado: "Omnichannel com SAP CAR processando 1M+ transações/dia", contexto: "Integração de canais físicos e digitais" },
    { empresa: "Pernambucanas", resultado: "Redução de 40% no tempo de inventário", contexto: "SAP Retail com RFID integrado" },
    { empresa: "Zaffari", resultado: "Gestão unificada de 30+ lojas em tempo real", contexto: "SAP Retail com analytics avançado" },
  ],
  "Energia": [
    { empresa: "EDP", resultado: "Gestão de ativos com redução de 30% em manutenção corretiva", contexto: "SAP PM/EAM para utilities" },
    { empresa: "Energisa", resultado: "Integração regulatória automatizada com ANEEL", contexto: "SAP com compliance setorial" },
    { empresa: "FS Bioenergia", resultado: "Visibilidade 360° da operação de etanol e biodiesel", contexto: "SAP para bioenergia e commodities" },
  ],
  "Seguros": [
    { empresa: "Tokio Marine", resultado: "Processamento de sinistros 50% mais rápido", contexto: "Automação de processos com SAP BTP" },
    { empresa: "AXA Seguros", resultado: "Compliance regulatório automatizado", contexto: "SAP FS para seguradoras" },
    { empresa: "Prudential", resultado: "Integração global com matriz em tempo real", contexto: "Rollout SAP com padronização de relatórios" },
  ],
  "Tecnologia": [
    { empresa: "TOTVS", resultado: "Migração para S/4HANA em 6 meses", contexto: "Projeto fast-track com metodologia ágil" },
    { empresa: "Dell", resultado: "Integração de supply chain global", contexto: "SAP SCM com visibilidade end-to-end" },
    { empresa: "Zenvia", resultado: "Escalabilidade para crescimento de 200%", contexto: "Arquitetura SAP cloud-ready" },
  ],
};

// Função para encontrar cases relevantes
function findRelevantCases(industry: string): { empresa: string; resultado: string; contexto: string }[] {
  const normalizedIndustry = industry?.toLowerCase() || '';
  
  // Mapeamento de palavras-chave para segmentos
  const segmentMappings: Record<string, string[]> = {
    "Agronegócio": ["agro", "agricultura", "fazenda", "rural", "fertilizante", "sementes", "agrícola", "cooperativa agro"],
    "Serviços Financeiros": ["banco", "financ", "crédito", "pagamento", "fintech", "cooperativa de crédito", "seguradora de vida"],
    "Saúde": ["saúde", "hospital", "clínica", "farmac", "lab", "diagnóstico", "unimed", "medicina"],
    "Indústria": ["indústria", "manufatura", "fábrica", "produção", "automotiv", "siderúrgi", "químic", "industrial"],
    "Comércio e Varejo": ["varejo", "loja", "comércio", "retail", "atacado", "supermercado", "e-commerce"],
    "Energia": ["energia", "óleo", "gás", "elétric", "utility", "petróleo", "bioenergia"],
    "Seguros": ["seguro", "insurance", "previdência", "resseguro"],
    "Tecnologia": ["tecnologia", "software", "ti", "tech", "digital", "saas", "telecom"],
  };

  for (const [segment, keywords] of Object.entries(segmentMappings)) {
    if (keywords.some(kw => normalizedIndustry.includes(kw))) {
      return CASES_BY_SEGMENT[segment] || [];
    }
  }

  // Retorna mix de cases se não encontrar segmento específico
  return [
    CASES_BY_SEGMENT["Serviços Financeiros"][0],
    CASES_BY_SEGMENT["Indústria"][0],
    CASES_BY_SEGMENT["Comércio e Varejo"][0],
  ];
}

const SYSTEM_PROMPT = `Você é um especialista em vendas consultivas B2B para soluções SAP, atuando para a Meta IT - consultoria com 35 anos de mercado.

SUA TAREFA: Criar um playbook de ligação COMPLETO e REALISTA para SDR.

REGRAS CRÍTICAS:
1. O SCRIPT DEVE SER LINEAR - um texto corrido natural, como se fosse um roteiro de teatro
2. NUNCA use marcadores ou bullets no script - tudo deve fluir como uma conversa
3. Inclua pausas naturais e transições suaves entre os blocos
4. Use os CASES DE SUCESSO fornecidos - cite empresas e resultados REAIS
5. Personalize com nome, cargo e empresa do lead
6. Tom consultivo, nunca agressivo

ESTRUTURA DO SCRIPT LINEAR:
- Começa com abertura natural
- Flui para contextualização (mostrando que você pesquisou)
- Transição suave para o valor
- Perguntas de discovery intercaladas
- Menção natural aos cases relevantes
- Fechamento orgânico

SOBRE A META IT:
- 35 anos de experiência em soluções SAP
- +120 clientes em +25 segmentos
- Especialistas em: Migração S/4HANA, AMS, Outsourcing, Reforma Tributária, SAP BTP

IMPORTANTE: 
- Os insights devem ser REAIS e relevantes (notícias do setor, tendências SAP, movimentos de mercado)
- Mencione as soluções da Meta IT de forma natural quando fizer sentido
- Use os cases de sucesso do segmento do lead`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const leadData = body.leadData;
    
    if (!leadData) {
      console.error("leadData não recebido. Body:", JSON.stringify(body));
      throw new Error("Dados do lead não fornecidos");
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Buscar cases relevantes para o segmento
    const relevantCases = findRelevantCases(leadData.industry || '');
    const casesText = relevantCases.map(c => 
      `• ${c.empresa}: ${c.resultado} (${c.contexto})`
    ).join('\n');

    console.log("Gerando playbook para:", leadData.name || "Lead", "-", leadData.company || "Empresa");
    console.log("Segmento identificado:", leadData.industry);
    console.log("Cases selecionados:", relevantCases.length);

    const userPrompt = `DADOS DO LEAD:
- Nome: ${leadData.name || 'Lead'}
- Cargo: ${leadData.role || 'Não identificado'}
- Empresa: ${leadData.company || 'Empresa'}
- Setor: ${leadData.industry || 'Não identificado'}
- Status SAP: ${leadData.sapStatus || 'Desconhecido'}
${leadData.priority ? `- Prioridade: ${leadData.priority}` : ''}
${leadData.publicSignals ? `- Sinais públicos: ${leadData.publicSignals}` : ''}
${leadData.leadSource ? `- Origem: ${leadData.leadSource}` : ''}

CASES DE SUCESSO RELEVANTES PARA O SEGMENTO (USE ESTES!):
${casesText}

---

Gere um playbook COMPLETO com:

1. INSIGHTS CHAVE (4-5): 
   - Notícias ou tendências REAIS do setor SAP
   - Movimentos de mercado relevantes para ${leadData.industry || 'o setor'}
   - Informações que um SDR poderia ter encontrado pesquisando o lead
   - Exemplo: "SAP anunciou fim de suporte ao ECC em 2027" ou "Setor ${leadData.industry} está acelerando digitalização pós-pandemia"

2. SCRIPT LINEAR COMPLETO:
   - Um texto ÚNICO e FLUIDO que o SDR vai seguir
   - Inclui abertura, contexto, valor, perguntas e fechamento
   - Menciona NATURALMENTE os cases de sucesso do segmento
   - Formato de diálogo teatral (não bullets!)

3. OBJEÇÕES E RESPOSTAS (3-4):
   - Objeções comuns com respostas prontas

4. DORES PROVÁVEIS (5-6):
   - Dores específicas do cargo e segmento

5. SOLUÇÕES META IT RELEVANTES (3-4):
   - Quais soluções se encaixam e por quê
   - Conecte com os cases de sucesso

6. CASES PARA CITAR (3):
   - Cases específicos para mencionar na ligação
   - Como introduzir cada case naturalmente`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_playbook",
              description: "Gera um playbook de ligação completo com script linear",
              parameters: {
                type: "object",
                properties: {
                  leadSummary: {
                    type: "string",
                    description: "Resumo de 1 linha sobre o lead e contexto",
                  },
                  keyInsights: {
                    type: "array",
                    items: { 
                      type: "object",
                      properties: {
                        insight: { type: "string", description: "O insight em si" },
                        source: { type: "string", description: "Fonte provável (ex: LinkedIn, notícias, SAP News)" },
                        relevance: { type: "string", description: "Por que é relevante para a abordagem" }
                      },
                      required: ["insight", "source", "relevance"]
                    },
                    description: "4-5 insights chave sobre o lead/empresa/setor",
                  },
                  linearScript: {
                    type: "string",
                    description: "Script COMPLETO e LINEAR da ligação - texto corrido como um roteiro de teatro, incluindo abertura, contexto, valor, discovery e fechamento. Deve fluir naturalmente como uma conversa real. Inclua pausas [pausa] e instruções [aguarde resposta] quando apropriado.",
                  },
                  objectionHandlers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        objection: { type: "string" },
                        response: { type: "string" },
                      },
                      required: ["objection", "response"],
                    },
                    description: "3-4 objeções comuns com respostas",
                  },
                  probablePains: {
                    type: "array",
                    items: { 
                      type: "object",
                      properties: {
                        pain: { type: "string", description: "A dor em si" },
                        impact: { type: "string", description: "Impacto no negócio" },
                        question: { type: "string", description: "Pergunta para validar essa dor" }
                      },
                      required: ["pain", "impact", "question"]
                    },
                    description: "5-6 dores prováveis do lead com impacto e pergunta de validação",
                  },
                  metaSolutions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        solution: { type: "string", description: "Nome da solução Meta IT" },
                        description: { type: "string", description: "Breve descrição" },
                        alignedPain: { type: "string", description: "Dor que resolve" },
                        howToMention: { type: "string", description: "Como mencionar naturalmente na call" },
                      },
                      required: ["solution", "description", "alignedPain", "howToMention"],
                    },
                    description: "3-4 soluções da Meta IT relevantes",
                  },
                  casesToCite: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        company: { type: "string", description: "Nome da empresa do case" },
                        result: { type: "string", description: "Resultado alcançado" },
                        howToIntroduce: { type: "string", description: "Frase para introduzir o case na conversa" },
                      },
                      required: ["company", "result", "howToIntroduce"],
                    },
                    description: "3 cases específicos para citar na ligação",
                  },
                },
                required: ["leadSummary", "keyInsights", "linearScript", "objectionHandlers", "probablePains", "metaSolutions", "casesToCite"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_playbook" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da API:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    console.log("Resposta da IA recebida");

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("Resposta inesperada:", JSON.stringify(data));
      throw new Error("Resposta da IA não contém playbook");
    }

    const playbook = JSON.parse(toolCall.function.arguments);
    console.log("Playbook gerado com sucesso para:", leadData.name);

    return new Response(
      JSON.stringify({ playbook }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro na edge function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
