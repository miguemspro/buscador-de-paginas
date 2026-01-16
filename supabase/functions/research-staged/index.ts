import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// FASE 1: Pesquisa em Etapas com Cache
// ============================================

interface ResearchRequest {
  company: string;
  leadName?: string;
  role?: string;
  industry?: string;
  skipCache?: boolean;
}

interface Evidence {
  id: string;
  tipo: 'empresa' | 'lead' | 'setor' | 'concorrente';
  titulo: string;
  descricao: string;
  data_publicacao: string | null;
  links: string[];
  relevancia_sap: number;
  confianca: 'alta' | 'media' | 'baixa';
  fonte: string;
}

interface LeadProfile {
  linkedin_url: string | null;
  historico_profissional: string | null;
  atividade_recente: string | null;
  prioridades_inferidas: string[];
  fonte_dados: string;
}

interface SectorResearch {
  setor: string;
  tendencias_2025_2026: string[];
  movimentos_sap: string[];
  concorrentes: Array<{ nome: string; movimento_tech: string; fonte: string }>;
  prioridades_tipicas: string[];
}

// TTL em horas por tipo de cache
const CACHE_TTL: Record<string, number> = {
  empresa: 24,
  lead: 168, // 7 dias
  setor: 72
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company, leadName, role, industry, skipCache = false }: ResearchRequest = await req.json();

    if (!company) {
      return new Response(
        JSON.stringify({ error: 'company é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: {
      empresa: { evidencias: Evidence[]; cache_hit: boolean };
      lead: { perfil: LeadProfile | null; cache_hit: boolean };
      setor: { pesquisa: SectorResearch | null; cache_hit: boolean };
      validacao: { total_links: number; links_validos: number; links_invalidos: string[] };
    } = {
      empresa: { evidencias: [], cache_hit: false },
      lead: { perfil: null, cache_hit: false },
      setor: { pesquisa: null, cache_hit: false },
      validacao: { total_links: 0, links_validos: 0, links_invalidos: [] }
    };

    // ============================================
    // 1.6 CHECK CACHE
    // ============================================
    
    const companyCacheKey = `empresa:${company.toLowerCase().replace(/\s+/g, '_')}`;
    const sectorCacheKey = industry ? `setor:${industry.toLowerCase().replace(/\s+/g, '_')}` : null;

    if (!skipCache) {
      // Check empresa cache
      const { data: companyCache } = await supabase
        .from('research_cache')
        .select('*')
        .eq('cache_key', companyCacheKey)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (companyCache) {
        console.log('✅ Cache hit para empresa:', company);
        results.empresa = { 
          evidencias: companyCache.result_data as Evidence[], 
          cache_hit: true 
        };
        
        // Atualizar hit count
        await supabase
          .from('research_cache')
          .update({ 
            hit_count: (companyCache.hit_count || 0) + 1,
            last_hit_at: new Date().toISOString()
          })
          .eq('id', companyCache.id);
      }

      // Check setor cache
      if (sectorCacheKey) {
        const { data: sectorCache } = await supabase
          .from('research_cache')
          .select('*')
          .eq('cache_key', sectorCacheKey)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (sectorCache) {
          console.log('✅ Cache hit para setor:', industry);
          results.setor = { 
            pesquisa: sectorCache.result_data as SectorResearch, 
            cache_hit: true 
          };
          
          await supabase
            .from('research_cache')
            .update({ 
              hit_count: (sectorCache.hit_count || 0) + 1,
              last_hit_at: new Date().toISOString()
            })
            .eq('id', sectorCache.id);
        }
      }
    }

    // ============================================
    // 1.2 PESQUISA DA EMPRESA (se não em cache)
    // ============================================
    
    if (!results.empresa.cache_hit) {
      console.log('🔍 Pesquisando empresa:', company);
      const companyEvidences = await searchCompanyEvidences(company, industry);
      results.empresa.evidencias = companyEvidences;

      // Salvar no cache
      if (companyEvidences.length > 0) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + CACHE_TTL.empresa);

        await supabase
          .from('research_cache')
          .upsert({
            cache_key: companyCacheKey,
            cache_type: 'empresa',
            result_data: companyEvidences,
            expires_at: expiresAt.toISOString()
          }, { onConflict: 'cache_key' });
      }
    }

    // ============================================
    // 1.3 PESQUISA DO LEAD (compliance LinkedIn)
    // ============================================
    
    if (leadName) {
      console.log('🔍 Pesquisando lead:', leadName);
      const leadProfile = await searchLeadProfile(leadName, company, role);
      results.lead.perfil = leadProfile;
    }

    // ============================================
    // 1.4 PESQUISA SETORIAL (se não em cache)
    // ============================================
    
    if (industry && !results.setor.cache_hit) {
      console.log('🔍 Pesquisando setor:', industry);
      const sectorData = await searchSectorTrends(industry);
      results.setor.pesquisa = sectorData;

      // Salvar no cache
      if (sectorData && sectorCacheKey) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + CACHE_TTL.setor);

        await supabase
          .from('research_cache')
          .upsert({
            cache_key: sectorCacheKey,
            cache_type: 'setor',
            result_data: sectorData,
            expires_at: expiresAt.toISOString()
          }, { onConflict: 'cache_key' });
      }
    }

    // ============================================
    // 1.5 VALIDAÇÃO DE CITAÇÕES
    // ============================================
    
    const allLinks: string[] = [];
    results.empresa.evidencias.forEach(e => allLinks.push(...e.links));
    
    results.validacao.total_links = allLinks.length;
    
    // Validar links em paralelo (max 5 de cada vez)
    const validationResults = await validateLinks(allLinks.slice(0, 10));
    
    results.validacao.links_validos = validationResults.filter(v => v.valid).length;
    results.validacao.links_invalidos = validationResults
      .filter(v => !v.valid)
      .map(v => v.url);

    // Atualizar confiança das evidências baseado na validação
    results.empresa.evidencias = results.empresa.evidencias.map(e => {
      const validLinks = e.links.filter(link => 
        !results.validacao.links_invalidos.includes(link)
      );
      
      let confianca: 'alta' | 'media' | 'baixa' = 'baixa';
      if (validLinks.length >= 2) confianca = 'alta';
      else if (validLinks.length === 1) confianca = 'media';
      
      return { ...e, links: validLinks, confianca };
    }).filter(e => e.links.length > 0); // Remove evidências sem links válidos

    console.log(`✅ Pesquisa concluída: ${results.empresa.evidencias.length} evidências válidas`);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na pesquisa:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        empresa: { evidencias: [], cache_hit: false },
        lead: { perfil: null, cache_hit: false },
        setor: { pesquisa: null, cache_hit: false },
        validacao: { total_links: 0, links_validos: 0, links_invalidos: [] }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================
