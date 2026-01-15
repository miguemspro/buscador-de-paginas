import { supabase } from '@/integrations/supabase/client';
import type { ExtractedLeadData, GeneratedPlaybook } from '@/types/playbook.types';

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
  
  const { data, error } = await supabase.functions.invoke('generate-playbook', {
    body: { leadData },
  });

  if (error) {
    console.error('Erro na geração:', error);
    throw new Error('Falha ao gerar playbook');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.playbook;
}
