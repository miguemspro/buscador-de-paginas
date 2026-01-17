import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Prompt para pesquisa de informações reais
const RESEARCH_PROMPT = `Você é um pesquisador especializado em inteligência de mercado B2B.

Sua tarefa é buscar informações REAIS e VERIFICÁVEIS sobre uma empresa e um lead usando web search.

REGRAS CRÍTICAS:
1. Busque APENAS informações reais que você pode verificar via web search
2. Cada evidência DEVE ter uma URL real e funcional
3. Priorize: notícias recentes, comunicados, vagas, posts LinkedIn
4. Se não encontrar informações verificáveis, retorne arrays vazios
5. NÃO invente nenhuma informação - é melhor retornar vazio do que inventar

CATEGORIAS DE BUSCA:
- Notícias e comunicados da empresa (últimos 12 meses)
- Perfil LinkedIn do lead (se público)
- Vagas abertas na empresa (indicam expansão/projetos)
- Posts da empresa no LinkedIn
- Projetos de TI/transformação digital mencionados

FORMATO DE RESPOSTA (via tool call):
- evidences: Lista de evidências com título, indicação, link real, fonte e data
- leadProfile: Informações do perfil LinkedIn do lead (se encontrado)`;

interface Evidence {
  title: string;
  indication: string;
  link: string;
  source: string;
  date?: string;
}

interface LeadProfile {
  linkedinUrl?: string;
  background?: string;
  recentActivity?: string;
}

interface ResearchResult {
  evidences: Evidence[];
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
          leadProfile: {},
          error: 'API key não configurada' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPrompt = `Pesquise informações REAIS e VERIFICÁVEIS sobre:

EMPRESA: ${company}
LEAD: ${leadName || 'Não informado'} - ${role || 'Cargo não informado'}
SETOR: ${industry || 'Não informado'}

TAREFAS DE PESQUISA:
1. Busque notícias recentes sobre "${company}" (últimos 12 meses)
2. Procure o perfil LinkedIn de "${leadName}" na "${company}"
3. Verifique vagas abertas em "${company}" relacionadas a TI/SAP
4. Busque posts da "${company}" no LinkedIn sobre projetos/transformação
5. Procure comunicados de imprensa da "${company}"

IMPORTANTE:
- Cada evidência deve ter URL real e verificável
- Indique a data aproximada de cada informação
- Se não encontrar algo, não invente - retorne array vazio
- Foque em informações relevantes para um vendedor B2B de soluções SAP

Retorne as informações usando a função return_research_data.`;

    console.log('Pesquisando informações para:', company, leadName);

    // GPT com Chat Completions API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: RESEARCH_PROMPT
          },
          {
            role: 'user',
            content: `${userPrompt}

Retorne APENAS um JSON válido com a seguinte estrutura:
{
  "evidences": [
    {
      "title": "Título da notícia/informação",
      "indication": "O que isso indica para um SDR",
      "link": "URL real da fonte",
      "source": "Nome da fonte",
      "date": "Data aproximada"
    }
  ],
  "leadProfile": {
    "linkedinUrl": null,
    "background": null,
    "recentActivity": null
  }
}

Se não encontrar informações verificáveis, retorne:
{
  "evidences": [],
  "leadProfile": {}
}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API OpenAI:', response.status, errorText);

      return new Response(
        JSON.stringify({ evidences: [], leadProfile: {} }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('Resposta OpenAI recebida');

    // Extrair dados da resposta
    let researchData: ResearchResult = {
      evidences: [],
      leadProfile: {}
    };

    const content = result.choices?.[0]?.message?.content || '{}';

    try {
      const parsed = JSON.parse(content);
      researchData = {
        evidences: (parsed.evidences || []).filter((e: Evidence) => e.title && e.link),
        leadProfile: parsed.leadProfile || {}
      };
    } catch (e) {
      console.error('Erro ao parsear JSON:', e);
    }

    console.log(`Pesquisa concluída: ${researchData.evidences.length} evidências encontradas`);

    return new Response(
      JSON.stringify(researchData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função research-company:', error);
    return new Response(
      JSON.stringify({ 
        evidences: [], 
        leadProfile: {},
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
