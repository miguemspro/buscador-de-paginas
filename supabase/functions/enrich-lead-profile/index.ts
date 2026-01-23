import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// EXTRAIR USERNAME DO LINKEDIN
// ============================================
function extractLinkedInUsername(linkedinUrl: string): string | null {
  if (!linkedinUrl) return null;
  
  // Remove trailing slash and clean URL
  const cleanUrl = linkedinUrl.trim().replace(/\/$/, '');
  
  // Pattern 1: Full URL like https://linkedin.com/in/username or https://www.linkedin.com/in/username
  const urlPattern = /linkedin\.com\/in\/([^\/\?]+)/i;
  const urlMatch = cleanUrl.match(urlPattern);
  if (urlMatch) {
    return urlMatch[1];
  }
  
  // Pattern 2: Just the username
  if (!cleanUrl.includes('/') && !cleanUrl.includes('.')) {
    return cleanUrl;
  }
  
  return null;
}

// ============================================
// VERIFICAR CACHE
// ============================================
async function checkCache(username: string): Promise<any | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const cacheKey = `linkedin_profile_${username.toLowerCase()}`;
  
  const { data, error } = await supabase
    .from('research_cache')
    .select('result_data, expires_at')
    .eq('cache_key', cacheKey)
    .eq('cache_type', 'linkedin_profile')
    .single();

  if (error || !data) {
    return null;
  }

  // Check if cache is expired
  if (new Date(data.expires_at) < new Date()) {
    console.log('Cache expirado para:', username);
    return null;
  }

  console.log('Cache hit para perfil LinkedIn:', username);
  
  // Update hit count
  await supabase
    .from('research_cache')
    .update({ 
      hit_count: (data as any).hit_count + 1,
      last_hit_at: new Date().toISOString()
    })
    .eq('cache_key', cacheKey);

  return data.result_data;
}

// ============================================
// SALVAR NO CACHE
// ============================================
async function saveToCache(username: string, data: any): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const cacheKey = `linkedin_profile_${username.toLowerCase()}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days TTL

  await supabase
    .from('research_cache')
    .upsert({
      cache_key: cacheKey,
      cache_type: 'linkedin_profile',
      result_data: data,
      expires_at: expiresAt.toISOString(),
      hit_count: 0
    }, {
      onConflict: 'cache_key'
    });

  console.log('Perfil LinkedIn salvo no cache:', username);
}

// ============================================
// CHAMAR APIFY LINKEDIN SCRAPER
// ============================================
async function fetchLinkedInProfile(username: string): Promise<any> {
  const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY');
  
  if (!APIFY_API_KEY) {
    throw new Error('APIFY_API_KEY não configurada');
  }

  console.log('Buscando perfil LinkedIn via Apify:', username);

  const response = await fetch(
    'https://api.apify.com/v2/acts/VhxlqQXRwhW8H5hNV/run-sync-get-dataset-items?token=' + APIFY_API_KEY,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        includeEmail: false
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro Apify:', response.status, errorText);
    throw new Error(`Apify error: ${response.status}`);
  }

  const items = await response.json();
  
  if (!items || items.length === 0) {
    console.warn('Nenhum dado retornado do Apify para:', username);
    return null;
  }

  return items[0];
}

// ============================================
// ANALISAR PERFIL COM IA
// ============================================
async function analyzeProfileWithAI(profileData: any): Promise<{
  focus: string;
  focusDetails: string;
  sapRelevance: string[];
  approachSuggestion: string;
  keyInsights: string[];
  focusEmoji: string;
}> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY não configurada');
  }

  // Extrair dados relevantes do perfil
  const headline = profileData.headline || '';
  const summary = profileData.summary || '';
  const firstName = profileData.firstName || '';
  const lastName = profileData.lastName || '';
  
  // Extrair experiências (últimas 5)
  const experiences = (profileData.experience || []).slice(0, 5).map((exp: any) => ({
    title: exp.title || '',
    company: exp.companyName || '',
    duration: exp.duration || '',
    description: exp.description || ''
  }));
  
  // Extrair skills (top 10)
  const skills = (profileData.skills || []).slice(0, 10).map((s: any) => 
    typeof s === 'string' ? s : s.name || ''
  ).filter(Boolean);

  const prompt = `Analise o perfil profissional abaixo e gere insights para uma abordagem de vendas SAP/consultoria.

PERFIL:
Nome: ${firstName} ${lastName}
Headline: ${headline}
Resumo: ${summary}

EXPERIÊNCIAS RECENTES:
${experiences.map((e: any, i: number) => `${i + 1}. ${e.title} @ ${e.company} (${e.duration})\n   ${e.description}`).join('\n')}

SKILLS:
${skills.join(', ')}