// 1.2 Função de Pesquisa da Empresa
// ============================================
async function searchCompanyEvidences(company: string, industry?: string): Promise<Evidence[]> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY não configurada');
    return [];
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-search-preview',
        tools: [{ type: 'web_search_preview' }],
        input: `Pesquise informações REAIS e VERIFICÁVEIS sobre a empresa "${company}"${industry ? ` do setor ${industry}` : ''}.

FOCO DA PESQUISA:
1. Projetos de TI, SAP ou transformação digital
2. Notícias recentes (últimos 12 meses)
3. Vagas abertas relacionadas a SAP/ERP
4. Movimentos estratégicos (fusões, expansões, etc.)

REGRAS CRÍTICAS:
- Cada informação DEVE ter 1-2 links verificáveis
- Priorize fontes confiáveis: sites de notícias, LinkedIn, site oficial
- NÃO invente informações - se não encontrar, retorne menos resultados
- Indique a relevância para prospecção de soluções SAP (1-5)

Retorne em JSON:
{
  "evidences": [
    {
      "id": "ev_001",
      "tipo": "empresa",
      "titulo": "Título da notícia/informação",
      "descricao": "O que isso indica para prospecção",
      "data_publicacao": "Jan 2026",
      "links": ["https://url1.com", "https://url2.com"],
      "relevancia_sap": 4,
      "fonte": "Nome da fonte"
    }
  ]
}

Retorne 5-8 evidências se disponíveis, ou menos se não houver informações verificáveis.`
      }),
    });

    if (!response.ok) {
      console.error('Erro na API OpenAI:', response.status);
      return [];
    }

    const result = await response.json();
    const outputText = result.output_text || '';

    // Parse JSON da resposta
    const jsonMatch = outputText.match(/\{[\s\S]*"evidences"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return (parsed.evidences || [])
        .filter((e: Evidence) => e.links && e.links.length > 0)
        .map((e: Evidence, i: number) => ({
          ...e,
          id: e.id || `ev_${i + 1}`,
          confianca: e.links.length >= 2 ? 'alta' : 'media'
        }));
    }

    return [];
  } catch (error) {
    console.error('Erro ao pesquisar empresa:', error);
    return [];
  }
}

