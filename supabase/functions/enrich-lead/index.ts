import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Dados retornados pelo Apify LinkedIn Profile Scraper
interface LinkedInProfile {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  headline?: string;
  summary?: string;
  location?: string;
  profilePicture?: string;
  connectionCount?: number;
  followersCount?: number;
  experience?: Array<{
    title?: string;
    companyName?: string;
    company?: string;
    duration?: string;
    description?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
  }>;
  education?: Array<{
    schoolName?: string;
    school?: string;
    degreeName?: string;
    degree?: string;
    fieldOfStudy?: string;
    field?: string;
  }>;
  skills?: Array<string | { name?: string }>;
  languages?: Array<string | { name?: string }>;
}

interface EnrichedLeadProfile {
  linkedinUrl: string;
  fullName: string;
  headline: string;
  summary: string;
  currentRole: string;
  currentCompany: string;
  experienceYears: number;
  topSkills: string[];
  educationSummary: string;
  profileDescription: string;
}

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

    const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY');
    if (!APIFY_API_KEY) {
      throw new Error('APIFY_API_KEY não configurada');
    }

    console.log('Enriquecendo perfil:', linkedinUrl);

    // Chamar Apify Actor (run-sync-get-dataset-items para resposta síncrona)
    const actorId = '2SyF0bVxmgGr8IVCZ'; // dev_fusion/Linkedin-Profile-Scraper
    const apifyUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_API_KEY}`;

    const apifyResponse = await fetch(apifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileUrls: [linkedinUrl],
        proxy: {
          useApifyProxy: true,
          apifyProxyGroups: ["RESIDENTIAL"]
        }
      }),
    });

    if (!apifyResponse.ok) {
      const errorText = await apifyResponse.text();
      console.error('Erro Apify:', apifyResponse.status, errorText);
      throw new Error(`Erro ao buscar perfil no Apify: ${apifyResponse.status}`);
    }

    const profiles: LinkedInProfile[] = await apifyResponse.json();
    
    if (!profiles || profiles.length === 0) {
      throw new Error('Perfil não encontrado no LinkedIn');
    }

    const profile = profiles[0];
    console.log('Perfil encontrado:', profile.fullName || `${profile.firstName} ${profile.lastName}`);

    // Processar e gerar descrição
    const enrichedProfile = processProfile(profile, linkedinUrl);

    return new Response(
      JSON.stringify({ profile: enrichedProfile }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao enriquecer lead:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        profile: null 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function processProfile(profile: LinkedInProfile, linkedinUrl: string): EnrichedLeadProfile {
  // Extrair nome completo
  const fullName = profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Não informado';
  
  // Extrair experiência atual
  const currentExp = profile.experience?.[0];
  const currentRole = currentExp?.title || 'Não informado';
  const currentCompany = currentExp?.companyName || currentExp?.company || 'Não informado';
  
  // Calcular anos de experiência
  let experienceYears = 0;
  if (profile.experience) {
    profile.experience.forEach(exp => {
      // Tentar parsear duração (ex: "3 anos 2 meses", "3 yrs 2 mos")
      const durationStr = exp.duration || '';
      const yearsMatch = durationStr.match(/(\d+)\s*(anos?|yrs?|years?)/i);
      const monthsMatch = durationStr.match(/(\d+)\s*(meses?|mos?|months?)/i);
      
      if (yearsMatch) {
        experienceYears += parseInt(yearsMatch[1]);
      }
      if (monthsMatch) {
        experienceYears += parseInt(monthsMatch[1]) / 12;
      }
    });
  }
  experienceYears = Math.round(experienceYears);

  // Top 5 skills
  const topSkills: string[] = [];
  if (profile.skills) {
    for (const skill of profile.skills.slice(0, 5)) {
      if (typeof skill === 'string') {
        topSkills.push(skill);
      } else if (skill?.name) {
        topSkills.push(skill.name);
      }
    }
  }

  // Resumo de educação
  const education = profile.education?.[0];
  let educationSummary = 'Não informado';
  if (education) {
    const school = education.schoolName || education.school || '';
    const degree = education.degreeName || education.degree || '';
    const field = education.fieldOfStudy || education.field || '';
    
    const parts = [degree, field, school].filter(Boolean);
    if (parts.length > 0) {
      educationSummary = parts.join(' - ');
    }
  }

  // Gerar descrição completa do perfil
  const profileDescription = generateProfileDescription({
    fullName,
    headline: profile.headline || '',
    currentRole,
    currentCompany,
    experienceYears,
    topSkills,
    summary: profile.summary || '',
    education: educationSummary
  });

  return {
    linkedinUrl,
    fullName,
    headline: profile.headline || '',
    summary: profile.summary || '',
    currentRole,
    currentCompany,
    experienceYears,
    topSkills,
    educationSummary,
    profileDescription
  };
}

function generateProfileDescription(data: {
  fullName: string;
  headline: string;
  currentRole: string;
  currentCompany: string;
  experienceYears: number;
  topSkills: string[];
  summary: string;
  education: string;
}): string {
  const parts: string[] = [];

  // Linha 1: Nome e cargo atual
  if (data.currentRole !== 'Não informado' && data.currentCompany !== 'Não informado') {
    parts.push(`${data.fullName} atua como ${data.currentRole} na ${data.currentCompany}.`);
  } else if (data.currentRole !== 'Não informado') {
    parts.push(`${data.fullName} atua como ${data.currentRole}.`);
  } else {
    parts.push(`${data.fullName}.`);
  }

  // Linha 2: Experiência
  if (data.experienceYears > 0) {
    parts.push(`Possui mais de ${data.experienceYears} anos de experiência profissional.`);
  }

  // Linha 3: Headline (se diferente do cargo)
  if (data.headline && !data.headline.toLowerCase().includes(data.currentRole.toLowerCase().substring(0, 10))) {
    parts.push(`Se posiciona como "${data.headline}".`);
  }

  // Linha 4: Skills relevantes
  if (data.topSkills.length > 0) {
    const skillsText = data.topSkills.slice(0, 4).join(', ');
    parts.push(`Principais competências: ${skillsText}.`);
  }

  // Linha 5: Formação
  if (data.education && data.education !== 'Não informado') {
    parts.push(`Formação: ${data.education}.`);
  }

  return parts.join(' ');
}
