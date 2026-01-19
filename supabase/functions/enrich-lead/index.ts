import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Dados retornados pelo Apify LinkedIn Profile Scraper (dev_fusion)
// Baseado na documentação: https://apify.com/dev_fusion/linkedin-profile-scraper
interface LinkedInProfile {
  // Main profile data
  linkedinUrl?: string;
  linkedinPublicUrl?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  headline?: string;
  connections?: number;
  followers?: number;
  email?: string;
  mobileNumber?: string;
  publicIdentifier?: string;
  
  // Current job
  jobTitle?: string;
  jobStartedOn?: string;
  jobLocation?: string;
  jobStillWorking?: boolean;
  currentJobDuration?: string;
  currentJobDurationInYrs?: number;
  companyName?: string;
  companyIndustry?: string;
  companyWebsite?: string;
  companyLinkedin?: string;
  companySize?: string;
  
  // Experience array
  experiences?: Array<{
    companyId?: string;
    companyName?: string;
    title?: string;
    jobDescription?: string;
    jobStartedOn?: string;
    jobEndedOn?: string | null;
    jobStillWorking?: boolean;
    jobLocation?: string;
    companyWebsite?: string;
    companyIndustry?: string;
    companySize?: string;
  }>;
  
  // Education array
  educations?: Array<{
    schoolName?: string;
    degreeName?: string;
    fieldOfStudy?: string;
    startedOn?: string;
    endedOn?: string;
  }>;
  
  // Skills array
  skills?: Array<{ title?: string } | string>;
  
  // Languages
  languages?: Array<{ name?: string } | string>;
  
  // Error handling
  succeeded?: boolean;
  error?: string;
  inputUrl?: string;
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
        profileUrls: [linkedinUrl]
      }),
    });

    if (!apifyResponse.ok) {
      const errorText = await apifyResponse.text();
      console.error('Erro Apify:', apifyResponse.status, errorText);
      throw new Error(`Erro ao buscar perfil no Apify: ${apifyResponse.status}`);
    }

    const profiles: LinkedInProfile[] = await apifyResponse.json();
    console.log('Resposta Apify recebida:', JSON.stringify(profiles, null, 2).substring(0, 1000));
    
    if (!profiles || profiles.length === 0) {
      throw new Error('Perfil não encontrado no LinkedIn');
    }

    const profile = profiles[0];
    
    // Verificar se houve erro no perfil
    if (profile.succeeded === false) {
      console.error('Apify retornou erro:', profile.error);
      throw new Error(profile.error || 'Perfil não pode ser enriquecido');
    }
    
    console.log('Perfil encontrado:', profile.fullName || `${profile.firstName} ${profile.lastName}`);

    // Processar e gerar descrição
    const enrichedProfile = processProfile(profile, linkedinUrl);
    console.log('Perfil processado:', enrichedProfile.fullName, '-', enrichedProfile.currentRole);

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
  
  // Extrair cargo atual - primeiro do jobTitle, depois do experiences
  let currentRole = profile.jobTitle || '';
  let currentCompany = profile.companyName || '';
  
  // Se não tiver jobTitle, pegar do primeiro experience
  if (!currentRole && profile.experiences && profile.experiences.length > 0) {
    const firstExp = profile.experiences[0];
    currentRole = firstExp.title || '';
    currentCompany = currentCompany || firstExp.companyName || '';
  }
  
  currentRole = currentRole || 'Não informado';
  currentCompany = currentCompany || 'Não informado';
  
  // Calcular anos de experiência
  let experienceYears = 0;
  
  // Primeiro tentar do currentJobDurationInYrs
  if (profile.currentJobDurationInYrs) {
    experienceYears = Math.round(profile.currentJobDurationInYrs);
  }
  
  // Se tiver experiences, somar duração total
  if (profile.experiences && profile.experiences.length > 0) {
    let totalYears = 0;
    for (const exp of profile.experiences) {
      if (exp.jobStartedOn) {
        const startYear = parseInt(exp.jobStartedOn.split('-')[0]);
        const endYear = exp.jobEndedOn 
          ? parseInt(exp.jobEndedOn.split('-')[0]) 
          : new Date().getFullYear();
        totalYears += (endYear - startYear);
      }
    }
    if (totalYears > experienceYears) {
      experienceYears = totalYears;
    }
  }

  // Top 5 skills
  const topSkills: string[] = [];
  if (profile.skills) {
    for (const skill of profile.skills.slice(0, 5)) {
      if (typeof skill === 'string') {
        topSkills.push(skill);
      } else if (skill?.title) {
        topSkills.push(skill.title);
      }
    }
  }

  // Resumo de educação
  let educationSummary = 'Não informado';
  if (profile.educations && profile.educations.length > 0) {
    const education = profile.educations[0];
    const school = education.schoolName || '';
    const degree = education.degreeName || '';
    const field = education.fieldOfStudy || '';
    
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
    companyIndustry: profile.companyIndustry || '',
    education: educationSummary
  });

  return {
    linkedinUrl,
    fullName,
    headline: profile.headline || '',
    summary: '', // Apify não retorna summary no formato atual
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
  companyIndustry: string;
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
  if (data.headline && data.currentRole !== 'Não informado' && 
      !data.headline.toLowerCase().includes(data.currentRole.toLowerCase().substring(0, 10))) {
    parts.push(`Se posiciona como "${data.headline}".`);
  } else if (data.headline && data.currentRole === 'Não informado') {
    parts.push(`${data.headline}.`);
  }

  // Linha 4: Indústria
  if (data.companyIndustry) {
    parts.push(`Atua no setor de ${data.companyIndustry}.`);
  }

  // Linha 5: Skills relevantes
  if (data.topSkills.length > 0) {
    const skillsText = data.topSkills.slice(0, 4).join(', ');
    parts.push(`Principais competências: ${skillsText}.`);
  }

  // Linha 6: Formação
  if (data.education && data.education !== 'Não informado') {
    parts.push(`Formação: ${data.education}.`);
  }

  return parts.join(' ');
}
