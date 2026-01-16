1. Visão geral da arquitetura
Componentes principais

Orquestrador de etapas
Ingestão do lead a partir de print e anotações do SDR
Pesquisa pública com grounding na web
Enriquecimento setorial concorrencial
Verificação de fatos e citações
Motor de “dores prováveis” e mapeamento para portfólio Meta IT com sensibilidade a cargo
Base de cases Meta IT com ranqueamento por similaridade
Geração dos entregáveis em Markdown para a sua UI

Pilha recomendada

LLM: Azure OpenAI GPT 4o para chat e geração, com web grounding via Bing no Azure AI Foundry. É o padrão para respostas com citações e busca pública. [legalclarity.org], [dicloak.com]
Grounding em conteúdo corporativo M365: Microsoft 365 Copilot Retrieval API para buscar textos de SharePoint e OneDrive com respeito a permissões. Útil para seu banco de cases e materiais internos. [learn.microsoft.com], [microsoft.github.io]
Conectores para sistemas terceiros: Copilot Connectors quando quiser indexar fontes oficiais suportadas no tenant. Não há conector público para LinkedIn prospecção. [learn.microsoft.com], [azureinteg...ations.com]
Observação legal sobre LinkedIn: uso de APIs para geração de leads é restrito e scraping automatizado viola as políticas. Só trabalhar com páginas e perfis públicos acessíveis via web search, ou dados que você mesmo forneça. [taggbox.com], [techcommun...rosoft.com]

2. Fluxo em etapas que evita “buscar tudo de uma vez”
Etapa 0 Intake

Input: imagem do lead que você colou na interface e campos manuais opcionais.
Ação: OCR do print com Azure AI Vision e extração de nome, cargo, empresa, localização e observações do SDR.
Saída: LeadCard padronizada.

Etapa 1 Contexto da empresa

Ação: web research para site institucional, descrição do negócio, presença SAP pública, releases de imprensa, vagas técnicas. Citar 1 a 2 links por afirmação.
Ferramenta: agente com grounding Bing no Azure AI Foundry. [legalclarity.org], [dicloak.com]

Etapa 2 Perfil do lead

Ação: sumarizar pontos do perfil do LinkedIn quando a página é pública e indexada pela web. Se não houver fonte pública, usar somente o que veio do seu print.
Compliance: sem scraping, sem API privada do LinkedIn. [techcommun...rosoft.com]

Etapa 3 Prioridades 2026 e 2027 por setor

Ação: sinais setoriais e movimentos de concorrentes, citando notícias, estudos de mercado e comunicados SAP relevantes ao setor.
Ferramenta: web grounding e cache de notícias por NAICS ou CNAE.

Etapa 4 Evidências e notícias tecnológicas na conta

Ação: focar SAP em primeiro plano, depois temas secundários. Sempre com link e data quando existir.
Regra: se algo for inferência fraca, rotular com “vi sinais públicos de...” ou converter em pergunta no discovery.

Etapa 5 Dores prováveis

Ação: gerar 10 dores com base nas evidências, no estágio SAP presumido e no foco do lead. Exemplo: se há notícia de migração S 4HANA recente, dores de estabilização, dados mestres e integrações.
Observação: calibrar por cargo e poder de decisão.

Etapa 6 Como a Meta IT pode ajudar

Ação: mapear 1 a 1 dor para capacidade da Meta IT, descrevendo resultado esperado em 1 frase, sem promessas absolutas e sem “oferecer” antes de diagnosticar.
Sensibilidade a cargo: não sugerir Reforma Tributária para um Key User MM, por exemplo.

Etapa 7 Seleção de case Meta mais aderente

Ação: base de cases própria com vetores, ranqueada por setor, produto vendido, módulos SAP, contexto do lead e estágio de jornada.
Fonte: SharePoint da Meta IT integrado via Retrieval API para manter permissionamento. [learn.microsoft.com]

Etapa 8 Entregáveis

Saída final em Markdown para sua UI: Resumo executivo, Evidências e notícias, Dores prováveis, Como a Meta pode ajudar, Perguntas de discovery e Texto de abordagem.

