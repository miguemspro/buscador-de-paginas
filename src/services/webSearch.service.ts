import OpenAI from 'openai';
import type { Evidence } from '../types/playbook.types';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

const openai = new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true,
});

interface WebSearchResult {
  sapEvidences: Evidence[];
  techEvidences: Evidence[];
}

export class WebSearchService {

  async searchCompanyEvidences(
    companyName: string,
    industry?: string
  ): Promise<WebSearchResult> {
    if (!API_KEY || API_KEY === 'sua-chave-openai-aqui') {
      console.warn('API Key não configurada corretamente');
      return { sapEvidences: [], techEvidences: [] };
    }

    console.log(`🔍 Iniciando pesquisa para: ${companyName}`);

    try {
      // Queries específicas para pesquisa
      const sapQuery = `${companyName} SAP ERP sistema gestão`;
      const integrationQuery = `${companyName} integração automação tecnologia`;
      const techQuery = `${companyName} transformação digital investimentos TI`;

      // Executar pesquisas em paralelo
      const [sapResults, techResults] = await Promise.all([
        this.executeWebSearch(sapQuery, companyName, 'SAP', industry),
        this.executeWebSearch(techQuery, companyName, 'Tecnologia', industry)
      ]);

      // Busca adicional se não encontrou resultados
      let additionalSap: Evidence[] = [];
      let additionalTech: Evidence[] = [];

      if (sapResults.length < 3) {
        additionalSap = await this.executeWebSearch(integrationQuery, companyName, 'SAP', industry);
      }
      if (techResults.length < 3) {
        additionalTech = await this.executeWebSearch(`${companyName} notícias inovação`, companyName, 'Tecnologia', industry);
      }

      const allSap = this.removeDuplicates([...sapResults, ...additionalSap]).slice(0, 3);
      const allTech = this.removeDuplicates([...techResults, ...additionalTech]).slice(0, 3);

      console.log(`✅ Encontradas ${allSap.length} evidências SAP e ${allTech.length} evidências de tecnologia`);

      return {
        sapEvidences: allSap,
        techEvidences: allTech
      };

    } catch (error) {
      console.error('❌ Erro na pesquisa de evidências:', error);
      return { sapEvidences: [], techEvidences: [] };
    }
  }

  private async executeWebSearch(
    query: string,
    companyName: string,
    category: 'SAP' | 'Tecnologia',
    industry?: string
  ): Promise<Evidence[]> {
    console.log(`🔎 Pesquisando: "${query}"`);

    try {
      // Usar a API responses com web_search_preview
      const response = await openai.responses.create({
        model: 'gpt-4o',
        tools: [{ type: 'web_search_preview' }],
        input: `Pesquise na internet sobre: "${query}"

${industry ? `Setor da empresa: ${industry}` : ''}

Encontre notícias, artigos ou informações REAIS e RECENTES sobre a empresa ${companyName}.

Para CADA informação encontrada, forneça em formato estruturado:
- Título exato da notícia/artigo
- O que essa informação indica para prospecção de ${category === 'SAP' ? 'soluções SAP/ERP' : 'soluções de tecnologia'}
- URL completa da fonte original
- Nome da fonte (ex: Valor Econômico, LinkedIn, TI Inside)
- Data da publicação

IMPORTANTE:
- Inclua TODAS as URLs que você encontrar nos resultados da busca
- Retorne no máximo 3 evidências
- Formato JSON obrigatório:

{
  "evidences": [
    {
      "title": "Título da notícia",
      "indication": "O que indica para prospecção",
      "link": "https://url-completa.com/artigo",
      "source": "Nome da Fonte",
      "date": "Mês Ano"
    }
  ]
}

Se não encontrar informações específicas sobre ${category}, retorne {"evidences": []}`
      });

      const outputText = response.output_text || '';
      console.log(`📄 Resposta recebida para "${query}"`);

      // Primeiro tentar extrair JSON
      let evidences = this.parseJsonEvidences(outputText, category);

      // Se não conseguiu JSON, extrair do texto
      if (evidences.length === 0) {
        evidences = this.extractEvidencesFromText(outputText, companyName, category);
      }

      return evidences;

    } catch (error) {
      console.error(`❌ Erro na pesquisa "${query}":`, error);
      return [];
    }
  }

