import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// INTERFACES
// ============================================
interface UrlCitation {
  type: 'url_citation';
  start_index: number;
  end_index: number;
  url: string;
  title: string;
}

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
// URL HELPERS
// ============================================
function extractSourceFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('linkedin')) return 'LinkedIn';
    if (hostname.includes('sap.com')) return 'SAP';
    if (hostname.includes('itforum')) return 'IT Forum';
    if (hostname.includes('canaltech')) return 'Canaltech';
    if (hostname.includes('valor')) return 'Valor Econômico';
    if (hostname.includes('infomoney')) return 'InfoMoney';
    if (hostname.includes('exame')) return 'Exame';
    if (hostname.includes('computerworld')) return 'ComputerWorld';
    if (hostname.includes('wikipedia')) return 'Wikipedia';
    if (hostname.includes('reuters')) return 'Reuters';
    if (hostname.includes('forbes')) return 'Forbes';
    if (hostname.includes('bloomberg')) return 'Bloomberg';
    return hostname.replace('www.', '').split('.')[0];
  } catch {
    return 'Web';
  }
}

function extractIndicationFromContext(fullText: string, annotation: UrlCitation, category: 'sap' | 'tech' | 'linkedin'): string {
  // Extrair o contexto ao redor da citação
  const start = Math.max(0, annotation.start_index - 150);
  const end = Math.min(fullText.length, annotation.end_index + 150);
  let context = fullText.substring(start, end).trim();
  
  // Limpar e formatar
  context = context.replace(/\[\d+\]/g, '').trim();
  
  // Se muito longo, truncar
  if (context.length > 200) {
    context = context.substring(0, 200) + '...';
  }
  
  // Fallback baseado em categoria
  if (!context || context.length < 20) {
    switch (category) {
      case 'sap': return 'Informação relevante sobre ambiente SAP da empresa';
      case 'tech': return 'Informação sobre tecnologia e infraestrutura';
      case 'linkedin': return 'Publicação profissional sobre a empresa';
    }
  }
  
  return context;
}

function extractDateFromUrl(url: string): string | undefined {
  // Tentar extrair data de padrões comuns em URLs
  const patterns = [
    /\/(\d{4})\/(\d{2})\//,           // /2024/01/
    /\/(\d{4})-(\d{2})-\d{2}\//,      // /2024-01-15/
    /-(\d{4})(\d{2})\d{2}/,           // -20240115
    /(\d{4})(\d{2})\d{2}/,            // 20240115
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
  }
  
  return undefined;
}

