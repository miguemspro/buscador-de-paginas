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

TAREFA: Pesquisar informações REAIS sobre a empresa "${company}" ${leadName ? `e o profissional "${leadName}"` : ''}.

BUSCAR:
1. Notícias recentes sobre "${company}" e SAP, ERP ou S/4HANA (últimos 12 meses)
2. Projetos de transformação digital ou modernização de sistemas em "${company}"
3. Vagas abertas em "${company}" para SAP, TI, ou sistemas
4. Expansão, fusões, aquisições ou crescimento de "${company}"
${leadName ? `5. Perfil LinkedIn de "${leadName}" em "${company}"` : ''}

IMPORTANTE:
- Use web search para encontrar informações REAIS
- Cada evidência deve ter URL real e verificável
- Classifique cada evidência como tipo 'sap' (relacionada a SAP/ERP) ou 'tech' (tecnologia geral)
- Se não encontrar, retorne arrays vazios - não invente

FORMATO DE RESPOSTA (JSON):
{
  "evidences": [
    {
      "title": "Título da notícia/informação",
      "indication": "O que isso indica para um vendedor SAP",
      "link": "URL real da fonte",
      "source": "Nome da fonte",
      "date": "Data (se disponível)",
      "type": "sap" ou "tech"
    }
  ],
  "leadProfile": {
    "linkedinUrl": "URL do LinkedIn (se encontrado)" ou null,
    "background": "Resumo do perfil" ou null,
    "recentActivity": "Atividade recente" ou null
  }
}`,
        text: { format: { type: 'json_object' } }
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
    console.log('Resposta OpenAI recebida');

    // Extrair dados da resposta
    let researchData: ResearchResult = {
      evidences: [],
      sapEvidences: [],
      techEvidences: [],
      leadProfile: {}
    };

    // A Responses API retorna em formato diferente
    const outputText = result.output?.find((o: { type: string }) => o.type === 'message')?.content?.find((c: { type: string }) => c.type === 'output_text')?.text || '{}';

    try {
      const parsed = JSON.parse(outputText);
      const allEvidences = (parsed.evidences || []).filter((e: Evidence) => e.title && e.link);
      
      researchData = {
        evidences: allEvidences,
        sapEvidences: allEvidences.filter((e: Evidence) => e.type === 'sap'),
        techEvidences: allEvidences.filter((e: Evidence) => e.type === 'tech' || !e.type),
        leadProfile: parsed.leadProfile || {}
      };
    } catch (e) {
      console.error('Erro ao parsear JSON:', e);
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