  private parseJsonEvidences(content: string, category: 'SAP' | 'Tecnologia'): Evidence[] {
    try {
      const jsonMatch = content.match(/\{[\s\S]*"evidences"[\s\S]*\}/);

      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.evidences || !Array.isArray(parsed.evidences)) return [];

      return parsed.evidences
        .filter((e: Evidence) => e.title && e.link && e.link.startsWith('http'))
        .map((e: Evidence) => ({
          title: e.title,
          indication: e.indication || 'Informação relevante para prospecção',
          link: e.link,
          source: e.source || 'Web',
          date: e.date || '',
          category: category
        }));

    } catch {
      return [];
    }
  }

  private extractEvidencesFromText(text: string, companyName: string, category: 'SAP' | 'Tecnologia'): Evidence[] {
    const evidences: Evidence[] = [];

    // Extrair URLs do texto usando regex
    const urlRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
    const markdownLinks: Array<{ text: string; url: string }> = [];

    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      markdownLinks.push({ text: match[1], url: match[2] });
    }

    // Também buscar URLs simples
    const simpleUrlRegex = /https?:\/\/[^\s\)\]]+/g;
    const simpleUrls = text.match(simpleUrlRegex) || [];

    // Criar evidências a partir dos links encontrados
    for (const link of markdownLinks) {
      if (evidences.length >= 3) break;

      // Extrair contexto ao redor do link
      const urlIndex = text.indexOf(link.url);
      const contextStart = Math.max(0, urlIndex - 200);
      const contextEnd = Math.min(text.length, urlIndex + 200);
      const context = text.slice(contextStart, contextEnd);

      evidences.push({
        title: this.cleanTitle(link.text) || `Informação sobre ${companyName}`,
        indication: this.extractIndication(context, category),
        link: link.url.replace(/\?utm_source=openai$/, ''),
        source: this.extractSourceFromUrl(link.url),
        date: this.extractDate(context),
        category: category
      });
    }

    // Se não encontrou links markdown, usar URLs simples
    if (evidences.length === 0) {
      for (const url of simpleUrls) {
        if (evidences.length >= 3) break;
        if (url.includes('openai.com')) continue;

        const urlIndex = text.indexOf(url);
        const contextStart = Math.max(0, urlIndex - 200);
        const contextEnd = Math.min(text.length, urlIndex + 200);
        const context = text.slice(contextStart, contextEnd);

        evidences.push({
          title: this.extractTitleFromContext(context, companyName),
          indication: this.extractIndication(context, category),
          link: url.replace(/\?utm_source=openai$/, ''),
          source: this.extractSourceFromUrl(url),
          date: this.extractDate(context),
          category: category
        });
      }
    }

    return evidences;
  }

  private cleanTitle(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 150);
  }

  private extractTitleFromContext(context: string, companyName: string): string {
    // Tentar encontrar um título no contexto
    const sentences = context.split(/[.!?]/);
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(companyName.toLowerCase()) && sentence.length > 20) {
        return this.cleanTitle(sentence);
      }
    }
    return `Informação sobre ${companyName}`;
  }

  private extractIndication(context: string, category: string): string {
    const keywords = category === 'SAP'
      ? ['SAP', 'ERP', 'sistema', 'gestão', 'implementa', 'projeto']
      : ['tecnologia', 'digital', 'inovação', 'investimento', 'TI'];

    for (const keyword of keywords) {
      if (context.toLowerCase().includes(keyword.toLowerCase())) {
        return `Indica ${category === 'SAP' ? 'uso ou interesse em soluções SAP/ERP' : 'investimentos em tecnologia e inovação'}`;
      }
    }
    return 'Informação relevante para prospecção';
  }

  private extractSourceFromUrl(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      const domain = hostname.replace('www.', '').split('.')[0];

      const sourceMap: Record<string, string> = {
        'linkedin': 'LinkedIn',
        'tiinside': 'TI Inside',
        'valor': 'Valor Econômico',
        'exame': 'Exame',
        'infomoney': 'InfoMoney',
        'terra': 'Terra',
        'uol': 'UOL',
        'globo': 'O Globo',
        'estadao': 'Estadão',
        'folha': 'Folha de S.Paulo',
        'computerworld': 'Computerworld',
        'canaltech': 'Canaltech',
        'tecmundo': 'TecMundo'
      };

      return sourceMap[domain] || domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
      return 'Web';
    }
  }

  private extractDate(context: string): string {
    // Tentar encontrar datas no formato comum
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{1,2} de \w+ de \d{4})/i,
      /(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+(?:de\s+)?(\d{4})/i,
      /(\d{4})/
    ];

    for (const pattern of datePatterns) {
      const match = context.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return '';
  }

  private removeDuplicates(evidences: Evidence[]): Evidence[] {
    const seen = new Set<string>();
    return evidences.filter(e => {
      const key = e.link.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export const webSearchService = new WebSearchService();
