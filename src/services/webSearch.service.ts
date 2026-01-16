import type { Evidence } from '../types/playbook.types';
import { supabase } from '@/integrations/supabase/client';

interface WebSearchResult {
  sapEvidences: Evidence[];
  techEvidences: Evidence[];
}

export class WebSearchService {

  async searchCompanyEvidences(
    companyName: string,
    industry?: string
  ): Promise<WebSearchResult> {
    console.log(`🔍 Iniciando pesquisa para: ${companyName}`);

    try {
      // Chamar edge function que faz a pesquisa web
      const { data, error } = await supabase.functions.invoke('research-company', {
        body: {
          company: companyName,
          industry,
        },
      });

      if (error) {
        console.error('❌ Erro na edge function research-company:', error);
        return { sapEvidences: [], techEvidences: [] };
      }

      const evidences: Evidence[] = (data?.evidences || []).map((e: Evidence) => ({
        title: e.title,
        indication: e.indication || 'Informação relevante para prospecção',
        link: e.link,
        source: e.source || 'Web',
        date: e.date || '',
        category: 'SAP'
      }));

      // Dividir evidências entre SAP e Tech
      const sapEvidences = evidences.slice(0, 3);
      const techEvidences = evidences.slice(3, 6);

      console.log(`✅ Encontradas ${sapEvidences.length} evidências SAP e ${techEvidences.length} evidências de tecnologia`);

      return {
        sapEvidences,
        techEvidences
      };

    } catch (error) {
      console.error('❌ Erro na pesquisa de evidências:', error);
      return { sapEvidences: [], techEvidences: [] };
    }
  }
}

export const webSearchService = new WebSearchService();