// ============================================
// 1.3 Função de Pesquisa do Lead (Compliance LinkedIn)
// ============================================
async function searchLeadProfile(leadName: string, company: string, role?: string): Promise<LeadProfile | null> {
  // COMPLIANCE: Buscar apenas em fontes públicas indexadas
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-search-preview',
        tools: [{ type: 'web_search_preview' }],
        input: `Busque informações PÚBLICAS e INDEXADAS sobre "${leadName}"${role ? `, ${role}` : ''} na empresa "${company}".

REGRAS DE COMPLIANCE:
✅ PERMITIDO:
- Páginas públicas indexadas pelo Google/Bing
- Site institucional da empresa (página de equipe)
- Artigos e entrevistas públicas

❌ PROIBIDO:
- Scraping de LinkedIn
- Dados não indexados publicamente

BUSQUE:
1. Perfil profissional público
2. Histórico de carreira (se disponível publicamente)
3. Artigos ou entrevistas
4. Prioridades típicas baseado no cargo

Retorne em JSON:
{
  "linkedin_url": "URL do perfil público se encontrado",
  "historico_profissional": "Histórico resumido se disponível",
  "atividade_recente": "Atividade recente pública",
  "prioridades_inferidas": ["Baseado no cargo de ${role || 'executivo'}"],
  "fonte_dados": "google"
}

Se não encontrar informações verificáveis, retorne apenas prioridades inferidas baseadas no cargo.`
      }),
    });

    if (!response.ok) return null;

    const result = await response.json();
    const outputText = result.output_text || '';

    const jsonMatch = outputText.match(/\{[\s\S]*"prioridades_inferidas"[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as LeadProfile;
    }

    // Fallback: inferir baseado no cargo
    return {
      linkedin_url: null,
      historico_profissional: null,
      atividade_recente: null,
      prioridades_inferidas: inferPrioritiesFromRole(role),
      fonte_dados: 'fornecido_sdr'
    };
  } catch (error) {
    console.error('Erro ao pesquisar lead:', error);
    return null;
  }
}

// Inferir prioridades baseado no cargo
function inferPrioritiesFromRole(role?: string): string[] {
  if (!role) return ['Eficiência operacional', 'Redução de custos'];
  
  const roleLower = role.toLowerCase();
  
  if (roleLower.includes('cio') || roleLower.includes('chief information')) {
    return ['Transformação digital', 'ROI de TI', 'Inovação tecnológica', 'Governança de dados'];
  }
  if (roleLower.includes('cfo') || roleLower.includes('chief financial')) {
    return ['Compliance fiscal', 'Otimização de custos', 'Visibilidade financeira', 'Reforma tributária'];
  }
  if (roleLower.includes('it manager') || roleLower.includes('gerente de ti')) {
    return ['Estabilidade de sistemas', 'Performance', 'Integrações', 'Suporte eficiente'];
  }
  if (roleLower.includes('diretor')) {
    return ['Resultados de negócio', 'Eficiência operacional', 'Competitividade'];
  }
  
  return ['Eficiência no dia-a-dia', 'Processos otimizados', 'Ferramentas adequadas'];
}

// ============================================
// 1.4 Função de Pesquisa Setorial
// ============================================
async function searchSectorTrends(industry: string): Promise<SectorResearch | null> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-search-preview',
        tools: [{ type: 'web_search_preview' }],
        input: `Pesquise tendências e movimentos do setor "${industry}" no Brasil para 2025-2026.

BUSQUE:
1. Tendências tecnológicas do setor (3-5)
2. Movimentos relacionados a SAP no setor
3. Principais concorrentes e seus investimentos em tecnologia (2-3)
4. Prioridades típicas das empresas do setor

Retorne em JSON:
{
  "setor": "${industry}",
  "tendencias_2025_2026": ["Tendência 1", "Tendência 2"],
  "movimentos_sap": ["Movimento SAP 1"],
  "concorrentes": [
    {"nome": "Empresa", "movimento_tech": "O que está fazendo", "fonte": "URL"}
  ],
  "prioridades_tipicas": ["Prioridade 1", "Prioridade 2"]
}`
      }),
    });

    if (!response.ok) return null;

    const result = await response.json();
    const outputText = result.output_text || '';

    const jsonMatch = outputText.match(/\{[\s\S]*"setor"[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as SectorResearch;
    }

    return null;
  } catch (error) {
    console.error('Erro ao pesquisar setor:', error);
    return null;
  }
}

// ============================================
// 1.5 Função de Validação de Links
// ============================================
async function validateLinks(urls: string[]): Promise<Array<{ url: string; valid: boolean; status?: number }>> {
  const results: Array<{ url: string; valid: boolean; status?: number }> = [];
  
  // Validar em batches de 5
  for (let i = 0; i < urls.length; i += 5) {
    const batch = urls.slice(i, i + 5);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        try {
          const response = await fetch(url, { 
            method: 'HEAD',
            redirect: 'follow'
          });
          return { url, valid: response.ok, status: response.status };
        } catch {
          // Se HEAD falhar, tentar GET
          try {
            const response = await fetch(url, { 
              method: 'GET',
              redirect: 'follow'
            });
            return { url, valid: response.ok, status: response.status };
          } catch {
            return { url, valid: false };
          }
        }
      })
    );
    results.push(...batchResults);
  }
  
  return results;
}
