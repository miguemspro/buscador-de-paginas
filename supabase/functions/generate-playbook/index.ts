import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// 2.4 - SENSIBILIDADE A CARGO
// ============================================
interface RoleConfig {
  level: number;
  focus: string;
  language: string;
  excludeTopics: string[];
  priorityTopics: string[];
}

const ROLE_SENSITIVITY: Record<string, RoleConfig> = {
  'C-level': {
    level: 5,
    focus: 'Estratégia, ROI, Competitividade, Valor de negócio',
    language: 'Executiva e orientada a resultados de negócio',
    excludeTopics: ['detalhes técnicos', 'configuração', 'parâmetros'],
    priorityTopics: ['transformação digital', 'vantagem competitiva', 'redução de custos', 'crescimento', 'inovação']
  },
  'Diretor': {
    level: 4,
    focus: 'Resultados, Prazos, Orçamento, Entregas',
    language: 'Gerencial e orientada a resultados',
    excludeTopics: ['detalhes técnicos de implementação'],
    priorityTopics: ['prazo', 'orçamento', 'equipe', 'projetos', 'entregas']
  },
  'Gerente': {
    level: 3,
    focus: 'Operação, Equipe, Processos, Eficiência',
    language: 'Tática e orientada a processos',
    excludeTopics: ['decisões de board', 'M&A'],
    priorityTopics: ['automação', 'eficiência', 'processos', 'equipe', 'produtividade']
  },
  'Especialista': {
    level: 2,
    focus: 'Técnico, Integração, Performance, Ferramentas',
    language: 'Técnica e detalhada',
    excludeTopics: ['decisão de investimento', 'estratégia corporativa'],
    priorityTopics: ['integração', 'performance', 'APIs', 'arquitetura', 'best practices']
  },
  'Key User': {
    level: 1,
    focus: 'Dia-a-dia, Usabilidade, Treinamento',
    language: 'Prática e orientada ao usuário',
    excludeTopics: ['decisão de investimento', 'estratégia corporativa', 'M&A', 'Reforma Tributária', 'board'],
    priorityTopics: ['usabilidade', 'treinamento', 'suporte', 'facilidade de uso']
  }
};

function classifyRole(role: string): RoleConfig {
  const normalizedRole = role?.toLowerCase() || '';
  
  // C-level patterns
  if (/\b(ceo|cfo|cio|cto|coo|presidente|vice-presidente|vp|chief|c-level)\b/i.test(normalizedRole)) {
    return ROLE_SENSITIVITY['C-level'];
  }
  
  // Diretor patterns
  if (/\b(diretor|director|head of|head)\b/i.test(normalizedRole)) {
    return ROLE_SENSITIVITY['Diretor'];
  }
  
  // Gerente patterns
  if (/\b(gerente|manager|gestor|supervisor|coordenador)\b/i.test(normalizedRole)) {
    return ROLE_SENSITIVITY['Gerente'];
  }
  
  // Especialista patterns
  if (/\b(especialista|analyst|analista|consultor|architect|arquiteto|developer|desenvolvedor|engineer|engenheiro)\b/i.test(normalizedRole)) {
    return ROLE_SENSITIVITY['Especialista'];
  }
  
  // Key User patterns
  if (/\b(key user|usuario chave|usuário chave|operador|assistente)\b/i.test(normalizedRole)) {
    return ROLE_SENSITIVITY['Key User'];
  }
  
  // Default to Gerente for unknown roles
  return ROLE_SENSITIVITY['Gerente'];
}

// ============================================
// 2.5 - RANKING DE CASES POR SIMILARIDADE
// ============================================
interface MetaCase {
  id: string;
  company_name: string;
  industry: string;
  industry_keywords: string[];
  sap_solutions: string[];
  sap_modules: string[] | null;
  project_type: string | null;
  challenge: string | null;
  solution: string | null;
  key_result: string | null;
  results: string[];
  title: string;
  description: string;
  company_size: string | null;
}

interface RankedCase {
  case: MetaCase;
  score: number;
  matchReasons: string[];
}

