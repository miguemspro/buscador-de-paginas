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

interface CompanyProfile {
  summary: string;
  founded?: string;
  headquarters?: string;
  employees?: string;
  revenue?: string;
  markets?: string[];
  mainProducts?: string;
  purpose?: string;
}

interface ResearchResult {
  evidences: Evidence[];
  sapEvidences: Evidence[];
  techEvidences: Evidence[];
  leadProfile: LeadProfile;
  companyProfile: CompanyProfile;
}

const defaultCompanyProfile: CompanyProfile = {
  summary: '',
  founded: undefined,
  headquarters: undefined,
  employees: undefined,
  revenue: undefined,
  markets: undefined,
  mainProducts: undefined,
  purpose: undefined
};

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
          companyProfile: defaultCompanyProfile,
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
        input: `Você é um pesquisador de inteligência de mercado B2B.

TAREFA: Pesquisar informações REAIS sobre a empresa "${company}" ${leadName ? `e o profissional "${leadName}"` : ''}.
${industry ? `Setor: ${industry}` : ''}

BUSCAR NA WEB (em ordem de prioridade):

PARTE 1 - PERFIL DA EMPRESA (OBRIGATÓRIO):
- "${company}" sobre história fundação quem somos
- "${company}" site oficial 
- "${company}" Wikipedia
- "${company}" LinkedIn company page
- "${company}" clientes países mercados atuação
- "${company}" faturamento receita funcionários colaboradores
- "${company}" produtos serviços principais

PARTE 2 - NOTÍCIAS E SINAIS SAP/TECH:
- "${company}" SAP S/4HANA migração implementação projeto
- "${company}" ERP transformação digital
- "${company}" vagas SAP TI sistemas
- "${company}" expansão fusão aquisição
${leadName ? `- "${leadName}" "${company}" LinkedIn` : ''}

IMPORTANTE:
- Use web search para encontrar informações REAIS e VERIFICÁVEIS
- Para companyProfile.summary: escreva um parágrafo de 3-5 frases descrevendo a empresa (história, core business, números, propósito)
- Cada evidência DEVE ter uma URL real da fonte
- Se não encontrar informações, retorne valores vazios - NÃO INVENTE

Retorne APENAS um JSON válido neste formato exato (sem markdown, sem explicações):
{
  "companyProfile": {
    "summary": "Parágrafo de 3-5 frases sobre a empresa: o que faz, tempo de mercado, números importantes (clientes, países, funcionários), propósito ou diferencial",
    "founded": "Ano de fundação ou null",
    "headquarters": "Sede ou null",
    "employees": "Número de funcionários ou null",
    "revenue": "Faturamento ou null",
    "markets": ["Lista", "de", "mercados"] ou null,
    "mainProducts": "Principais produtos/serviços ou null",
    "purpose": "Propósito/missão ou null"
  },
  "evidences": [
    {
      "title": "Título da notícia",
      "indication": "O que isso indica para vendedor SAP",
      "link": "https://url-real-da-fonte.com",
      "source": "Nome da fonte",
      "date": "2024-01",
      "type": "sap"
    }
  ],
  "leadProfile": {
    "linkedinUrl": null,
    "background": null,
    "recentActivity": null
  }
}`
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API OpenAI:', response.status, errorText);

      return new Response(
        JSON.stringify({ 
          evidences: [], 
          sapEvidences: [], 
          techEvidences: [], 
          leadProfile: {},
          companyProfile: defaultCompanyProfile
        }),
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
      leadProfile: {},
      companyProfile: { ...defaultCompanyProfile }
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
      
      // Extrair company profile
      const companyProfile: CompanyProfile = {
        summary: parsed.companyProfile?.summary || '',
        founded: parsed.companyProfile?.founded || undefined,
        headquarters: parsed.companyProfile?.headquarters || undefined,
        employees: parsed.companyProfile?.employees || undefined,
        revenue: parsed.companyProfile?.revenue || undefined,
        markets: parsed.companyProfile?.markets || undefined,
        mainProducts: parsed.companyProfile?.mainProducts || undefined,
        purpose: parsed.companyProfile?.purpose || undefined
      };
      
      researchData = {
        evidences: allEvidences,
        sapEvidences: allEvidences.filter((e: Evidence) => e.type === 'sap'),
        techEvidences: allEvidences.filter((e: Evidence) => e.type === 'tech' || !e.type),
        leadProfile: parsed.leadProfile || {},
        companyProfile
      };
      
      console.log('CompanyProfile summary:', companyProfile.summary?.substring(0, 100));
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
        companyProfile: defaultCompanyProfile,
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