3. Esquema de dados recomendado
3.1 LeadCard

{
  "empresa": "string",
  "site": "string",
  "segmento": "string",
  "regiao": "string",
  "lead_nome": "string",
  "lead_cargo": "string",
  "fonte_perfil_publico": "url|null",
  "anotacoes_sdr": "string",
  "data_captura": "date"
}


3.2 Evidencia

{
  "tipo": "empresa|lead|setor|concorrente",
  "titulo": "string",
  "descricao": "string",
  "data_publicacao": "date|null",
  "links": ["url", "url?"],
  "relevancia_sap": 1
}

3.3 DorProvavel

{
  "descricao": "string",
  "motivo_baseado_em": ["id_evidencia", "segmento", "cargo_lead"],
  "prioridade": 1
}

3.4 SolucaoMeta

{
  "dor_id": "ref",
  "capacidade_meta": "S4HANA|BTP|CPI|PI/PO|Fiori|SolMan|Ariba|SuccessFactors|DRC|SAC/BW/BO|GRC|Basis|AMS|Smart AMS|Operacao assistida|Squads|Dados e IA",
  "resultado_esperado": "string",
  "restricao_por_cargo": ["C-level","Diretor","Gerente","Especialista","Key User"]
}

Quero criar um banco de dados com soluções da meta

3.5 CaseMeta

{
  "cliente": "string",
  "setor": "string",
  "pais": "string",
  "produto_vendido": "string",
  "modulos_sap": ["MM","SD","FI","CO","PP", "TM", "EWM", "etc"],
  "tipo_projeto": "implementacao|migracao|upgrade|AMS|dados|BTP|DRC|analytics",
  "resultado_chave": "string",
  "link_case": "url",
  "embedding": "vetor"
}
``
Quero criar um banco de dados com cases da meta

4. APIs e serviços por módulo

OCR do print do lead
Azure AI Vision Read API para extrair texto de screenshots com alta precisão.
Justificativa: serviço gerenciado da Microsoft, fácil integrar serverless.
Pesquisa pública em etapas com citações
Agente no Azure AI Foundry com ferramenta Web Search Bing habilitada. Exposição como endpoint REST para seu backend. [dicloak.com]
Grounding em conteúdo interno e cases
Microsoft 365 Copilot Retrieval API para retornar trechos de SharePoint OneDrive e conectores, respeitando ACL. [learn.microsoft.com]
Vetorização e ranking de cases
Azure AI Search com índice híbrido texto mais vetor para ranquear o melhor case por similaridade. [blog.closelyhq.com]
LLM principal
Azure OpenAI GPT 4o para raciocínio e geração final com instruções de não inventar, citar fontes e usar PT BR. [legalclarity.org]

Observações sobre LinkedIn

Não usar API do LinkedIn para gerar leads prospecção. É restrito.
Não usar scraping ou extensões automatizadas. Violam a política.
Somente páginas públicas e dados que você enviar manualmente. [taggbox.com], [techcommun...rosoft.com]

5. Orquestração técnica
Use um orquestrador com estado para garantir a execução passo a passo e o cache entre etapas. Opções:

Azure Functions Durable Functions ou um workflow no seu backend.
Cada etapa chama o agente de pesquisa com escopo limitado e instruções específicas.
Implemente cache de resultados por 24 a 72 horas por domínio e por lead para reduzir custo e garantir consistência entre rodadas.

Controle de qualidade

Validador de citações: rejeita afirmações sem ao menos 1 link, idealmente 2.
Classificador de confiança: marca evidências fracas para virar pergunta no discovery.
Filtros de compliance para remover sugestões de solução antes da fase discovery.

6. Prompting operacional dos agentes
Exemplo de prompts por etapa
Pesquisa da empresa
Objetivo: coletar 5 a 8 evidências sobre a EMPRESA focando SAP e tecnologia. 
Regras: PT-BR. Não inventar. Toda afirmação com 1 a 2 links. Se não houver confirmação, use "vi sinais públicos de..." ou transforme em pergunta.
Prioridade de fontes: site institucional e imprensa, SAP News Center, veículos de negócios setoriais.
Entregue JSON Evidencia[] com titulo, descricao, data_publicacao, links, relevancia_sap.