async function rankCasesBySimilarity(
  industry: string | undefined,
  sapModules: string[] | undefined,
  projectType: string | undefined,
  companySize: string | undefined
): Promise<RankedCase[]> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Buscar todos os cases ativos
  const { data: allCases, error } = await supabase
    .from('meta_cases')
    .select('*')
    .eq('is_active', true);

  if (error || !allCases || allCases.length === 0) {
    console.log('Nenhum case encontrado no banco');
    return [];
  }

  const lowerIndustry = (industry || '').toLowerCase();
  const rankedCases: RankedCase[] = [];

  for (const caseItem of allCases) {
    let score = 0.1; // Score base para todos os cases (garante que sempre apareçam)
    const matchReasons: string[] = [];

    // 1. Match de setor (peso 0.4)
    const keywords = caseItem.industry_keywords || [];
    const caseIndustry = (caseItem.industry || '').toLowerCase();
    
    // Match exato de indústria
    if (lowerIndustry && caseIndustry === lowerIndustry) {
      score += 0.4;
      matchReasons.push(`Mesmo setor: ${caseItem.industry}`);
    }
    // Match por keywords
    else if (lowerIndustry && keywords.some((kw: string) => lowerIndustry.includes(kw.toLowerCase()) || kw.toLowerCase().includes(lowerIndustry))) {
      score += 0.3;
      matchReasons.push(`Setor similar: ${caseItem.industry}`);
    }
    // Match parcial
    else if (lowerIndustry && caseIndustry.includes(lowerIndustry.split('/')[0]) || lowerIndustry.includes(caseIndustry.split('/')[0])) {
      score += 0.2;
      matchReasons.push(`Setor relacionado: ${caseItem.industry}`);
    }

    // 2. Match de módulos SAP (peso 0.25)
    if (sapModules && sapModules.length > 0 && caseItem.sap_modules) {
      const moduleMatches = sapModules.filter(m => 
        caseItem.sap_modules?.includes(m)
      ).length;
      if (moduleMatches > 0) {
        const moduleScore = (moduleMatches / sapModules.length) * 0.25;
        score += moduleScore;
        matchReasons.push(`Módulos em comum: ${caseItem.sap_modules?.filter((m: string) => sapModules.includes(m)).join(', ')}`);
      }
    }

    // 3. Match de tipo de projeto (peso 0.2)
    if (projectType && caseItem.project_type) {
      if (caseItem.project_type.toLowerCase() === projectType.toLowerCase()) {
        score += 0.2;
        matchReasons.push(`Mesmo tipo de projeto: ${caseItem.project_type}`);
      }
    }

    // 4. Match de porte (peso 0.15)
    if (companySize && caseItem.company_size) {
      if (caseItem.company_size.toLowerCase() === companySize.toLowerCase()) {
        score += 0.15;
        matchReasons.push(`Mesmo porte: ${caseItem.company_size}`);
      }
    }

    // Se não houve match específico, adicionar razão genérica
    if (matchReasons.length === 0) {
      matchReasons.push(`Case de sucesso: ${caseItem.industry}`);
    }

    rankedCases.push({ case: caseItem, score, matchReasons });
  }

  // Ordenar por score e retornar top 3
  rankedCases.sort((a, b) => b.score - a.score);
  console.log(`Top 3 cases selecionados:`, rankedCases.slice(0, 3).map(c => `${c.case.company_name} (${c.score})`));
  return rankedCases.slice(0, 3);
}

// ============================================
// 2.2 - MOTOR DE DORES PROVÁVEIS
// ============================================
interface PainEvidence {
  evidenceType: string;
  typicalPains: string[];
}

const PAIN_EVIDENCE_MATRIX: PainEvidence[] = [
  {
    evidenceType: 'migração S/4HANA',
    typicalPains: [
      'Estabilização pós-go-live',
      'Limpeza e migração de dados mestres',
      'Redesenho de integrações legadas',
      'Change management e adoção'
    ]
  },
  {
    evidenceType: 'vagas SAP',
    typicalPains: [
      'Falta de recursos SAP internos',
      'Dependência de conhecimento específico',
      'Dificuldade em reter talentos SAP'
    ]
  },
  {
    evidenceType: 'fusão|aquisição|M&A',
    typicalPains: [
      'Consolidação de múltiplas instâncias SAP',
      'Harmonização de processos',
      'Unificação de dados mestres'
    ]
  },
  {
    evidenceType: 'crescimento|expansão',
    typicalPains: [
      'Escalabilidade do ambiente atual',
      'Performance em alto volume',
      'Novos módulos para novas operações'
    ]
  },
  {
    evidenceType: 'transformação digital',
    typicalPains: [
      'Resistência à mudança',
      'Capacitação de usuários',
      'Integração de novos canais digitais'
    ]
  },
  {
    evidenceType: 'ECC|deadline 2027',
    typicalPains: [
      'Urgência de migração antes do fim de suporte SAP ECC (2027)',
      'Planejamento de roadmap de migração',
      'Avaliação de impacto e esforço'
    ]
  },
  {
    evidenceType: 'reforma tributária|DRC',
    typicalPains: [
      'Adequação às novas regras tributárias brasileiras',
      'Atualização de processos fiscais',
      'Compliance fiscal em tempo hábil'
    ]
  },
  {
    evidenceType: 'AMS|sustentação',
    typicalPains: [
      'Alto custo de sustentação',
      'SLAs não atendidos',
      'Falta de proatividade do fornecedor atual'
    ]
  }
];