// ============================================
// RELEVANCE VALIDATION
// ============================================
function calculateRelevanceScore(
  evidence: { title: string; indication: string; link: string; source: string; date?: string },
  company: string,
  category: 'sap' | 'tech' | 'linkedin'
): number {
  let score = 0;
  const companyLower = company.toLowerCase();
  const titleLower = evidence.title.toLowerCase();
  const indicationLower = evidence.indication.toLowerCase();
  const linkLower = evidence.link.toLowerCase();
  const fullTextLower = `${titleLower} ${indicationLower}`;
  
  // 1. Título menciona a empresa? (+30 pontos)
  if (titleLower.includes(companyLower) || indicationLower.includes(companyLower)) {
    score += 30;
  }
  
  // Keywords relevantes para prospecção SAP/tecnologia empresarial
  const sapRelevantKeywords = [
    // SAP Core
    'sap', 's/4hana', 's4hana', 'hana', 'erp', 'fiori', 'abap', 'basis',
    // Projetos SAP
    'migração', 'implementação', 'go-live', 'rollout', 'projeto', 'deploy',
    // Tecnologia empresarial
    'transformação digital', 'sistema', 'integração', 'cloud', 'aws', 'azure',
    'automação', 'processos', 'gestão', 'supply chain', 'logística', 'wms',
    'btp', 'integration suite', 'cpi', 'ariba', 'successfactors', 'concur',
    // Termos de negócio B2B
    'parceria', 'projeto', 'consultoria', 'tecnologia', 'inovação', 'digital'
  ];
  
  // Keywords que indicam conteúdo IRRELEVANTE para prospecção B2B SAP
  const irrelevantKeywords = [
    // RH/Institucional
    'gptw', 'great place to work', 'melhor empresa para trabalhar',
    'melhores empresas', 'certificação empresa',
    // Eventos não técnicos
    'reinauguração', 'inauguração', 'aniversário', 'celebração', 'festa',
    'comemorando', 'anos de empresa', 'jubileu',
    // Jurídico/Compliance
    'ab2l', 'jurídico', 'juridico', 'advogado', 'advocacia', 'compliance legal',
    // Vagas genéricas
    'estamos contratando', 'vaga aberta', 'oportunidade de emprego',
    'venha fazer parte', 'processo seletivo',
    // Premiações não técnicas  
    'prêmio rh', 'diversidade', 'inclusão', 'sustentabilidade social',
    // Datas comemorativas
    'feliz natal', 'feliz ano novo', 'boas festas', 'páscoa', 'dia das mães',
    'dia dos pais', 'dia do trabalhador',
    // Conteúdo genérico de marca
    'somos a melhor', 'orgulho de ser', 'time incrível', 'equipe fantástica'
  ];
  
  // 2. Conteúdo relacionado à categoria? (+40 pontos base, ajustado por contexto)
  if (category === 'sap') {
    if (sapRelevantKeywords.some(kw => fullTextLower.includes(kw))) {
      score += 40;
    }
  } else if (category === 'tech') {
    const techKeywords = ['cloud', 'aws', 'azure', 'gcp', 'transformação digital', 'data lake', 'integração', 'api', 'tecnologia', 'ti', 'infraestrutura'];
    const hasSap = ['sap', 's/4hana', 's4hana'].some(kw => fullTextLower.includes(kw));
    if (!hasSap && techKeywords.some(kw => fullTextLower.includes(kw))) {
      score += 40;
    }
  } else if (category === 'linkedin') {
    // LinkedIn: validar DOMÍNIO + CONTEÚDO RELACIONADO AO SERVIÇO
    if (linkLower.includes('linkedin.com')) {
      score += 15; // Base reduzida para LinkedIn (era 40)
      
      // BÔNUS: Conteúdo menciona termos SAP/tecnologia empresarial (+35)
      const hasSapContent = sapRelevantKeywords.some(kw => fullTextLower.includes(kw));
      if (hasSapContent) {
        score += 35;
        console.log(`✅ LinkedIn relevante (SAP/tech): "${evidence.title.substring(0, 50)}..."`);
      }
      
      // PENALIDADE: Conteúdo irrelevante para prospecção (-40)
      const hasIrrelevantContent = irrelevantKeywords.some(kw => fullTextLower.includes(kw));
      if (hasIrrelevantContent) {
        score -= 40;
        console.log(`🚫 LinkedIn penalizado (irrelevante): "${evidence.title.substring(0, 50)}..."`);
      }
      
      // BÔNUS MENOR: É post/publicação específica (+10)
      const isPost = linkLower.includes('/posts/') || linkLower.includes('/feed/update/') || linkLower.includes('/pulse/');
      if (isPost) {
        score += 10;
      }
    }
  }
  
  // 3. Fonte confiável? (+20 pontos)
  const reliableSources = ['linkedin.com', 'sap.com', 'itforum.com.br', 'canaltech.com.br', 'valor.com.br', 'infomoney.com.br', 'exame.com', 'computerworld.com.br', 'wikipedia.org'];
  if (reliableSources.some(src => linkLower.includes(src) || evidence.source.toLowerCase().includes(src))) {
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
// OPENAI WEB SEARCH - EXTRAÇÃO DE URLS REAIS
// ============================================
async function performWebSearch(
  apiKey: string, 
  searchPrompt: string, 
  category: 'sap' | 'tech' | 'linkedin',
  company: string
): Promise<{ evidences: Evidence[]; companyProfile?: CompanyProfile; leadProfile?: LeadProfile }> {
  try {
    console.log(`🔍 Iniciando busca ${category} para: ${company}`);
    
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
      console.error(`❌ Erro na busca ${category}:`, response.status);
      return { evidences: [] };
    }

    const result = await response.json();
    
    // ============================================
    // EXTRAIR URLs REAIS DAS ANNOTATIONS
    // ============================================
    let outputText = '';
    let annotations: UrlCitation[] = [];
    
    if (result.output) {
      for (const output of result.output) {
        if (output.type === 'message' && output.content) {
          for (const content of output.content) {
            if (content.type === 'output_text') {
              outputText = content.text || '';
              
              // CRÍTICO: Extrair annotations com URLs REAIS
              if (content.annotations && Array.isArray(content.annotations)) {
                annotations = content.annotations
                  .filter((a: any) => a.type === 'url_citation' && a.url && a.title)
                  .map((a: any) => ({
                    type: 'url_citation' as const,
                    start_index: a.start_index || 0,
                    end_index: a.end_index || 0,
                    url: a.url,
                    title: a.title
                  }));
              }
              break;
            }
          }
        }
      }
    }

    console.log(`📎 ${category}: Encontradas ${annotations.length} citações com URLs reais`);

    if (annotations.length === 0) {
      console.log(`⚠️ ${category}: Nenhuma URL real encontrada nas annotations`);
      return { evidences: [] };
    }

    // ============================================
    // CONSTRUIR EVIDÊNCIAS A PARTIR DAS URLS REAIS
    // ============================================
    const evidences: Evidence[] = annotations
      .filter(annotation => {
        // Filtrar por categoria
        const urlLower = annotation.url.toLowerCase();
        if (category === 'linkedin') {
          // CRÍTICO: Para LinkedIn, APENAS aceitar URLs reais do LinkedIn
          const isLinkedin = urlLower.includes('linkedin.com');
          if (!isLinkedin) return false;
          
          // Verificar se é um post individual (máxima prioridade)
          const isPost = urlLower.includes('/posts/') || 
                         urlLower.includes('/feed/update/') || 
                         urlLower.includes('/pulse/');
          const isProfile = urlLower.includes('/in/');
          const isJobPosting = urlLower.includes('/jobs/');
          const isCompanyPage = urlLower.includes('/company/') && !urlLower.includes('/posts/');
          
          // Rejeitar vagas e páginas genéricas
          if (isJobPosting) {
            console.log(`🚫 LinkedIn: Rejeitando vaga: ${annotation.url}`);
            return false;
          }
          if (isCompanyPage) {
            console.log(`⚠️ LinkedIn: Página genérica de empresa ignorada: ${annotation.url}`);
            return false;
          }
          
          // Aceitar posts e perfis
          if (isPost || isProfile) {
            console.log(`✅ LinkedIn: Aceito post/perfil: ${annotation.url}`);
            return true;
          }
          
          return false;
        } else if (category === 'sap') {
          // SAP pode vir de qualquer fonte relevante
          return true;
        } else if (category === 'tech') {
          // Tech: excluir links que parecem ser sobre SAP
          const titleLower = annotation.title.toLowerCase();
          const hasSap = ['sap', 's/4hana', 's4hana', 'hana'].some(kw => titleLower.includes(kw));
          return !hasSap;
        }
        return true;
      })
      .map(annotation => ({
        title: annotation.title,
        indication: extractIndicationFromContext(outputText, annotation, category),
        link: annotation.url,  // URL REAL das annotations!
        source: extractSourceFromUrl(annotation.url),
        date: extractDateFromUrl(annotation.url),
        category
      }))
      // Para LinkedIn, priorizar posts sobre perfis
      .sort((a, b) => {
        if (category === 'linkedin') {
          const aIsPost = a.link.includes('/posts/') || a.link.includes('/feed/update/');
          const bIsPost = b.link.includes('/posts/') || b.link.includes('/feed/update/');
          if (aIsPost && !bIsPost) return -1;
          if (!aIsPost && bIsPost) return 1;
        }
        return 0;
      });

    console.log(`✅ ${category}: ${evidences.length} evidências criadas com URLs reais`);

    // ============================================
    // EXTRAIR DADOS ESTRUTURADOS (profile, etc)
    // ============================================
    let companyProfile: CompanyProfile | undefined;
    let leadProfile: LeadProfile | undefined;
    
    // Tentar extrair JSON do texto para dados estruturados (não para links!)
    if (outputText) {
      try {
        let jsonStr = outputText;
        const jsonMatch = outputText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1].trim();
        }
        
        const jsonStartIndex = jsonStr.indexOf('{');
        const jsonEndIndex = jsonStr.lastIndexOf('}');
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
          jsonStr = jsonStr.substring(jsonStartIndex, jsonEndIndex + 1);
          const parsed = JSON.parse(jsonStr);
          
          // Extrair apenas dados estruturados, não links
          if (parsed.companyProfile && category === 'sap') {
            companyProfile = {
              summary: parsed.companyProfile.summary || '',
              founded: parsed.companyProfile.founded,
              headquarters: parsed.companyProfile.headquarters,
              employees: parsed.companyProfile.employees,
              revenue: parsed.companyProfile.revenue,
              markets: parsed.companyProfile.markets,
              mainProducts: parsed.companyProfile.mainProducts,
              purpose: parsed.companyProfile.purpose
            };
          }
          
          if (parsed.leadProfile && category === 'linkedin') {
            leadProfile = {
              linkedinUrl: parsed.leadProfile.linkedinUrl,
              background: parsed.leadProfile.background,
              recentActivity: parsed.leadProfile.recentActivity
            };
          }
        }
      } catch {
        // Sem JSON estruturado - ok, as evidências já foram criadas das annotations
      }
    }

    return { 
      evidences,
      companyProfile,
      leadProfile
    };
  } catch (error) {
    console.error(`❌ Erro ao processar busca ${category}:`, error);
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

    console.log('🚀 Pesquisando informações para:', company, leadName);

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

IMPORTANTE: Analise os resultados e forneça um resumo estruturado.
As URLs dos resultados serão extraídas automaticamente das citações.

Retorne um JSON com o perfil da empresa:
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
  }
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

