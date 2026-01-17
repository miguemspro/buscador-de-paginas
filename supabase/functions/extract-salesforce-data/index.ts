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
    
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY não configurada");
    }

    console.log("Extraindo dados do print do Salesforce...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da API:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Erro na API: ${response.status}`);
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