function derivePainsFromContext(
  evidences: { title: string; indication: string }[],
  industry: string | undefined,
  sapStatus: string | undefined,
  roleConfig: RoleConfig
): { pain: string; reason: string; confidence: 'alta' | 'media' | 'baixa' }[] {
  const pains: { pain: string; reason: string; confidence: 'alta' | 'media' | 'baixa' }[] = [];
  const addedPains = new Set<string>();

  // 1. Derivar dores das evidências encontradas
  for (const evidence of evidences) {
    const combinedText = `${evidence.title} ${evidence.indication}`.toLowerCase();
    
    for (const matrix of PAIN_EVIDENCE_MATRIX) {
      const patterns = matrix.evidenceType.split('|');
      if (patterns.some(p => combinedText.includes(p.toLowerCase()))) {
        for (const pain of matrix.typicalPains) {
          if (!addedPains.has(pain)) {
            // Filtrar por cargo
            const shouldExclude = roleConfig.excludeTopics.some(topic => 
              pain.toLowerCase().includes(topic.toLowerCase())
            );
            if (!shouldExclude) {
              addedPains.add(pain);
              pains.push({
                pain,
                reason: `Baseado em: "${evidence.title}"`,
                confidence: 'alta'
              });
            }
          }
        }
      }
    }
  }

  // 2. Derivar dores do status SAP
  if (sapStatus) {
    const sapLower = sapStatus.toLowerCase();
    if (sapLower.includes('ecc') || sapLower.includes('r/3')) {
      if (!addedPains.has('deadline_2027')) {
        addedPains.add('deadline_2027');
        pains.push({
          pain: 'Pressão pelo deadline 2027 de fim de suporte SAP ECC',
          reason: `Status SAP atual: ${sapStatus}`,
          confidence: 'alta'
        });
      }
    }
    if (sapLower.includes('s/4') || sapLower.includes('s4')) {
      if (!addedPains.has('pos_golive')) {
        addedPains.add('pos_golive');
        pains.push({
          pain: 'Otimização e estabilização do ambiente S/4HANA',
          reason: `Status SAP atual: ${sapStatus}`,
          confidence: 'media'
        });
      }
    }
  }

  // 3. Derivar dores do setor (dores típicas do segmento)
  const industryPains: Record<string, string[]> = {
    'varejo': ['Sazonalidade e picos de demanda', 'Integração omnichannel', 'Gestão de estoque multicanal'],
    'manufatura': ['Planejamento de produção', 'Rastreabilidade', 'Integração com chão de fábrica'],
    'indústria': ['Eficiência operacional', 'Manutenção de ativos', 'Compliance regulatório'],
    'agronegócio': ['Sazonalidade agrícola', 'Rastreabilidade de origem', 'Compliance exportação'],
    'energia': ['Gestão de contratos', 'Manutenção de ativos críticos', 'Regulamentação setorial'],
    'saúde': ['Compliance LGPD/HIPAA', 'Integração de sistemas legados', 'Rastreabilidade de medicamentos'],
    'financeiro': ['Compliance regulatório', 'Segurança de dados', 'Conciliação financeira'],
    'logística': ['Visibilidade de entregas', 'Otimização de rotas', 'Integração com parceiros']
  };

  const lowerIndustry = (industry || '').toLowerCase();
  for (const [sector, sectorPains] of Object.entries(industryPains)) {
    if (lowerIndustry.includes(sector)) {
      for (const pain of sectorPains) {
        if (!addedPains.has(pain)) {
          addedPains.add(pain);
          pains.push({
            pain,
            reason: `Dor típica do setor de ${sector}`,
            confidence: 'media'
          });
        }
      }
      break;
    }
  }

  // 4. Priorizar dores relevantes para o cargo
  const prioritizedPains = pains.map(p => {
    const isPriority = roleConfig.priorityTopics.some(topic => 
      p.pain.toLowerCase().includes(topic.toLowerCase())
    );
    return { ...p, priority: isPriority ? 1 : 0 };
  });

  // Ordenar: alta confiança primeiro, depois prioridade por cargo
  prioritizedPains.sort((a, b) => {
    const confOrder = { 'alta': 3, 'media': 2, 'baixa': 1 };
    const confDiff = confOrder[b.confidence] - confOrder[a.confidence];
    if (confDiff !== 0) return confDiff;
    return b.priority - a.priority;
  });

  // Retornar top 10
  return prioritizedPains.slice(0, 10).map(({ priority, ...rest }) => rest);
}

// ============================================
// 2.3 - BUSCAR SOLUÇÕES DO BANCO COM CONTEXTO
// ============================================
interface MetaSolution {
  id: string;
  name: string;
  category: string;
  description: string;
  benefits: string[] | null;
  related_pains: string[] | null;
  sap_modules: string[] | null;
  target_roles: string[] | null;
  use_cases: string[] | null;
  expected_result: string | null;
}

interface CompanyContext {
  sapStatus?: string;
  industry?: string;
  companySize?: string;
  evidences?: { title: string; indication: string }[];
}

