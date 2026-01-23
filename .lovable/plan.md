

# Plano: Enriquecimento do Perfil do Lead com Apify LinkedIn Scraper

## Objetivo
Integrar o **Apify LinkedIn Profile Scraper** (Actor `VhxlqQXRwhW8H5hNV`) para analisar o perfil real do lead no LinkedIn e gerar uma descrição inteligente que destaque:
- Foco profissional do lead (dados, manufatura, TI, etc.)
- Experiências e habilidades relevantes para a prospecção SAP
- Sugestão de abordagem personalizada baseada no perfil

## O que será entregue

### 1. Nova Edge Function: `enrich-lead-profile`
Uma função dedicada para buscar dados do LinkedIn via Apify e gerar insights com IA.

**Fluxo da função:**
```text
┌──────────────────────────────────────────────────────────────┐
│  INPUT: linkedinUrl (username ou URL completa)               │
├──────────────────────────────────────────────────────────────┤
│  1. Chamar Apify Actor VhxlqQXRwhW8H5hNV                     │
│     - Extrair: headline, summary, experience, skills         │
│                                                              │
│  2. Enviar dados para IA (Gemini)                            │
│     - Analisar foco profissional                             │
│     - Identificar inclinações (dados, TI, operações, etc.)   │
│     - Gerar sugestão de abordagem                            │
│                                                              │
│  OUTPUT: { enrichedProfile, focus, suggestion, rawData }     │
└──────────────────────────────────────────────────────────────┘
```

### 2. Integração no Playbook
O campo `leadProfile` no Resumo Executivo será enriquecido com:
- **Foco detectado**: ex. "Gestor focado em dados e analytics"
- **Sugestão de abordagem**: ex. "Destacar cases de SAP BW/4HANA e data lakes"

### 3. Interface Visual (PlaybookView)
No card "Perfil do Lead", exibiremos:
- A análise enriquecida do perfil
- Badge indicando o foco detectado (ex: "📊 Orientado a Dados")

## Detalhes Técnicos

### Nova Edge Function: `supabase/functions/enrich-lead-profile/index.ts`

```typescript
// Estrutura principal
const corsHeaders = { ... };

serve(async (req) => {
  const { linkedinUrl } = await req.json();
  
  // 1. Extrair username do LinkedIn
  const username = extractUsername(linkedinUrl);
  
  // 2. Chamar Apify REST API
  const apifyResponse = await fetch(
    `https://api.apify.com/v2/acts/VhxlqQXRwhW8H5hNV/run-sync-get-dataset-items`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${APIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        includeEmail: false
      })
    }
  );
  
  // 3. Analisar perfil com IA
  const profileData = await apifyResponse.json();
  const enrichedAnalysis = await analyzeProfileWithAI(profileData);
  
  return Response.json({ enrichedProfile: enrichedAnalysis });
});
```

### Integração no `generate-playbook/index.ts`

Após a pesquisa de evidências, chamar a nova função se `linkedinUrl` estiver disponível:

```typescript
// Na função principal, após pesquisar evidências
if (leadData.linkedinUrl) {
  const enrichedProfile = await fetch(
    `${supabaseUrl}/functions/v1/enrich-lead-profile`,
    { body: JSON.stringify({ linkedinUrl: leadData.linkedinUrl }) }
  );
  // Usar enrichedProfile.focus e enrichedProfile.suggestion
}
```

### Prompt de Análise (IA)

A IA receberá os dados do LinkedIn e gerará:
```json
{
  "focus": "Gestão de Dados e Analytics",
  "focusDetails": "Profissional com 8+ anos focado em BI, data governance e projetos de modernização de dados",
  "sapRelevance": ["SAP BW/4HANA", "SAP Datasphere", "SAP Analytics Cloud"],
  "approachSuggestion": "Abordar com foco em cases de migração de dados e data lakes. Evitar termos muito técnicos de infraestrutura.",
  "keyInsights": [
    "Experiência anterior em projeto de data lake",
    "Certificação em Power BI - valoriza visualização",
    "Atua como gestor há 3+ anos"
  ]
}
```

### Atualização do Tipo `ExecutiveSummary`

Adicionar campo opcional:
```typescript
export interface ExecutiveSummary {
  // ... campos existentes
  leadProfile: string;
  leadFocus?: string;          // NOVO: "Orientado a Dados"
  leadApproachHint?: string;   // NOVO: Sugestão de abordagem
}
```

### Cache de Resultados

Para evitar custos repetidos com Apify:
- Armazenar resultado na tabela `research_cache` (já existente)
- TTL: 7 dias (perfis profissionais mudam pouco)
- Key: `linkedin_profile_{username}`

## Arquivos a Modificar/Criar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/enrich-lead-profile/index.ts` | **Criar** - Nova edge function |
| `supabase/functions/generate-playbook/index.ts` | **Modificar** - Integrar enriquecimento |
| `src/types/playbook.types.ts` | **Modificar** - Adicionar novos campos |
| `src/components/Playbook/PlaybookView.tsx` | **Modificar** - Exibir foco do lead |
| `supabase/config.toml` | **Modificar** - Registrar nova função |

## Fluxo de Usuário

1. SDR faz upload do print do Salesforce
2. OCR extrai dados incluindo LinkedIn URL (se disponível)
3. Sistema pesquisa evidências (já existe)
4. **NOVO**: Sistema chama Apify para enriquecer perfil
5. **NOVO**: IA analisa perfil e gera insights
6. Playbook é gerado com "Perfil do Lead" enriquecido
7. SDR vê badge de foco e sugestão de abordagem personalizada

## Tratamento de Erros

- **LinkedIn URL não fornecida**: Manter comportamento atual (inferir do cargo)
- **Apify timeout**: Fallback para inferência básica
- **Perfil privado/não encontrado**: Registrar como "Perfil não disponível publicamente"
- **Erro de API**: Não bloquear geração do playbook, apenas logar

## Considerações de Custo

- Apify cobra por execução do Actor (~$0.001-$0.01 por perfil)
- Cache de 7 dias reduz chamadas repetidas
- Apenas consultar quando LinkedIn URL estiver disponível

## Secret já configurada
O `APIFY_API_KEY` já está nos secrets do projeto com o valor que você forneceu.

