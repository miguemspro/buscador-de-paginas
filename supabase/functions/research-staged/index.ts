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
    // Usando Chat Completions API com web_search tool
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
            content: 'Você é um assistente de pesquisa B2B especializado em encontrar informações sobre empresas para prospecção comercial. Sempre retorne dados estruturados em JSON válido.'
          },
          {
            role: 'user',
            content: `Pesquise informações sobre a empresa "${company}"${industry ? ` do setor ${industry}` : ''}.

FOCO DA PESQUISA:
1. Projetos de TI, SAP ou transformação digital
2. Notícias recentes (últimos 12 meses)
3. Vagas abertas relacionadas a SAP/ERP
4. Movimentos estratégicos (fusões, expansões, etc.)

REGRAS:
- Cada informação DEVE ter links verificáveis (use URLs reais conhecidas)
- Priorize fontes confiáveis: sites de notícias, site oficial da empresa
- NÃO invente informações - se não encontrar, retorne menos resultados
- Indique a relevância para prospecção SAP (1-5)

Retorne APENAS um JSON válido:
{
  "evidences": [
    {
      "id": "ev_001",
      "tipo": "empresa",
      "titulo": "Título da notícia/informação",
      "descricao": "O que isso indica para prospecção",
      "data_publicacao": "Jan 2026",
      "links": ["https://exemplo.com/noticia"],
      "relevancia_sap": 4,
      "fonte": "Nome da fonte"
    }
  ]
}

Retorne 5-8 evidências se disponíveis, ou menos se não houver informações verificáveis. Se não encontrar nada, retorne {"evidences": []}.`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'web_search',
            description: 'Busca informações na web sobre uma empresa',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Query de busca' }
              },
              required: ['query']
            }
          }
        }],
        response_format: { type: 'json_object' },
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API OpenAI:', response.status, errorText);
      return [];
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '{}';

    // Parse JSON da resposta
    try {
      const parsed = JSON.parse(content);
      return (parsed.evidences || [])
        .filter((e: Evidence) => e.links && e.links.length > 0)
        .map((e: Evidence, i: number) => ({
          ...e,
          id: e.id || `ev_${i + 1}`,
          confianca: e.links.length >= 2 ? 'alta' : 'media'
        }));
    } catch (parseError) {
      console.error('Erro ao parsear JSON:', parseError);
      return [];
    }
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
  // Por padrão, inferir baseado no cargo (mais seguro e rápido)
  return {
    linkedin_url: null,
    historico_profissional: null,
    atividade_recente: null,
    prioridades_inferidas: inferPrioritiesFromRole(role),
    fonte_dados: 'inferido_cargo'
  };
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
            content: 'Você é um analista de mercado especializado em setores da economia brasileira. Sempre retorne dados em JSON válido.'
          },
          {
            role: 'user',
            content: `Analise tendências e movimentos do setor "${industry}" no Brasil para 2025-2026.

Considere:
1. Tendências tecnológicas do setor (3-5)
2. Movimentos relacionados a SAP no setor
3. Prioridades típicas das empresas do setor

Retorne APENAS um JSON válido:
{
  "setor": "${industry}",
  "tendencias_2025_2026": ["Tendência 1", "Tendência 2"],
  "movimentos_sap": ["Movimento SAP 1"],
  "concorrentes": [],
  "prioridades_tipicas": ["Prioridade 1", "Prioridade 2"]
}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      console.error('Erro na API OpenAI (setor):', response.status);
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '{}';

    try {
      return JSON.parse(content) as SectorResearch;
    } catch {
      return null;
    }
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