async function findRelevantSolutions(
  pains: { pain: string; reason: string; confidence: string }[],
  roleConfig: RoleConfig,
  sapModules: string[] | undefined,
  companyContext: CompanyContext = {}
): Promise<{ pain: string; solution: MetaSolution; matchScore: number; matchReason: string }[]> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: solutions, error } = await supabase
    .from('meta_solutions')
    .select('*')
    .eq('is_active', true);

  if (error || !solutions || solutions.length === 0) {
    console.log('Nenhuma solução ativa encontrada no banco');
    return [];
  }

  // Determinar o nome do cargo para filtro
  const roleLevel = roleConfig.level;
  const roleNames = Object.entries(ROLE_SENSITIVITY)
    .filter(([_, config]) => config.level >= roleLevel)
    .map(([name]) => name);

  // Filtrar soluções por cargo
  const filteredSolutions = solutions.filter((sol: MetaSolution) => {
    if (!sol.target_roles || sol.target_roles.length === 0) return true;
    return sol.target_roles.some(r => roleNames.includes(r));
  });

  console.log(`Soluções filtradas por cargo (${roleLevel}): ${filteredSolutions.length} de ${solutions.length}`);

  // Contexto para scoring adicional
  const sapStatusLower = (companyContext.sapStatus || '').toLowerCase();
  const isECC = sapStatusLower.includes('ecc') || sapStatusLower.includes('r/3');
  const isS4 = sapStatusLower.includes('s/4') || sapStatusLower.includes('s4hana');
  const evidencesText = (companyContext.evidences || [])
    .map(e => `${e.title} ${e.indication}`)
    .join(' ')
    .toLowerCase();

  // Mapear dores para soluções com contexto
  const mappedSolutions: { pain: string; solution: MetaSolution; matchScore: number; matchReason: string }[] = [];
  const usedSolutions = new Set<string>(); // Evitar duplicação de soluções

  for (const painItem of pains) {
    const { pain, reason, confidence } = painItem;
    const painLower = pain.toLowerCase();
    const reasonLower = reason.toLowerCase();
    let bestMatch: { solution: MetaSolution; score: number; reason: string } | null = null;

    for (const sol of filteredSolutions) {
      // Pular soluções já usadas
      if (usedSolutions.has(sol.id)) continue;

      let score = 0;
      const matchReasons: string[] = [];

      // 1. Match DIRETO por dores relacionadas (peso alto: 0.5)
      if (sol.related_pains && sol.related_pains.length > 0) {
        for (const relatedPain of sol.related_pains) {
          const relatedLower = relatedPain.toLowerCase();
          // Match exato ou parcial
          if (painLower.includes(relatedLower) || relatedLower.includes(painLower.substring(0, 15))) {
            score += 0.5;
            matchReasons.push(`Dor mapeada: "${relatedPain}"`);
            break;
          }
          // Match por palavras-chave importantes
          const keyWords = relatedLower.split(/\s+/).filter((w: string) => w.length > 4);
          const matches = keyWords.filter((w: string) => painLower.includes(w));
          if (matches.length >= 2) {
            score += 0.35;
            matchReasons.push(`Palavras-chave: ${matches.join(', ')}`);
            break;
          }
        }
      }

      // 2. Match por use_cases (peso: 0.3)
      if (sol.use_cases && sol.use_cases.length > 0) {
        for (const useCase of sol.use_cases) {
          const useCaseLower = useCase.toLowerCase();
          if (painLower.includes(useCaseLower.substring(0, 15)) || 
              useCaseLower.includes(painLower.substring(0, 15))) {
            score += 0.3;
            matchReasons.push(`Caso de uso: "${useCase}"`);
            break;
          }
        }
      }

      // 3. Match por contexto SAP (peso: 0.25)
      if (isECC && sol.name.toLowerCase().includes('migração')) {
        score += 0.25;
        matchReasons.push('Contexto: Empresa em ECC');
      }
      if (isECC && sol.name.toLowerCase().includes('s/4hana')) {
        score += 0.2;
        matchReasons.push('Contexto: Candidato a S/4HANA');
      }
      if (sol.name.toLowerCase().includes('reforma tributária') && 
          (evidencesText.includes('tributár') || evidencesText.includes('fiscal') || evidencesText.includes('drc'))) {
        score += 0.3;
        matchReasons.push('Contexto: Sinais de reforma tributária');
      }

      // 4. Match por módulos SAP (peso: 0.2)
      if (sapModules && sapModules.length > 0 && sol.sap_modules && sol.sap_modules.length > 0) {
        const moduleMatches = sapModules.filter(m => 
          sol.sap_modules!.some((sm: string) => sm.toLowerCase().includes(m.toLowerCase()))
        );
        if (moduleMatches.length > 0) {
          score += 0.2;
          matchReasons.push(`Módulos: ${moduleMatches.join(', ')}`);
        }
      }

      // 5. Match por keywords na descrição (peso: 0.15)
      const painWords = painLower.split(/\s+/).filter(w => w.length > 4);
      const descLower = sol.description.toLowerCase();
      const matchingWords = painWords.filter(w => descLower.includes(w));
      if (matchingWords.length >= 2) {
        score += 0.15;
        matchReasons.push(`Descrição compatível`);
      }

      // 6. Boost por confiança da dor (alta = +0.1)
      if (confidence === 'alta' && score > 0) {
        score += 0.1;
      }

      // 7. Match por evidências reais (peso: 0.2)
      if (evidencesText.length > 0) {
        const solKeywords = [
          ...(sol.related_pains || []),
          ...(sol.use_cases || []),
          sol.name
        ].map(k => k.toLowerCase());
        
        for (const keyword of solKeywords) {
          if (keyword.length > 5 && evidencesText.includes(keyword.substring(0, 10))) {
            score += 0.2;
            matchReasons.push('Evidência confirma necessidade');
            break;
          }
        }
      }

      if (score > 0.3 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { 
          solution: sol, 
          score, 
          reason: matchReasons.length > 0 ? matchReasons[0] : 'Compatibilidade geral'
        };
      }
    }

    if (bestMatch) {
      usedSolutions.add(bestMatch.solution.id);
      mappedSolutions.push({
        pain,
        solution: bestMatch.solution,
        matchScore: bestMatch.score,
        matchReason: bestMatch.reason
      });
    }
  }

  // Ordenar por score e limitar a 5 soluções mais relevantes
  mappedSolutions.sort((a, b) => b.matchScore - a.matchScore);
  const topSolutions = mappedSolutions.slice(0, 5);
  
  console.log(`Top ${topSolutions.length} soluções mapeadas:`, 
    topSolutions.map(s => `${s.solution.name} (${(s.matchScore * 100).toFixed(0)}%)`));

  return topSolutions;
}

