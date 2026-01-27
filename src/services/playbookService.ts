import { supabase } from '@/integrations/supabase/client';
import type { ExtractedLeadData, GeneratedPlaybook } from '@/types/playbook.types';
import { webSearchService } from './webSearch.service';

// Sanitiza dados removendo valores null (converte para undefined)
// Isso garante compatibilidade com o schema Zod da edge function
function sanitizeLeadData(data: ExtractedLeadData): ExtractedLeadData {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined && value !== '') {
      sanitized[key] = value;
    }
  }
  return sanitized as ExtractedLeadData;
}

export async function extractLeadFromImage(base64Image: string): Promise<ExtractedLeadData> {
  const { data, error } = await supabase.functions.invoke('extract-salesforce-data', {
    body: { imageBase64: base64Image },
  });

  if (error) {
    console.error('Erro na extração:', error);
    throw new Error('Falha ao extrair dados da imagem');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  // A edge function retorna { leadInfo: ... }
  // Sanitizar os dados para remover nulls
  return sanitizeLeadData(data.leadInfo);
}

export async function generatePlaybook(leadData: ExtractedLeadData): Promise<GeneratedPlaybook> {
  // Sanitizar dados antes de enviar (defesa em profundidade)
  const sanitizedData = sanitizeLeadData(leadData);
  console.log('Enviando para generate-playbook:', sanitizedData);

  // Executar geração do playbook e pesquisa de evidências em paralelo
  const [playbookResult, evidencesResult] = await Promise.all([
    supabase.functions.invoke('generate-playbook', {
      body: { leadData: sanitizedData },
    }),
    // Pesquisar evidências reais sobre a empresa
    sanitizedData.company
      ? webSearchService.searchCompanyEvidences(sanitizedData.company, sanitizedData.industry)
      : Promise.resolve({ sapEvidences: [], techEvidences: [] })
  ]);

  const { data, error } = playbookResult;

  if (error) {
    console.error('Erro na geração:', error);
    throw new Error('Falha ao gerar playbook');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  // Combinar evidências SAP e Tech com categorias
  const allEvidences = [
    ...evidencesResult.sapEvidences.map(e => ({ ...e, category: 'SAP' as const })),
    ...evidencesResult.techEvidences.map(e => ({ ...e, category: 'Tecnologia' as const }))
  ];

  // Retornar playbook com evidências reais
  return {
    ...data.playbook,
    evidences: allEvidences.length > 0 ? allEvidences : data.playbook.evidences
  };
}
