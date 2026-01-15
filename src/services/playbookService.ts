import { supabase } from '@/integrations/supabase/client';
import type { ExtractedLeadData, GeneratedPlaybook } from '@/types/playbook.types';
import { webSearchService } from './webSearch.service';

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
  return data.leadInfo;
}

export async function generatePlaybook(leadData: ExtractedLeadData): Promise<GeneratedPlaybook> {
  console.log('Enviando para generate-playbook:', leadData);

  // Executar geração do playbook e pesquisa de evidências em paralelo
  const [playbookResult, evidencesResult] = await Promise.all([
    supabase.functions.invoke('generate-playbook', {
      body: { leadData },
    }),
    // Pesquisar evidências reais sobre a empresa
    leadData.company
      ? webSearchService.searchCompanyEvidences(leadData.company, leadData.industry)
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