// ============================================
// SYSTEM PROMPT OTIMIZADO
// ============================================
function buildSystemPrompt(roleConfig: RoleConfig): string {
  return `Você é um especialista em vendas consultivas B2B da Meta IT, parceira premium SAP no Brasil com 35 anos de experiência.

Sua tarefa é gerar um PLAYBOOK CONSULTIVO COMPLETO para um SDR se preparar para uma ligação de prospecção.

PERFIL DO LEAD - AJUSTE DE LINGUAGEM:
- Foco: ${roleConfig.focus}
- Linguagem: ${roleConfig.language}
- Evitar tópicos: ${roleConfig.excludeTopics.join(', ')}
- Priorizar: ${roleConfig.priorityTopics.join(', ')}

REGRAS CRÍTICAS:

1. SOBRE A EMPRESA: USE O TEXTO FORNECIDO
   - Se um texto "SOBRE A EMPRESA" foi fornecido, use-o EXATAMENTE no campo companyContext
   - Este texto foi pesquisado e validado automaticamente
   - NÃO modifique, resuma ou altere este texto

2. EVIDÊNCIAS: USE APENAS AS EVIDÊNCIAS FORNECIDAS
   - NÃO invente notícias ou eventos
   - Se nenhuma evidência foi fornecida, deixe o array vazio

3. DORES: USE AS DORES PRÉ-DERIVADAS
   - As dores já foram derivadas do contexto real
   - Apenas formate-as adequadamente no output

4. SOLUÇÕES: USE AS SOLUÇÕES PRÉ-MAPEADAS
   - As soluções já foram mapeadas do banco de dados
   - Apenas formate-as adequadamente no output

5. CASES: USE OS CASES RANQUEADOS
   - Os cases já foram selecionados por similaridade
   - Mencione-os no contexto

ESTRUTURA DAS 5 SEÇÕES:

1. RESUMO EXECUTIVO (5 bullets) - Calibrado para ${roleConfig.language}
   - companyContext: OBRIGATÓRIO usar o texto "SOBRE A EMPRESA" fornecido
2. EVIDÊNCIAS E NOTÍCIAS - Apenas as fornecidas
3. DORES PROVÁVEIS - As pré-derivadas
4. SOLUÇÕES META IT - As pré-mapeadas
5. PERGUNTAS DISCOVERY - 12 perguntas em 3 grupos

SOBRE A META IT:
- 35 anos de experiência em soluções SAP
- +120 clientes em +25 segmentos
- Especialistas em: Migração S/4HANA, AMS, Outsourcing, Reforma Tributária, SAP BTP`;
}

