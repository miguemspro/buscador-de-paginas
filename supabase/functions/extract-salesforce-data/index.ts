import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    console.log("Extraindo dados do print do Salesforce...");

    // Função para fazer a chamada com retry
    const callAIWithRetry = async (maxRetries = 3): Promise<Response> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `Analise este print do Salesforce e extraia TODOS os dados do lead visíveis.

Retorne um JSON com esta estrutura exata:
{
  "name": "Nome completo do lead",
  "role": "Cargo do lead",
  "company": "Nome da empresa",
  "email": "Email se visível",
  "phone": "Telefone se visível",
  "linkedinUrl": "URL do LinkedIn se visível",
  "sapStatus": "sap_services" | "sap_ecc" | "s4hana" | "business_one" | "no_sap" | "unknown",
  "priority": "Prioridade se visível",
  "industry": "Setor da empresa (infira baseado no nome da empresa se não estiver explícito)",
  "companySize": "small" | "medium" | "large" | "enterprise" (infira baseado na empresa),
  "publicSignals": "Qualquer informação adicional relevante visível no print",
  "leadSource": "Origem do lead se visível",
  "leadOwner": "Proprietário do lead se visível"
}

IMPORTANTE:
- Extraia EXATAMENTE o que está escrito, não invente dados
- Se um campo não estiver visível, use null
- Para sapStatus, procure por campos como "Ritmo atual", "SAP Status", etc.
- Infira industry e companySize baseado no nome da empresa se necessário
- Retorne APENAS o JSON, sem markdown ou explicação`
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: imageBase64
                      }
                    }
                  ]
                }
              ],
              max_tokens: 1000,
            }),
          });

          // Se sucesso, retorna
          if (response.ok) {
            return response;
          }

          // Erros específicos que não devem retry
          if (response.status === 429) {
            throw { status: 429, message: "Limite de requisições excedido. Tente novamente em alguns segundos." };
          }
          if (response.status === 402) {
            throw { status: 402, message: "Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage." };
          }

          // Para erros 5xx, fazer retry
          if (response.status >= 500 && attempt < maxRetries) {
            const errorText = await response.text();
            console.warn(`Tentativa ${attempt}/${maxRetries} falhou (${response.status}). Tentando novamente...`);
            await new Promise(r => setTimeout(r, 1000 * attempt)); // Backoff exponencial
            continue;
          }

          // Última tentativa falhou
          const errorText = await response.text();
          console.error("Erro da API após retries:", response.status, errorText);
          throw new Error(`Erro na API após ${maxRetries} tentativas: ${response.status}`);
          
        } catch (fetchError) {
          // Erro de rede - fazer retry
          if (attempt < maxRetries && !(fetchError as any).status) {
            console.warn(`Tentativa ${attempt}/${maxRetries} - erro de rede. Tentando novamente...`);
            await new Promise(r => setTimeout(r, 1000 * attempt));
            continue;
          }
          throw fetchError;
        }
      }
      throw new Error("Falha após todas as tentativas");
    };

    let response;
    try {
      response = await callAIWithRetry(3);
    } catch (err: any) {
      if (err.status === 429) {
        return new Response(
          JSON.stringify({ error: err.message }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (err.status === 402) {
        return new Response(
          JSON.stringify({ error: err.message }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw err;
    }


    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    console.log("Conteúdo extraído:", content);

    // Parse JSON from response (remove markdown if present)
    let extractedData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON não encontrado na resposta");
      }
    } catch (parseError) {
      console.error("Erro ao parsear JSON:", parseError);
      throw new Error("Falha ao extrair dados do print");
    }

    // Map sapStatus from text
    if (extractedData.sapStatus) {
      const sapMap: Record<string, string> = {
        "sap services": "sap_services",
        "sap ecc": "sap_ecc",
        "s/4hana": "s4hana",
        "s4hana": "s4hana",
        "business one": "business_one",
      };
      const normalized = extractedData.sapStatus.toLowerCase();
      extractedData.sapStatus = sapMap[normalized] || extractedData.sapStatus;
    }

    console.log("Dados extraídos com sucesso:", extractedData.name);

    return new Response(
      JSON.stringify({ leadInfo: extractedData }),
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