IMPORTANTE: 
- NÃO inclua nada relacionado a SAP, S/4HANA, ABAP, Fiori
- Foque em outros sistemas e tecnologias
- As URLs serão extraídas automaticamente das citações

Analise os resultados encontrados sobre tecnologia da empresa.`;

    // ============================================
    // BUSCA 3: LINKEDIN (PUBLICAÇÕES INDIVIDUAIS)
    // ============================================
    const linkedinSearchPrompt = `Você é um pesquisador de inteligência de mercado focado em encontrar PUBLICAÇÕES ESPECÍFICAS de profissionais no LinkedIn.

TAREFA CRÍTICA: Encontrar POSTS INDIVIDUAIS de pessoas no LinkedIn sobre "${company}" e SAP/S4HANA.

IMPORTANTE: Os links serão extraídos das citações da pesquisa. Foque em encontrar:

BUSCAR NA WEB (prioridade):
1. site:linkedin.com/posts "${company}" SAP migração finalizamos
2. site:linkedin.com/posts "${company}" S/4HANA go-live projeto
3. site:linkedin.com/posts "${company}" SAP implementação sucesso
4. site:linkedin.com/posts SAP S/4HANA "${company}" 
5. site:linkedin.com "${company}" SAP projeto concluído
${leadName ? `6. site:linkedin.com/in "${leadName}"` : ''}
${leadName ? `7. site:linkedin.com/posts "${leadName}" SAP` : ''}