// ============================================
// MAIN HANDLER
// ============================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const leadData = body.leadData || body;
    
    if (!leadData || typeof leadData !== 'object') {
      console.error('leadData inválido:', body);
      return new Response(
        JSON.stringify({ error: 'leadData é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // 2.4 - Classificar cargo do lead
    const roleConfig = classifyRole(leadData.role || '');
    console.log('Cargo classificado:', leadData.role, '-> Nível', roleConfig.level);

    // 1. Buscar evidências reais via pesquisa
    console.log('Buscando evidências reais para:', leadData.company);
    let realEvidences: { title: string; indication: string; link: string; source: string; date?: string; category?: string; relevanceScore?: number }[] = [];
    let sapEvidences: { title: string; indication: string; link: string; source: string; date?: string; category?: string; relevanceScore?: number }[] = [];
    let techEvidences: { title: string; indication: string; link: string; source: string; date?: string; category?: string; relevanceScore?: number }[] = [];
    let linkedinEvidences: { title: string; indication: string; link: string; source: string; date?: string; category?: string; relevanceScore?: number }[] = [];
    let leadProfile: { linkedinUrl?: string; background?: string; recentActivity?: string } = {};
    let companyProfileSummary: string = '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    // 1. Pesquisar evidências da empresa
    try {
      const researchResponse = await fetch(`${supabaseUrl}/functions/v1/research-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: leadData.company,
          leadName: leadData.name,
          role: leadData.role,
          industry: leadData.industry
        })
      });

      if (researchResponse.ok) {
        const researchData = await researchResponse.json();
        realEvidences = researchData.evidences || [];
        sapEvidences = researchData.sapEvidences || [];
        techEvidences = researchData.techEvidences || [];
        linkedinEvidences = researchData.linkedinEvidences || [];
        leadProfile = researchData.leadProfile || {};
        companyProfileSummary = researchData.companyProfile?.summary || '';
        console.log(`Evidências encontradas: ${realEvidences.length} total (${sapEvidences.length} SAP, ${techEvidences.length} tech, ${linkedinEvidences.length} LinkedIn)`);
        console.log(`Company profile summary: ${companyProfileSummary.substring(0, 100)}...`);
      }
    } catch (researchError) {
      console.warn('Erro ao buscar evidências:', researchError);
    }

    // ============================================
    // ENRIQUECER PERFIL DO LEAD VIA LINKEDIN (APIFY)
    // ============================================
    let enrichedLeadProfile: {
      focus?: string;
      focusEmoji?: string;
      focusDetails?: string;
      approachSuggestion?: string;
      keyInsights?: string[];
      sapRelevance?: string[];
      enriched: boolean;
    } = { enriched: false };

    if (leadData.linkedinUrl || leadProfile.linkedinUrl) {
      const linkedinUrl = leadData.linkedinUrl || leadProfile.linkedinUrl;
      console.log('Enriquecendo perfil do lead via LinkedIn:', linkedinUrl);
      
      try {
        const enrichResponse = await fetch(`${supabaseUrl}/functions/v1/enrich-lead-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkedinUrl })
        });

        if (enrichResponse.ok) {
          const enrichData = await enrichResponse.json();
          if (enrichData.enriched) {
            enrichedLeadProfile = {
              focus: enrichData.focus,
              focusEmoji: enrichData.focusEmoji,
              focusDetails: enrichData.focusDetails,
              approachSuggestion: enrichData.approachSuggestion,
              keyInsights: enrichData.keyInsights,
              sapRelevance: enrichData.sapRelevance,
              enriched: true
            };
            console.log('Perfil enriquecido:', enrichData.focus);
          }
        }
      } catch (enrichError) {
        console.warn('Erro ao enriquecer perfil do lead:', enrichError);
      }
    }

    // 2.2 - Motor de Dores Prováveis
    console.log('Derivando dores prováveis...');
    const derivedPains = derivePainsFromContext(
      realEvidences,
      leadData.industry,
      leadData.sapStatus,
      roleConfig
    );
    console.log(`Dores derivadas: ${derivedPains.length}`);

    // 2.5 - Ranking de Cases por Similaridade
    console.log('Ranqueando cases por similaridade...');
    const rankedCases = await rankCasesBySimilarity(
      leadData.industry,
      leadData.sapModules,
      leadData.projectType,
      leadData.companySize
    );
    console.log(`Cases ranqueados: ${rankedCases.length}`);

    // 2.3 - Buscar soluções do banco COM CONTEXTO
    console.log('Mapeando soluções para dores com contexto...');
    const mappedSolutions = await findRelevantSolutions(
      derivedPains,
      roleConfig,
      leadData.sapModules,
      {
        sapStatus: leadData.sapStatus,
        industry: leadData.industry,
        companySize: leadData.companySize,
        evidences: realEvidences
      }
    );
    console.log(`Soluções mapeadas: ${mappedSolutions.length}`);

    // Montar contexto enriquecido para o prompt
    const evidencesText = realEvidences.length > 0
      ? realEvidences.map(e => `- ${e.title}: ${e.indication} (${e.source}, ${e.date || 'recente'})`).join('\n')
      : 'Nenhuma evidência encontrada via pesquisa.';

    const painsText = derivedPains.length > 0
      ? derivedPains.map((p, i) => `${i + 1}. ${p.pain} [${p.confidence}] - ${p.reason}`).join('\n')
      : 'Dores a serem exploradas durante discovery.';

    const casesText = rankedCases.length > 0
      ? rankedCases.map(rc => 
          `- ${rc.case.company_name} (${rc.case.title}): ${rc.case.key_result || rc.case.results?.[0] || rc.case.description}\n  Relevância: ${rc.matchReasons.join(', ')} (Score: ${(rc.score * 100).toFixed(0)}%)`
        ).join('\n')
      : 'Nenhum case específico encontrado para este contexto.';

    const solutionsText = mappedSolutions.length > 0
      ? mappedSolutions.map(ms => 
          `- Para "${ms.pain}": ${ms.solution.name}\n  Descrição: ${ms.solution.description}\n  Resultado esperado: ${ms.solution.expected_result || 'Melhoria operacional'}\n  Motivo: ${ms.matchReason} (${(ms.matchScore * 100).toFixed(0)}%)`
        ).join('\n\n')
      : 'Soluções a serem exploradas com base no discovery.';

    // Contexto do lead
    const leadProfileText = (leadProfile.background || leadProfile.recentActivity)
      ? `PERFIL DO LEAD (via pesquisa):
- Background: ${leadProfile.background || 'Não encontrado'}
- Atividade recente: ${leadProfile.recentActivity || 'Não encontrada'}`
      : '';

    // Construir contexto da empresa
    const companyContextForPrompt = companyProfileSummary 
      ? `\nSOBRE A EMPRESA (use EXATAMENTE este texto no campo companyContext do executiveSummary):\n${companyProfileSummary}\n`
      : '';

    const userPrompt = `Gere um PLAYBOOK CONSULTIVO COMPLETO para este lead:
${companyContextForPrompt}
DADOS DO LEAD:
- Nome: ${leadData.name || 'Não informado'}
- Cargo: ${leadData.role || 'Não informado'} (Nível: ${roleConfig.level}/5)
- Empresa: ${leadData.company || 'Não informada'}
- Segmento: ${leadData.industry || 'Não informado'}
- Porte: ${leadData.companySize || 'Não informado'}
- Status SAP: ${leadData.sapStatus || 'Não informado'}
- Prioridade: ${leadData.priority || 'Não informada'}
- Sinais Públicos: ${leadData.publicSignals || 'Não informados'}
- Origem: ${leadData.leadSource || 'Salesforce'}

${leadProfileText}

EVIDÊNCIAS REAIS ENCONTRADAS (use APENAS estas):
${evidencesText}

DORES PRÉ-DERIVADAS (baseadas nas evidências, setor e cargo):
${painsText}

SOLUÇÕES META IT MAPEADAS (do banco de dados):
${solutionsText}

CASES DE SUCESSO RANQUEADOS POR SIMILARIDADE:
${casesText}

INSTRUÇÕES:
1. ${companyProfileSummary ? 'Use EXATAMENTE o texto de "SOBRE A EMPRESA" acima no campo companyContext' : 'Pesquise sobre a empresa durante o discovery'}
2. Gere uma descrição do lead com base nas informações disponíveis
3. Use as evidências, dores e soluções fornecidas acima
4. Calibre a linguagem para ${roleConfig.language}
5. Foque em: ${roleConfig.focus}
6. Evite mencionar: ${roleConfig.excludeTopics.join(', ')}
7. Priorize tópicos: ${roleConfig.priorityTopics.join(', ')}

Gere o playbook completo com as 5 seções (sem texto de abordagem).`;

    console.log('Gerando playbook para:', leadData.name, '-', leadData.company);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: buildSystemPrompt(roleConfig) },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_playbook',
            description: 'Gera um playbook consultivo completo com 6 seções estruturadas',
            parameters: {
              type: 'object',
              properties: {
                executiveSummary: {
                  type: 'object',
                  properties: {
                    companyContext: { type: 'string' },
                    leadProfile: { type: 'string' },
                    priorities2026: { type: 'string' },
                    approachAngle: { type: 'string' },
                    publicContext: { type: 'string' }
                  },
                  required: ['companyContext', 'leadProfile', 'priorities2026', 'approachAngle', 'publicContext']
                },
                evidences: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      indication: { type: 'string' },
                      link: { type: 'string' },
                      source: { type: 'string' },
                      date: { type: 'string' },
                      category: { type: 'string', enum: ['SAP', 'Tecnologia'] }
                    }
                  }
                },
                probablePains: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      pain: { type: 'string' },
                      reason: { type: 'string' },
                      confidence: { type: 'string', enum: ['alta', 'media', 'baixa'] }
                    },
                    required: ['pain', 'reason']
                  }
                },
                metaSolutions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      pain: { type: 'string' },
                      solution: { type: 'string' },
                      description: { type: 'string' }
                    },
                    required: ['pain', 'solution', 'description']
                  }
                },
                discoveryQuestions: {
                  type: 'object',
                  properties: {
                    phaseAndPriorities: { type: 'array', items: { type: 'string' } },
                    operationsIntegration: { type: 'array', items: { type: 'string' } },
                    qualification: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['phaseAndPriorities', 'operationsIntegration', 'qualification']
                },
                relevantCases: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      company: { type: 'string' },
                      title: { type: 'string' },
                      result: { type: 'string' },
                      relevance: { type: 'string' }
                    }
                  }
                }
              },
              required: ['executiveSummary', 'evidences', 'probablePains', 'metaSolutions', 'discoveryQuestions']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_playbook' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Aguarde alguns segundos e tente novamente.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Resposta da API recebida');
    
    // Verificar se a resposta contém erro (mesmo com status 200)
    if (result.error) {
      console.error('Erro na resposta da API:', JSON.stringify(result.error));
      throw new Error(result.error.message || 'Erro interno do servidor de IA');
    }

    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'generate_playbook') {
      console.error('Resposta inesperada da API:', JSON.stringify(result, null, 2));
      throw new Error('Formato de resposta inesperado da API. Tente novamente.');
    }

    const playbook = JSON.parse(toolCall.function.arguments);
    
    // GARANTIR que o companyContext use o texto pesquisado
    if (companyProfileSummary && playbook.executiveSummary) {
      playbook.executiveSummary.companyContext = companyProfileSummary;
      console.log('CompanyContext definido a partir da pesquisa');
    }
    
    // ENRIQUECER PERFIL DO LEAD COM DADOS DO LINKEDIN
    if (enrichedLeadProfile.enriched && playbook.executiveSummary) {
      playbook.executiveSummary.leadFocus = enrichedLeadProfile.focus;
      playbook.executiveSummary.leadFocusEmoji = enrichedLeadProfile.focusEmoji;
      playbook.executiveSummary.leadApproachHint = enrichedLeadProfile.approachSuggestion;
      playbook.executiveSummary.leadKeyInsights = enrichedLeadProfile.keyInsights;
      
      // Enriquecer o leadProfile com informações do LinkedIn
      if (enrichedLeadProfile.focusDetails) {
        playbook.executiveSummary.leadProfile = `${playbook.executiveSummary.leadProfile || ''}\n\n🔍 Análise LinkedIn: ${enrichedLeadProfile.focusDetails}`;
      }
      
      console.log('Perfil do lead enriquecido com dados do LinkedIn:', enrichedLeadProfile.focus);
    }
    
    
    // Usar evidências reais da pesquisa - separadas por categoria
    playbook.sapEvidences = sapEvidences.map(e => ({
      ...e,
      category: 'SAP' as const
    }));
    playbook.techEvidences = techEvidences.map(e => ({
      ...e,
      category: 'Tecnologia' as const
    }));
    playbook.linkedinEvidences = linkedinEvidences.map(e => ({
      ...e,
      category: 'LinkedIn' as const
    }));
    
    // Combinar todas as evidências para retrocompatibilidade
    playbook.evidences = [
      ...playbook.sapEvidences,
      ...playbook.techEvidences,
      ...playbook.linkedinEvidences
    ];

    // Adicionar dores pré-derivadas se a IA não gerou
    if (!playbook.probablePains || playbook.probablePains.length === 0) {
      playbook.probablePains = derivedPains;
    }

    // FORÇAR uso das soluções mapeadas do banco (sempre, não apenas se IA não gerou)
    // Isso garante que as soluções sejam baseadas nas dores e contexto real
    playbook.metaSolutions = mappedSolutions.map(ms => ({
      pain: ms.pain,
      solution: ms.solution.name,
      description: ms.solution.expected_result || ms.solution.description,
      benefits: ms.solution.benefits?.slice(0, 3) || [],
      matchReason: ms.matchReason,
      matchScore: ms.matchScore
    }));

    // Adicionar cases ranqueados
    playbook.relevantCases = rankedCases.map(rc => ({
      company: rc.case.company_name,
      title: rc.case.title,
      result: rc.case.key_result || rc.case.results?.[0] || rc.case.description,
      relevance: rc.matchReasons.join(', '),
      score: rc.score
    }));

    // Adicionar metadados
    playbook.metadata = {
      roleLevel: roleConfig.level,
      roleFocus: roleConfig.focus,
      totalPains: derivedPains.length,
      totalCases: rankedCases.length,
      totalSolutions: mappedSolutions.length,
      evidencesFound: realEvidences.length
    };

    // Salvar no histórico
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from('playbook_history').insert({
        lead_company: leadData.company || 'Desconhecido',
        lead_name: leadData.name,
        lead_role: leadData.role,
        lead_email: leadData.email,
        lead_industry: leadData.industry,
        sap_status: leadData.sapStatus,
        extracted_data: leadData,
        playbook_data: playbook,
        evidences_count: realEvidences.length,
        cache_hit: false
      });
    } catch (saveError) {
      console.warn('Erro ao salvar histórico:', saveError);
    }

    console.log('Playbook gerado com sucesso');

    return new Response(
      JSON.stringify({ 
        playbook,
        cases: rankedCases.map(rc => ({
          company: rc.case.company_name,
          result: rc.case.key_result || rc.case.results?.[0],
          title: rc.case.title,
          solutions: rc.case.sap_solutions
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função generate-playbook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
