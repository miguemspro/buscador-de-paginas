import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const LeadInfoSchema = z.object({
  name: z.string().max(200).optional(),
  role: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  linkedinUrl: z.string().max(500).optional(),
  email: z.string().max(320).optional(),
  phone: z.string().max(50).optional(),
  sapStatus: z.string().max(50).optional(),
  sapVersion: z.string().max(50).optional(),
  priority: z.string().max(50).optional(),
  industry: z.string().max(100).optional(),
  companySize: z.string().max(50).optional(),
  challenges: z.array(z.string().max(500)).max(20).optional(),
  publicSignals: z.string().max(10000).optional(),
  notes: z.string().max(5000).optional(),
  leadSource: z.string().max(200).optional()
});

const RequestSchema = z.object({
  leadInfo: LeadInfoSchema,
  regenerateSection: z.string().max(50).optional(),
  currentAnalysis: z.any().optional()
});

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

const META_IT_INFO = {
  nome: "Meta IT",
  anos_mercado: 35,
  descricao: "Empresa especializada em soluções SAP e transformação digital",
  diferenciais: [
    "35 anos de experiência em transformação digital e soluções SAP",
    "Operação robusta de outsourcing com consultores especializados",
    "Atendimento a mais de 120 clientes em 25+ segmentos diferentes",
    "Metodologia ágil com entregas incrementais",
    "Time com especialistas funcionais, técnicos e arquitetos certificados",
    "Expertise em todo o ciclo SAP: AMS, migração, upgrade, rollouts e melhorias",
  ],
  solucoes: [
    "Migração SAP S/4HANA",
    "AMS (Application Management Services)",
    "Outsourcing de Especialistas SAP",
    "Adequação à Reforma Tributária",
    "Rollouts e Implementações",
    "SAP BTP e Integration Suite",
    "SAP Analytics Cloud",
    "SAP GRC (Governance, Risk, Compliance)",
    "Staff Augmentation",
    "DRC (Data Retention and Compliance)",
  ],
};

