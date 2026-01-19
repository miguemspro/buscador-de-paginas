import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Evidence {
  title: string;
  indication: string;
  link: string;
  source: string;
  date?: string;
  type?: 'sap' | 'tech';
}

interface LeadProfile {
  linkedinUrl?: string;
  background?: string;
  recentActivity?: string;
}

interface ResearchResult {
  evidences: Evidence[];
  sapEvidences: Evidence[];
  techEvidences: Evidence[];
  leadProfile: LeadProfile;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company, leadName, role, industry } = await req.json();

    if (!company) {
      return new Response(
        JSON.stringify({ error: 'company é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY não configurada');
      return new Response(
        JSON.stringify({ 
          evidences: [], 
          sapEvidences: [],
          techEvidences: [],
          leadProfile: {},
          error: 'API key não configurada' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Pesquisando informações para:', company, leadName);

    // Usar Responses API com web_search_preview para pesquisa real
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        tools: [{ type: 'web_search_preview' }],
        input: `Você é um pesquisador de inteligência de mercado B2B focado em SAP e tecnologia.

TAREFA: Pesquisar informações REAIS e ATUAIS sobre a empresa "${company}" ${leadName ? `e o profissional "${leadName}"` : ''}.
${industry ? `Setor: ${industry}` : ''}

BUSCAR NA WEB:
1. "${company}" SAP S/4HANA migração implementação projeto (últimos 3 anos)
2. "${company}" ERP transformação digital modernização sistemas
3. "${company}" vagas SAP TI sistemas tecnologia
4. "${company}" expansão fusão aquisição crescimento
5. "${company}" parceria tecnologia consultoria
${leadName ? `6. "${leadName}" "${company}" LinkedIn perfil` : ''}

IMPORTANTE:
- Use web search para encontrar informações REAIS e VERIFICÁVEIS
- Cada evidência DEVE ter uma URL real da fonte
- Classifique como 'sap' (relacionada a SAP/ERP) ou 'tech' (tecnologia geral)
- Se não encontrar informações reais, retorne arrays vazios - NÃO INVENTE

Retorne APENAS um JSON válido neste formato exato (sem markdown, sem explicações):
{"evidences":[{"title":"Título da notícia","indication":"O que isso indica para vendedor SAP","link":"https://url-real-da-fonte.com","source":"Nome da fonte","date":"2024-01","type":"sap"}],"leadProfile":{"linkedinUrl":null,"background":null,"recentActivity":null}}`
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API OpenAI:', response.status, errorText);

      return new Response(
        JSON.stringify({ evidences: [], sapEvidences: [], techEvidences: [], leadProfile: {} }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('Resposta OpenAI recebida:', JSON.stringify(result).substring(0, 500));

    // Extrair dados da resposta
    let researchData: ResearchResult = {
      evidences: [],
      sapEvidences: [],
      techEvidences: [],
      leadProfile: {}
    };

    // A Responses API retorna em formato diferente - buscar o texto da resposta
    let outputText = '';
    
    // Tentar extrair de diferentes estruturas possíveis da resposta
    if (result.output) {
      for (const output of result.output) {
        if (output.type === 'message' && output.content) {
          for (const content of output.content) {
            if (content.type === 'output_text' && content.text) {
              outputText = content.text;
              break;
            }
          }
        }
      }
    }
    
    console.log('Texto extraído:', outputText.substring(0, 500));

    try {
      // Tentar extrair JSON do texto (pode estar em markdown code block)
      let jsonStr = outputText;
      
      // Remover markdown code blocks se existirem
      const jsonMatch = outputText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      // Tentar encontrar o JSON diretamente
      const jsonStartIndex = jsonStr.indexOf('{');
      const jsonEndIndex = jsonStr.lastIndexOf('}');
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        jsonStr = jsonStr.substring(jsonStartIndex, jsonEndIndex + 1);
      }
      
      console.log('JSON a parsear:', jsonStr.substring(0, 300));
      
      const parsed = JSON.parse(jsonStr);
      const allEvidences = (parsed.evidences || []).filter((e: Evidence) => e.title && e.link);
      
      researchData = {
        evidences: allEvidences,
        sapEvidences: allEvidences.filter((e: Evidence) => e.type === 'sap'),
        techEvidences: allEvidences.filter((e: Evidence) => e.type === 'tech' || !e.type),
        leadProfile: parsed.leadProfile || {}
      };
    } catch (e) {
      console.error('Erro ao parsear JSON:', e, 'Texto:', outputText.substring(0, 200));
    }

    console.log(`Pesquisa concluída: ${researchData.evidences.length} evidências (${researchData.sapEvidences.length} SAP, ${researchData.techEvidences.length} tech)`);

    return new Response(
      JSON.stringify(researchData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função research-company:', error);
    return new Response(
      JSON.stringify({ 
        evidences: [], 
        sapEvidences: [],
        techEvidences: [],
        leadProfile: {},
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