RESULTADO ESPERADO:
- Publicações de profissionais celebrando projetos SAP
- Posts sobre go-live, migração, implementação
- Menções de sucesso em projetos SAP na empresa

TAMBÉM PESQUISAR (informação textual, SEM precisar de link):
- Quantidade de vagas SAP abertas na empresa (informar apenas "X vagas de SAP para [área]")
- Tendências de contratação SAP

${leadName ? `Se encontrar informações sobre ${leadName}:
{
  "leadProfile": {
    "linkedinUrl": "URL do perfil",
    "background": "Resumo profissional",
    "recentActivity": "Publicações recentes sobre SAP"
  }
}` : ''}`;

    // Executar as 3 buscas em paralelo
    console.log('⚡ Iniciando 3 buscas em paralelo...');
    const [sapResult, techResult, linkedinResult] = await Promise.all([
      performWebSearch(OPENAI_API_KEY, sapSearchPrompt, 'sap', company),
      performWebSearch(OPENAI_API_KEY, techSearchPrompt, 'tech', company),
      performWebSearch(OPENAI_API_KEY, linkedinSearchPrompt, 'linkedin', company)
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
        console.log(`🚫 SAP descartado (score ${validation.score}): ${evidence.title.substring(0, 50)}`);
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
        console.log(`🚫 Tech descartado (score ${validation.score}): ${evidence.title.substring(0, 50)}`);
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
        console.log(`🚫 LinkedIn descartado (score ${validation.score}): ${evidence.title.substring(0, 50)}`);
      }
    }

    // Company profile vem da busca SAP
    const companyProfile: CompanyProfile = sapResult.companyProfile || defaultCompanyProfile;

    // Lead profile vem da busca LinkedIn
    const leadProfile: LeadProfile = linkedinResult.leadProfile || {};

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

    console.log(`🏁 Pesquisa concluída com URLs REAIS:
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
    console.error('❌ Erro na função research-company:', error);
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