const SYSTEM_PROMPT = `Você é um SDR sênior especializado em SAP, atuando para a Meta IT (consultoria). 
Sua tarefa é, a partir das informações do lead, gerar uma análise completa e um texto de abordagem consultiva.

INSTRUÇÕES IMPORTANTES:
- Responda em português (Brasil).
- Não invente fatos. Se não houver confirmação, use "vi sinais públicos de..." ou transforme em pergunta.
- Não ofereça produto antes de descobrir o problema. O texto final deve deixar isso explícito.
- Use linguagem consultiva e objetiva. Evite marketing exagerado.
- Objetivo final: gerar um texto pronto para abordagem e perguntas para discovery.

SOBRE A META IT:
${JSON.stringify(META_IT_INFO, null, 2)}

Você DEVE retornar um JSON válido com a estrutura exata especificada na função.`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
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
        JSON.stringify({ error: 'Autenticação necessária. Faça login para continuar.' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    
    // Input validation
    const parseResult = RequestSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: parseResult.error.errors[0]?.message || 'Dados inválidos' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { leadInfo, regenerateSection, currentAnalysis } = parseResult.data;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY missing");
      return new Response(
        JSON.stringify({ error: 'Erro de configuração do serviço' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Gerando análise para lead:", leadInfo.name, "-", leadInfo.company);

    const userPrompt = buildUserPrompt(leadInfo, regenerateSection);
    
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
              name: "generate_lead_analysis",
              description: "Gera uma análise completa do lead com todas as seções necessárias",
              parameters: {
                type: "object",
                properties: {
                  resumoExecutivo: {
                    type: "object",
                    properties: {
                      bullets: {
                        type: "array",
                        items: { type: "string" },
                        description: "5 bullets: empresa, lead, hipóteses, ângulo de abordagem",
                      },
                    },
                    required: ["bullets"],
                  },
                  evidenciasSinais: {
                    type: "object",
                    properties: {
                      items: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            sinal: { type: "string", description: "O sinal ou evidência observada" },
                            indicacao: { type: "string", description: "O que esse sinal indica" },
                            fonte: { type: "string", description: "Fonte da informação (opcional)" },
                          },
                          required: ["sinal", "indicacao"],
                        },
                        description: "6-10 itens de evidências e sinais públicos",
                      },
                    },
                    required: ["items"],
                  },
                  doresProvaveis: {
                    type: "array",
                    items: { type: "string" },
                    description: "10 dores prováveis baseadas no segmento e contexto",
                  },
                  solucoesMeta: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        solucao: { type: "string", description: "Solução SAP/Meta IT" },
                        dorAlinhada: { type: "string", description: "Dor que essa solução resolve" },
                      },
                      required: ["solucao", "dorAlinhada"],
                    },
                    description: "10 soluções da Meta alinhadas às dores",
                  },
                  perguntasDiscovery: {
                    type: "object",
                    properties: {
                      faseProjetosPrioridades: {
                        type: "array",
                        items: { type: "string" },
                        description: "4 perguntas sobre fase/projetos e prioridades 2026",
                      },
                      operacaoIntegracoes: {
                        type: "array",
                        items: { type: "string" },
                        description: "4 perguntas sobre operação/integrações/estabilidade",
                      },
                      qualificacao: {
                        type: "array",
                        items: { type: "string" },
                        description: "4 perguntas sobre janela crítica, stakeholders, capacidade, governança",
                      },
                    },
                    required: ["faseProjetosPrioridades", "operacaoIntegracoes", "qualificacao"],
                  },
                  textoAbordagem: {
                    type: "string",
                    description: "Texto completo de abordagem seguindo a estrutura consultiva",
                  },
                },
                required: [
                  "resumoExecutivo",
                  "evidenciasSinais",
                  "doresProvaveis",
                  "solucoesMeta",
                  "perguntasDiscovery",
                  "textoAbordagem",
                ],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_lead_analysis" } },
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
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    console.log("Resposta da IA recebida");

    // Extract the tool call arguments
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("Resposta inesperada:", JSON.stringify(data));
      throw new Error("Resposta da IA não contém análise");
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    
    // Se for regeneração parcial, mesclar com análise atual
    let finalAnalysis = analysis;
    if (regenerateSection && currentAnalysis) {
      finalAnalysis = { ...currentAnalysis };
      switch (regenerateSection) {
        case "resumo":
          finalAnalysis.resumoExecutivo = analysis.resumoExecutivo;
          break;
        case "evidencias":
          finalAnalysis.evidenciasSinais = analysis.evidenciasSinais;
          break;
        case "dores":
          finalAnalysis.doresProvaveis = analysis.doresProvaveis;
          break;
        case "solucoes":
          finalAnalysis.solucoesMeta = analysis.solucoesMeta;
          break;
        case "discovery":
          finalAnalysis.perguntasDiscovery = analysis.perguntasDiscovery;
          break;
        case "abordagem":
          finalAnalysis.textoAbordagem = analysis.textoAbordagem;
          break;
      }
    }

    console.log("Análise gerada com sucesso para:", leadInfo.name);

    return new Response(
      JSON.stringify({ analysis: finalAnalysis }),
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

function buildUserPrompt(leadInfo: any, regenerateSection?: string): string {
  const sapStatusMap: Record<string, string> = {
    sap_services: "SAP Services",
    sap_ecc: "SAP ECC",
    s4hana: "S/4HANA",
    business_one: "Business One",
    no_sap: "Não usa SAP",
    unknown: "Status SAP desconhecido",
  };

  const companySizeMap: Record<string, string> = {
    small: "Pequena empresa",
    medium: "Média empresa",
    large: "Grande empresa",
    enterprise: "Enterprise",
  };

  let prompt = `DADOS DO LEAD:
- Nome: ${leadInfo.name}
- Cargo: ${leadInfo.role}
- Empresa: ${leadInfo.company}
${leadInfo.linkedinUrl ? `- LinkedIn: ${leadInfo.linkedinUrl}` : ""}
${leadInfo.email ? `- Email: ${leadInfo.email}` : ""}
${leadInfo.phone ? `- Telefone: ${leadInfo.phone} (não incluir no texto, apenas contexto)` : ""}

CONTEXTO SAP:
- Status atual: ${sapStatusMap[leadInfo.sapStatus] || leadInfo.sapStatus}
${leadInfo.sapVersion ? `- Versão: ${leadInfo.sapVersion}` : ""}
${leadInfo.priority ? `- Prioridade identificada: ${leadInfo.priority}` : ""}

CONTEXTO DA EMPRESA:
- Setor: ${leadInfo.industry}
- Porte: ${companySizeMap[leadInfo.companySize] || leadInfo.companySize}
${leadInfo.challenges && leadInfo.challenges.length > 0 ? `- Desafios percebidos: ${leadInfo.challenges.join(", ")}` : ""}

${leadInfo.publicSignals ? `SINAIS PÚBLICOS OBSERVADOS:\n${leadInfo.publicSignals}` : ""}

${leadInfo.notes ? `OBSERVAÇÕES DO SDR:\n${leadInfo.notes}` : ""}

${leadInfo.leadSource ? `ORIGEM DO LEAD: ${leadInfo.leadSource}` : ""}

---

ESTRUTURA DO TEXTO DE ABORDAGEM:
O texto de abordagem DEVE seguir esta estrutura exata:

"Oi, [NOME], tudo bem? Aqui é o Miguel, da Meta.

Eu sei que peguei você de surpresa nessa [DIA/PERÍODO], mas preciso de 20 segundos para explicar o motivo do meu contato e, se fizer sentido para você, a gente continua conversando. Pode ser?

Maravilha, vamos lá.

Eu vi que você está como [CARGO] na [EMPRESA] e que temas como [TEMAS ALINHADOS AO PERFIL] são importantes para você.

Também vi [SINAL PÚBLICO RELEVANTE], então minha ligação é para entender em que momento vocês estão em relação ao SAP e o que entra como prioridade para 2026.

Eu não quero te apresentar solução sem entender primeiro onde está o problema.

Então, se me permite, eu queria te fazer duas perguntas rápidas:

1. Qual é o principal objetivo do seu roadmap SAP para 2026: [OPÇÕES COERENTES COM O CONTEXTO]?
2. E onde você enxerga o maior risco hoje: [RISCO A], [RISCO B], ou [RISCO C]?

Eu quero ouvir suas ideias e entender o cenário. Se eu enxergar sinergia com o que a Meta faz, aí sim a gente marca uma conversa mais a fundo. Se não fizer sentido, eu encerro por aqui."

---

${regenerateSection ? `ATENÇÃO: Regenere APENAS a seção "${regenerateSection}". Mantenha consistência com o contexto.` : "Gere a análise completa com todas as 6 seções."}`;

  return prompt;
}