Dores prováveis
Objetivo: derivar 10 dores com base nas evidências e no segmento.
Regras: 1 frase cada. Ordenar por prioridade. Amarre cada dor a 1 ou mais evidencias por id. 
Se o lead for Key User, evitar dores de decisão C-level.

Mapeamento para Meta IT
Objetivo: mapear 1 para 1 cada dor em uma capacidade da Meta IT.
Regras: descrever resultado esperado em 1 frase. Não prometer resultado absoluto. 
Aplicar restrição por cargo para evitar desalinhamento.

Seleção de case
Objetivo: escolher 1 a 3 cases com maior similaridade ao setor, produto, módulos e dores.
Regras: usar embeddings do CaseMeta.embedding e ranking de Azure AI Search. Retornar cliente, tipo_projeto, resultado_chave e link_case.

Geração final
Objetivo: produzir o pacote em Markdown para a UI.
Regras: PT-BR. Sem travessão. Citações com links nas Evidências. Tom consultivo, objetivo. Não oferecer produto antes de diagnosticar.

7. Integração com sua UI atual
Na tela que você mostrou, inclua um cabeçalho de progresso por etapas e status por bloco

Resumo
Evidências
Dores
Soluções
Discovery
Abordagem

Cada bloco deve exibir o número de fontes usadas e um ícone de confiança. Se o bloco tiver itens com “sinais públicos”, destaque para o SDR validar na call.
8. Métricas para ficar “melhor do mercado”

Cobertura de fontes por conta e por setor
Percentual de afirmações com 2 links
Taxa de revisão manual necessária
Tempo médio de geração por etapa
Taxa de resposta positiva a partir do texto de abordagem
Taxa de acurácia das dores percebidas após a call de discovery

9. Roadmap incremental
Fase 1

OCR do print
Agente de pesquisa por etapas com Bing grounding
Geração dos entregáveis com citações

Fase 2

Banco de cases com embeddings em Azure AI Search
Ranqueamento de case por similaridade
Afinar mapeamento dor para solução com sensibilidade a cargo

Fase 3

Integração Retrieval API para buscar cases e playbooks internos direto do SharePoint com permissão de leitura e citá-los no output
Painel de métricas e feedback loop do SDR para melhorar prompts e reclassificação automática [learn.microsoft.com]


10. Exemplo de contrato de API entre backend e agente

Request para etapa de empresa

POST /api/research/company
{
  "empresa": "ACME Alimentos",
  "site": "https://www.acme.com.br",
  "segmento": "Alimentos",
  "regiao": "BR",
  "escopo": ["SAP","tecnologia","projetos"]
}

Response

{
  "evidencias": [
    {
      "id": "ev1",
      "titulo": "ACME anuncia programa de transformação digital",
      "descricao": "Com foco em SAP e analytics...",
      "data_publicacao": "2025-09-14",
      "links": [
        "https://www.acme.com.br/imprensa/transformacao-digital",
        "https://www.vehiculodenoticias.com.br/acme-sap"
      ],
      "relevancia_sap": 1
    }
  ],
  "observacoes": ["vi sinais públicos de plano S4HANA sem data confirmada"]
}
11. Por que esta combinação de APIs e serviços

11. Por que esta combinação de APIs e serviços

Web search com grounding no Azure AI Foundry oferece respostas com citações e proteção empresarial, reduz alucinações e é o caminho indicado para apps que precisam de web atual. [legalclarity.org], [dicloak.com]
Retrieval API do Copilot libera grounding seguro em documentos internos sem replicar permissões ou montar índice próprio, ideal para cases Meta. [learn.microsoft.com]
Copilot Connectors ampliam busca para sistemas suportados no tenant, mantendo governança. [learn.microsoft.com]
Restrições do LinkedIn exigem estratégia baseada em fontes públicas e dados fornecidos pelo usuário, evitando APIs de lead gen e scraping. [taggbox.com], [techcommun...rosoft.com]