TAREFA:
Analise este perfil e identifique:
1. O FOCO PROFISSIONAL principal (ex: "Gestão de Dados", "TI Industrial", "Transformação Digital", etc.)
2. Detalhes do foco (breve explicação)
3. Quais soluções SAP seriam mais relevantes para essa pessoa
4. Melhor sugestão de abordagem consultiva
5. Insights chave do perfil (3-5 pontos)
6. Emoji que representa o foco (📊 para dados, 🏭 para manufatura, 💻 para TI, 🔧 para operações, 📈 para negócios, etc.)`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { 
          role: 'system', 
          content: `Você é um especialista em vendas consultivas SAP que analisa perfis de leads no LinkedIn.
Sua tarefa é identificar o foco profissional do lead para personalizar a abordagem de vendas.
Seja objetivo e acionável nas suas análises.`
        },
        { role: 'user', content: prompt }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'analyze_lead_profile',
          description: 'Retorna análise estruturada do perfil do lead',
          parameters: {
            type: 'object',
            properties: {
              focus: { 
                type: 'string',
                description: 'Foco profissional principal em 2-4 palavras (ex: "Gestão de Dados e Analytics")'
              },
              focusDetails: { 
                type: 'string',
                description: 'Explicação breve do foco profissional (1-2 frases)'
              },
              sapRelevance: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Lista de soluções SAP relevantes para este perfil (2-4 itens)'
              },
              approachSuggestion: { 
                type: 'string',
                description: 'Sugestão de como abordar este lead (1-2 frases)'
              },
              keyInsights: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Insights chave do perfil (3-5 pontos curtos)'
              },
              focusEmoji: {
                type: 'string',
                description: 'Emoji que representa o foco (ex: 📊, 🏭, 💻, 🔧, 📈)'
              }
            },
            required: ['focus', 'focusDetails', 'sapRelevance', 'approachSuggestion', 'keyInsights', 'focusEmoji']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'analyze_lead_profile' } }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro IA:', response.status, errorText);
    throw new Error(`AI error: ${response.status}`);
  }

  const result = await response.json();
  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  
  if (!toolCall || toolCall.function.name !== 'analyze_lead_profile') {
    throw new Error('Formato de resposta inesperado da IA');
  }

  return JSON.parse(toolCall.function.arguments);
}

// ============================================
// MAIN HANDLER
// ============================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { linkedinUrl } = await req.json();
    
    if (!linkedinUrl) {
      return new Response(
        JSON.stringify({ error: 'linkedinUrl é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Extrair username
    const username = extractLinkedInUsername(linkedinUrl);
    if (!username) {
      return new Response(
        JSON.stringify({ 
          error: 'URL do LinkedIn inválida',
          enriched: false
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processando perfil LinkedIn:', username);

    // 2. Verificar cache
    const cachedData = await checkCache(username);
    if (cachedData) {
      return new Response(
        JSON.stringify({
          ...cachedData,
          enriched: true,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Buscar perfil no Apify
    let profileData;
    try {
      profileData = await fetchLinkedInProfile(username);
    } catch (apifyError) {
      console.error('Erro ao buscar perfil Apify:', apifyError);
      return new Response(
        JSON.stringify({
          error: 'Não foi possível acessar o perfil do LinkedIn',
          enriched: false,
          reason: 'apify_error'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profileData) {
      return new Response(
        JSON.stringify({
          error: 'Perfil não encontrado ou privado',
          enriched: false,
          reason: 'profile_not_found'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Analisar com IA
    let analysis;
    try {
      analysis = await analyzeProfileWithAI(profileData);
    } catch (aiError) {
      console.error('Erro na análise IA:', aiError);
      // Fallback: retornar dados básicos sem análise
      analysis = {
        focus: profileData.headline || 'Profissional',
        focusDetails: 'Análise detalhada não disponível',
        sapRelevance: [],
        approachSuggestion: 'Realizar discovery para entender necessidades',
        keyInsights: [],
        focusEmoji: '💼'
      };
    }

    // 5. Montar resposta
    const enrichedProfile = {
      username,
      fullName: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
      headline: profileData.headline || '',
      focus: analysis.focus,
      focusDetails: analysis.focusDetails,
      focusEmoji: analysis.focusEmoji,
      sapRelevance: analysis.sapRelevance,
      approachSuggestion: analysis.approachSuggestion,
      keyInsights: analysis.keyInsights,
      enriched: true,
      cached: false
    };

    // 6. Salvar no cache
    await saveToCache(username, enrichedProfile);

    console.log('Perfil enriquecido com sucesso:', username, '- Foco:', analysis.focus);

    return new Response(
      JSON.stringify(enrichedProfile),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função enrich-lead-profile:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro interno',
        enriched: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
