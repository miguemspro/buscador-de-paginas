import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// INTERFACES
// ============================================
interface Evidence {
  title: string;
  indication: string;
  link: string;
  source: string;
  date?: string;
  category: 'sap' | 'tech' | 'linkedin';
  relevanceScore?: number;
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
  linkedinEvidences: Evidence[];
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

// ============================================
// RELEVANCE VALIDATION
// ============================================
interface RelevanceCheck {
  mentionsCompany: boolean;
  isRelevantContent: boolean;
  isReliableSource: boolean;
  isRecent: boolean;
}

function calculateRelevanceScore(
  evidence: { title: string; indication: string; link: string; source: string; date?: string },
  company: string,
  category: 'sap' | 'tech' | 'linkedin'
): number {
  let score = 0;
  const companyLower = company.toLowerCase();
  const titleLower = evidence.title.toLowerCase();
  const indicationLower = evidence.indication.toLowerCase();
  
  // 1. Título menciona a empresa? (+30 pontos)
  if (titleLower.includes(companyLower) || indicationLower.includes(companyLower)) {
    score += 30;
  }
  
  // 2. Conteúdo relacionado à categoria? (+40 pontos)
  if (category === 'sap') {
    const sapKeywords = ['sap', 's/4hana', 's4hana', 'hana', 'erp', 'fiori', 'abap', 'basis', 'migração sap', 'projeto sap'];
    if (sapKeywords.some(kw => titleLower.includes(kw) || indicationLower.includes(kw))) {
      score += 40;
    }
  } else if (category === 'tech') {
    const techKeywords = ['cloud', 'aws', 'azure', 'gcp', 'transformação digital', 'data lake', 'integração', 'api', 'tecnologia', 'ti', 'infraestrutura'];
    // Excluir SAP para tech
    const hasSap = ['sap', 's/4hana', 's4hana'].some(kw => titleLower.includes(kw));
    if (!hasSap && techKeywords.some(kw => titleLower.includes(kw) || indicationLower.includes(kw))) {
      score += 40;
    }
  } else if (category === 'linkedin') {
    const linkedinKeywords = ['linkedin', 'publicação', 'post', 'compartilhou', 'anuncio', 'vaga'];
    if (linkedinKeywords.some(kw => titleLower.includes(kw) || indicationLower.includes(kw)) || 
        evidence.link.includes('linkedin.com')) {
      score += 40;
    }
  }
  
  // 3. Fonte confiável? (+20 pontos)
  const reliableSources = ['linkedin.com', 'sap.com', 'itforum.com.br', 'canaltech.com.br', 'valor.com.br', 'infomoney.com.br', 'exame.com', 'computerworld.com.br', 'wikipedia.org'];
  if (reliableSources.some(src => evidence.link.toLowerCase().includes(src) || evidence.source.toLowerCase().includes(src))) {
    score += 20;
  }
  
  // 4. Data recente (últimos 2 anos)? (+10 pontos)
  if (evidence.date) {
    const currentYear = new Date().getFullYear();
    const yearMatch = evidence.date.match(/20\d{2}/);
    if (yearMatch) {
      const evidenceYear = parseInt(yearMatch[0]);
      if (currentYear - evidenceYear <= 2) {
        score += 10;
      }
    }
  }
  
  return score;
}

function validateEvidence(
  evidence: { title: string; indication: string; link: string; source: string; date?: string },
  company: string,
  category: 'sap' | 'tech' | 'linkedin'
): { isValid: boolean; score: number } {
  const score = calculateRelevanceScore(evidence, company, category);
  return {
    isValid: score >= 60,
    score
  };
}

// ============================================
// OPENAI WEB SEARCH HELPER
// ============================================
async function performWebSearch(
  apiKey: string, 
  searchPrompt: string, 
  category: 'sap' | 'tech' | 'linkedin'
): Promise<{ evidences: Evidence[]; companyProfile?: CompanyProfile }> {
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        tools: [{ type: 'web_search_preview' }],
        input: searchPrompt
      }),
    });

    if (!response.ok) {
      console.error(`Erro na busca ${category}:`, response.status);
      return { evidences: [] };
    }

    const result = await response.json();
    let outputText = '';
    
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

    if (!outputText) {
      console.log(`Nenhum texto encontrado para ${category}`);
      return { evidences: [] };
    }

    // Parse JSON from response
    let jsonStr = outputText;
    const jsonMatch = outputText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    const jsonStartIndex = jsonStr.indexOf('{');
    const jsonEndIndex = jsonStr.lastIndexOf('}');
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
      jsonStr = jsonStr.substring(jsonStartIndex, jsonEndIndex + 1);
    }

    const parsed = JSON.parse(jsonStr);
    const evidences: Evidence[] = (parsed.evidences || [])
      .filter((e: any) => e.title && e.link)
      .map((e: any) => ({
        ...e,
        category
      }));

    return { 
      evidences,
      companyProfile: parsed.companyProfile 
    };
  } catch (error) {
    console.error(`Erro ao processar busca ${category}:`, error);
    return { evidences: [] };
  }
}

