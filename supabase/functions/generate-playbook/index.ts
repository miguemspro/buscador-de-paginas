import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const META_IT_INFO = {
  nome: "Meta IT",
  anos_mercado: 35,
  descricao: "Consultoria especializada em soluções SAP e transformação digital",
  diferenciais: [
    "35 anos de experiência em transformação digital e soluções SAP",
    "Atendimento a mais de 120 clientes em 25+ segmentos",
    "Metodologia ágil com entregas incrementais",
    "Time com especialistas funcionais, técnicos e arquitetos certificados",
  ],
  solucoes: [
    "Migração SAP S/4HANA",
    "AMS (Application Management Services)",
    "Outsourcing de Especialistas SAP",
    "Adequação à Reforma Tributária",
    "SAP BTP e Integration Suite",
    "SAP Analytics Cloud",
  ],
};

const SYSTEM_PROMPT = `Você é um especialista em vendas consultivas B2B para soluções SAP, atuando para a Meta IT.

Sua tarefa é criar um PLAYBOOK DE LIGAÇÃO estruturado em cards step-by-step para um SDR.

REGRAS CRÍTICAS:
1. Linguagem natural e conversacional - como se estivesse realmente falando
2. Personalize tudo com os dados do lead - use nome, empresa, cargo
3. Nunca ofereça produto sem antes descobrir a dor
4. Tom consultivo, não de vendas agressivas
5. Cada passo deve ter frases PRONTAS PARA FALAR

SOBRE A META IT:
${JSON.stringify(META_IT_INFO, null, 2)}

Você DEVE retornar um JSON válido seguindo exatamente a estrutura da função.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    console.log("Gerando playbook para:", leadData.name, "-", leadData.company);

    const userPrompt = `DADOS DO LEAD:
- Nome: ${leadData.name || 'Lead'}
- Cargo: ${leadData.role || 'Não identificado'}
- Empresa: ${leadData.company || 'Empresa'}
- Setor: ${leadData.industry || 'Não identificado'}
- Status SAP: ${leadData.sapStatus || 'Desconhecido'}
${leadData.priority ? `- Prioridade: ${leadData.priority}` : ''}
${leadData.publicSignals ? `- Sinais públicos: ${leadData.publicSignals}` : ''}
${leadData.leadSource ? `- Origem: ${leadData.leadSource}` : ''}

---

Gere um playbook completo de ligação com:

1. OPENER (20 segundos): Frase de abertura natural, pedindo permissão para continuar
2. CONTEXT BRIDGE: Frase mostrando que você pesquisou sobre a pessoa/empresa
3. VALUE HOOK: Por que você está ligando - conectando aos sinais observados
4. DISCOVERY QUESTIONS: 4-5 perguntas de descoberta personalizadas
5. OBJECTION HANDLERS: 3-4 objeções comuns com respostas
6. CLOSE ATTEMPT: Frase para propor próximo passo

Também inclua:
- leadSummary: Resumo de 1 linha sobre o lead
- keyInsights: 4 insights sobre o lead/empresa
- probablePains: 5-6 dores prováveis baseadas no contexto
- metaSolutions: 4 soluções da Meta alinhadas às dores`;

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
              description: "Gera um playbook de ligação completo em formato de cards step-by-step",
              parameters: {
                type: "object",
                properties: {
                  leadSummary: {
                    type: "string",
                    description: "Resumo de 1 linha sobre o lead e contexto",
                  },
                  keyInsights: {
                    type: "array",
                    items: { type: "string" },
                    description: "4 insights chave sobre o lead/empresa",
                  },
                  callScript: {
                    type: "object",
                    properties: {
                      opener: {
                        type: "string",
                        description: "Frase de abertura pronta para falar (20 segundos)",
                      },
                      contextBridge: {
                        type: "string",
                        description: "Frase mostrando pesquisa sobre a pessoa",
                      },
                      valueHook: {
                        type: "string",
                        description: "Por que você está ligando - gancho de valor",
                      },
                      discoveryQuestions: {
                        type: "array",
                        items: { type: "string" },
                        description: "4-5 perguntas de discovery personalizadas",
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
                      closeAttempt: {
                        type: "string",
                        description: "Frase para propor próximo passo",
                      },
                    },
                    required: ["opener", "contextBridge", "valueHook", "discoveryQuestions", "objectionHandlers", "closeAttempt"],
                  },
                  probablePains: {
                    type: "array",
                    items: { type: "string" },
                    description: "5-6 dores prováveis do lead",
                  },
                  metaSolutions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        solution: { type: "string" },
                        alignedPain: { type: "string" },
                      },
                      required: ["solution", "alignedPain"],
                    },
                    description: "4 soluções da Meta alinhadas às dores",
                  },
                },
                required: ["leadSummary", "keyInsights", "callScript", "probablePains", "metaSolutions"],
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
