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

    // GPT com web search via responses API
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-search-preview',
        tools: [{ type: 'web_search_preview' }],
        input: `${RESEARCH_PROMPT}\n\n${userPrompt}\n\nRetorne os resultados em formato JSON com a seguinte estrutura:
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
    "linkedinUrl": "URL do LinkedIn se encontrado",
    "background": "Histórico profissional",
    "recentActivity": "Atividade recente"
  }
}`
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API OpenAI responses:', response.status, errorText);
      
      return new Response(
        JSON.stringify({ evidences: [], leadProfile: {} }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('Resposta OpenAI responses recebida');

    // Extrair dados da resposta
    let researchData: ResearchResult = {
      evidences: [],
      leadProfile: {}
    };

    // A API responses retorna output_text ou output
    const outputText = result.output_text || '';
    
    if (outputText) {
      console.log('Processando output_text...');
      // Tentar extrair JSON da resposta
      try {
        // Procurar por blocos JSON na resposta
        const jsonMatch = outputText.match(/```json\s*([\s\S]*?)\s*```/) || 
                          outputText.match(/\{[\s\S]*"evidences"[\s\S]*\}/);
        
        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          const parsed = JSON.parse(jsonStr);
          researchData = {
            evidences: (parsed.evidences || []).filter((e: Evidence) => e.title && e.link),
            leadProfile: parsed.leadProfile || {}
          };
        }
      } catch (e) {
        console.error('Erro ao parsear JSON:', e);
        // Se falhar o parse, tentar extrair links mencionados no texto
        const urlMatches = outputText.match(/https?:\/\/[^\s"<>]+/g) || [];
        if (urlMatches.length > 0) {
          // Criar evidências básicas dos URLs encontrados
          researchData.evidences = urlMatches.slice(0, 5).map((url: string, i: number) => ({
            title: `Fonte encontrada ${i + 1}`,
            indication: 'Verificar manualmente o conteúdo',
            link: url,
            source: new URL(url).hostname,
            date: 'Recente'
          }));
        }
      }
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