// ============================================
// MAIN HANDLER
// ============================================
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
          linkedinEvidences: [],
          leadProfile: {},
          companyProfile: defaultCompanyProfile,
          error: 'API key não configurada' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Pesquisando informações para:', company, leadName);

    // ============================================
    // BUSCA 1: PERFIL DA EMPRESA + SAP
    // ============================================
    const sapSearchPrompt = `Você é um pesquisador de inteligência de mercado B2B especializado em projetos SAP.

TAREFA: Pesquisar informações sobre a empresa "${company}" focando em:
1. PERFIL COMPLETO DA EMPRESA
2. PROJETOS E AMBIENTE SAP

BUSCAR NA WEB:

PARTE 1 - PERFIL DA EMPRESA (OBRIGATÓRIO):
- "${company}" sobre história fundação quem somos
- "${company}" site oficial 
- "${company}" Wikipedia
- "${company}" LinkedIn company page
- "${company}" clientes países mercados atuação
- "${company}" faturamento receita funcionários colaboradores
- "${company}" produtos serviços principais

PARTE 2 - AMBIENTE SAP (ESPECÍFICO):
- "${company}" SAP S/4HANA migração implementação projeto
- "${company}" SAP ECC sistema ERP
- "${company}" vagas SAP ABAP Fiori Basis consultoria
- "${company}" projeto SAP go-live
${industry ? `- "${company}" ${industry} SAP` : ''}

REGRAS CRÍTICAS:
- Para companyProfile.summary: escreva um parágrafo de 3-5 frases descrevendo a empresa
- APENAS inclua evidências SAP que mencionem EXPLICITAMENTE a empresa "${company}"
- Cada evidência DEVE ter URL real da fonte
- Se não encontrar informações SAP, retorne array vazio - NÃO INVENTE

Retorne APENAS JSON válido:
{
  "companyProfile": {
    "summary": "Parágrafo de 3-5 frases sobre a empresa",
    "founded": "Ano ou null",
    "headquarters": "Sede ou null",
    "employees": "Número ou null",
    "revenue": "Faturamento ou null",
    "markets": ["Lista"] ou null,
    "mainProducts": "Principais produtos/serviços ou null",
    "purpose": "Propósito/missão ou null"
  },
  "evidences": [
    {
      "title": "Título específico sobre SAP na empresa",
      "indication": "O que indica para vendedor SAP",
      "link": "https://url-real.com",
      "source": "Nome da fonte",
      "date": "2024-01"
    }
  ]
}`;

    // ============================================
    // BUSCA 2: TECNOLOGIA (EXCLUINDO SAP)
    // ============================================
    const techSearchPrompt = `Você é um pesquisador de inteligência de mercado focado em tecnologia e transformação digital.

TAREFA: Pesquisar sobre ambiente de TECNOLOGIA da empresa "${company}" - EXCLUINDO SAP.

BUSCAR NA WEB:
- "${company}" cloud AWS Azure Google Cloud migração
- "${company}" transformação digital projeto tecnologia
- "${company}" data lake big data analytics
- "${company}" integração API sistemas
- "${company}" TI infraestrutura modernização
- "${company}" CRM Salesforce Dynamics
${industry ? `- "${company}" ${industry} tecnologia inovação` : ''}

REGRAS CRÍTICAS:
- NÃO inclua nada relacionado a SAP, S/4HANA, ABAP, Fiori
- APENAS inclua evidências que mencionem EXPLICITAMENTE a empresa "${company}"
- Cada evidência DEVE ter URL real da fonte
- Se não encontrar, retorne array vazio - NÃO INVENTE

Retorne APENAS JSON válido:
{
  "evidences": [
    {
      "title": "Título sobre tecnologia (não SAP)",
      "indication": "O que indica sobre ambiente tecnológico",
      "link": "https://url-real.com",
      "source": "Nome da fonte",
      "date": "2024-01"
    }
  ]
}`;

    // ============================================
    // BUSCA 3: LINKEDIN (PUBLICAÇÕES SOBRE SAP)
    // ============================================
    const linkedinSearchPrompt = `Você é um pesquisador de inteligência de mercado focado em redes sociais profissionais.

TAREFA: Pesquisar publicações no LINKEDIN sobre a empresa "${company}" e SAP.

BUSCAR NA WEB:
- site:linkedin.com "${company}" SAP projeto
- site:linkedin.com "${company}" S/4HANA migração
- site:linkedin.com "${company}" SAP go-live
- site:linkedin.com "${company}" ERP implementação
${leadName ? `- site:linkedin.com "${leadName}" "${company}" SAP` : ''}
${leadName ? `- site:linkedin.com "${leadName}" perfil` : ''}

REGRAS CRÍTICAS:
- APENAS publicações/posts do LinkedIn
- APENAS conteúdo que mencione "${company}" E SAP/ERP
- Cada evidência DEVE ter URL do LinkedIn
- Se não encontrar, retorne array vazio - NÃO INVENTE

Retorne APENAS JSON válido:
{
  "evidences": [
    {
      "title": "Publicação sobre SAP na empresa",
      "indication": "O que indica sobre ambiente SAP",
      "link": "https://linkedin.com/...",
      "source": "LinkedIn",
      "date": "2024-01"
    }
  ],
  "leadProfile": {
    "linkedinUrl": "URL do perfil do lead ou null",
    "background": "Resumo do background profissional ou null",
    "recentActivity": "Atividade recente relevante ou null"
  }
}`;

    // Executar as 3 buscas em paralelo
    console.log('Iniciando 3 buscas em paralelo...');
    const [sapResult, techResult, linkedinResult] = await Promise.all([
      performWebSearch(OPENAI_API_KEY, sapSearchPrompt, 'sap'),
      performWebSearch(OPENAI_API_KEY, techSearchPrompt, 'tech'),
      performWebSearch(OPENAI_API_KEY, linkedinSearchPrompt, 'linkedin')
    ]);

    // Validar e filtrar evidências
    const validatedSapEvidences: Evidence[] = [];
    const validatedTechEvidences: Evidence[] = [];
    const validatedLinkedinEvidences: Evidence[] = [];

    // Validar SAP
    for (const evidence of sapResult.evidences) {
      const validation = validateEvidence(evidence, company, 'sap');
      if (validation.isValid) {
        validatedSapEvidences.push({
          ...evidence,
          relevanceScore: validation.score
        });
      } else {
        console.log(`SAP descartado (score ${validation.score}): ${evidence.title.substring(0, 50)}`);
      }
    }

    // Validar Tech
    for (const evidence of techResult.evidences) {
      const validation = validateEvidence(evidence, company, 'tech');
      if (validation.isValid) {
        validatedTechEvidences.push({
          ...evidence,
          relevanceScore: validation.score
        });
      } else {
        console.log(`Tech descartado (score ${validation.score}): ${evidence.title.substring(0, 50)}`);
      }
    }

    // Validar LinkedIn
    for (const evidence of linkedinResult.evidences) {
      const validation = validateEvidence(evidence, company, 'linkedin');
      if (validation.isValid) {
        validatedLinkedinEvidences.push({
          ...evidence,
          relevanceScore: validation.score
        });
      } else {
        console.log(`LinkedIn descartado (score ${validation.score}): ${evidence.title.substring(0, 50)}`);
      }
    }

    // Company profile vem da busca SAP
    const companyProfile: CompanyProfile = sapResult.companyProfile || defaultCompanyProfile;

    // Lead profile vem da busca LinkedIn
    const leadProfile: LeadProfile = (linkedinResult as any).leadProfile || {};

    // Combinar todas as evidências validadas
    const allEvidences = [
      ...validatedSapEvidences,
      ...validatedTechEvidences,
      ...validatedLinkedinEvidences
    ];

    const researchData: ResearchResult = {
      evidences: allEvidences,
      sapEvidences: validatedSapEvidences,
      techEvidences: validatedTechEvidences,
      linkedinEvidences: validatedLinkedinEvidences,
      leadProfile,
      companyProfile
    };

    console.log(`Pesquisa concluída:
      - SAP: ${validatedSapEvidences.length} evidências validadas
      - Tech: ${validatedTechEvidences.length} evidências validadas  
      - LinkedIn: ${validatedLinkedinEvidences.length} evidências validadas
      - Total: ${allEvidences.length} evidências
      - CompanyProfile: ${companyProfile.summary ? 'OK' : 'Vazio'}`);

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
        linkedinEvidences: [],
        leadProfile: {},
        companyProfile: defaultCompanyProfile,
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
