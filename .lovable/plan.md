

# Plano: Motor de Soluções Verdadeiramente Personalizado

## Problema Atual

Após análise do código, identifiquei os problemas principais:

1. **Dependência exclusiva do banco de dados**: O sistema APENAS mapeia soluções existentes na tabela `meta_solutions`
2. **Filtro de cargo quebrado**: Target roles no banco (`CEO`, `Gerente de TI`) não correspondem às categorias do filtro (`C-level`, `Gerente`)
3. **Sem capacidade de criar soluções novas**: Se nenhuma solução do banco faz match, a seção fica vazia
4. **Descrições ainda genéricas**: O prompt de personalização não está gerando contexto suficientemente específico
5. **Falta sinalização de origem**: Não indica se a solução é "existente" ou "recomendação nova"

## Nova Arquitetura: Motor de Soluções Híbrido

O sistema terá dois modos de operação:

1. **Modo 1 - Soluções Mapeadas**: Match com soluções existentes no banco (como hoje, mas melhorado)
2. **Modo 2 - Soluções Geradas por IA**: Quando não há match suficiente, a IA cria soluções personalizadas baseadas nas dores

---

## Estrutura do Novo Motor

```text
INPUT:
  - Dores prováveis
  - Contexto do cliente
  - Status SAP
  - Evidências reais
  - Cases ranqueados

ETAPA 1: BUSCAR SOLUÇÕES EXISTENTES
  - Para cada dor, buscar melhor match no banco
  - Aplicar scoring multicritério
  - Filtro de cargo corrigido

ETAPA 2: IDENTIFICAR LACUNAS
  - Dores sem solução mapeada (score < 0.35)
  - Máximo de 3 lacunas identificadas

ETAPA 3: GERAR SOLUÇÕES VIA IA
  - Para lacunas, IA sugere solução personalizada
  - Sinalizar como "NOVA RECOMENDACAO"
  - Descrição 100% contextualizada

ETAPA 4: COMBINAR E RANKEAR
  - Mesclar soluções existentes + geradas
  - Ordenar por urgência e score
  - Top 7 soluções finais

OUTPUT:
  - Cada solução indica origem: "EXISTENTE" ou "NOVA"
  - Descrição personalizada para TODAS
  - Conexão com evidências e cases
```

---

## Alterações Detalhadas

### 1. Corrigir Filtro de Cargo

**Arquivo**: `supabase/functions/generate-playbook/index.ts`

O problema é que `sol.target_roles` contém valores como `["CEO", "CFO", "Gerente de TI"]` mas o código tenta comparar com `["C-level", "Gerente"]`.

```typescript
// NOVO: Mapeamento de target_roles específicos para categorias
const ROLE_CATEGORY_MAP: Record<string, string[]> = {
  'C-level': ['CEO', 'CFO', 'CIO', 'CTO', 'COO', 'Presidente', 'VP'],
  'Diretor': ['Diretor', 'Director', 'Head', 'VP de'],
  'Gerente': ['Gerente', 'Manager', 'Gestor', 'Coordenador', 'Controller'],
  'Especialista': ['Especialista', 'Analista', 'Consultor', 'Arquiteto', 'Engenheiro'],
  'Key User': ['Key User', 'Usuário', 'Operador', 'Assistente']
};

function targetRoleMatchesCategory(targetRole: string, category: string): boolean {
  const patterns = ROLE_CATEGORY_MAP[category] || [];
  const targetLower = targetRole.toLowerCase();
  return patterns.some(pattern => targetLower.includes(pattern.toLowerCase()));
}

// Na função findRelevantSolutionsEnriched:
const filteredSolutions = solutions.filter((sol) => {
  if (!sol.target_roles || sol.target_roles.length === 0) return true;
  return sol.target_roles.some(targetRole => 
    roleNames.some(category => targetRoleMatchesCategory(targetRole, category))
  );
});
```

### 2. Novo Prompt Otimizado para Geração de Soluções

Usando as melhores práticas de engenharia de prompt:

```typescript
const SOLUTION_GENERATION_PROMPT = `
<role>
Você é um arquiteto de soluções SAP sênior da Meta IT com 15+ anos de experiência 
em projetos de transformação digital. Sua especialidade é criar propostas de valor 
personalizadas que conectam dores de negócio a soluções tecnológicas concretas.
</role>

<context>
CLIENTE EM ANÁLISE:
- Empresa: {{company}}
- Setor: {{industry}}
- Porte: {{companySize}}
- Status SAP Atual: {{sapStatus}}
- Cargo do Lead: {{role}} (Perfil: {{roleProfile}})

CENÁRIO IDENTIFICADO:
{{scenarioAnalysis}}

EVIDÊNCIAS REAIS ENCONTRADAS:
{{evidencesList}}

DORES SEM SOLUÇÃO MAPEADA:
{{unmappedPains}}

SOLUÇÕES JÁ MAPEADAS (evitar duplicação):
{{mappedSolutions}}

CASES DE SUCESSO RELEVANTES:
{{relevantCases}}
</context>

<task>
Para cada dor sem solução mapeada, crie UMA solução personalizada seguindo estas regras:
</task>

<rules>
1. ESPECIFICIDADE OBRIGATÓRIA:
   - Mencione o nome da empresa
   - Conecte com evidência real quando disponível
   - Referencie case similar se existir
   - Use números e prazos realistas

2. ESTRUTURA DA SOLUÇÃO:
   - Nome: Título claro e profissional (sem genéricos)
   - Descrição: 2-3 frases explicando COMO resolve AQUELA dor
   - Benefícios: 3 benefícios específicos para o contexto
   - Tipo: "diagnostico" | "projeto" | "servico_continuo"
   - Prazo estimado: Realista para o escopo

3. LINGUAGEM:
   - Adaptar para {{languageStyle}}
   - Focar em: {{focusAreas}}
   - Evitar: {{avoidTopics}}

4. REALISMO:
   - Só sugerir o que a Meta IT realmente pode entregar
   - Considerar capacidades: SAP S/4HANA, AMS, Outsourcing, BTP, 
     Reforma Tributária, Rollouts, Consultoria
</rules>

<output_format>
Retorne um JSON array com objetos:
{
  "pain": "dor original",
  "solution": "nome da solução proposta",
  "description": "descrição personalizada",
  "benefits": ["benefício 1", "benefício 2", "benefício 3"],
  "type": "diagnostico|projeto|servico_continuo",
  "estimatedTimeline": "prazo estimado",
  "connectionToEvidence": "como conecta com evidência (ou null)",
  "connectionToCase": "case similar (ou null)",
  "isNew": true
}
</output_format>

<examples>
EXEMPLO RUIM (genérico):
{
  "solution": "Consultoria SAP",
  "description": "Oferecemos consultoria para melhorar seus processos SAP."
}

EXEMPLO BOM (personalizado):
{
  "solution": "Diagnóstico de Prontidão para Migração S/4HANA - {{company}}",
  "description": "Para a {{company}}, que está em SAP ECC e enfrenta o deadline de 2027, 
  propomos um diagnóstico de 3 semanas para mapear customizações críticas, integrações 
  existentes e definir o roadmap ideal de migração. Similar ao que fizemos na Bruning, 
  onde identificamos 40% de código obsoleto que pôde ser descartado.",
  "benefits": [
    "Clareza sobre investimento necessário em 3 semanas",
    "Identificação de quick wins e riscos antecipados",
    "Roadmap priorizado alinhado ao deadline 2027"
  ],
  "type": "diagnostico",
  "estimatedTimeline": "3 semanas",
  "connectionToEvidence": "Baseado na evidência de vagas SAP abertas",
  "connectionToCase": "Similar ao diagnóstico da Bruning",
  "isNew": true
}
</examples>
`;
```

### 3. Função de Geração de Soluções Novas

```typescript
async function generateNewSolutions(
  unmappedPains: { pain: string; reason: string; confidence: string }[],
  mappedSolutions: EnrichedSolutionMatch[],
  context: {
    company: string;
    industry: string;
    role: string;
    sapStatus: string;
    companySize: string;
  },
  evidences: Evidence[],
  cases: RankedCase[],
  roleConfig: RoleConfig
): Promise<GeneratedSolution[]> {
  if (unmappedPains.length === 0) return [];
  
  // Limitar a 3 soluções novas para não sobrecarregar
  const painsToSolve = unmappedPains.slice(0, 3);
  
  // Construir prompt com contexto rico
  const scenarioAnalysis = buildScenarioAnalysis(context, evidences);
  const evidencesList = evidences.map(e => `- ${e.title}: ${e.indication}`).join('\n');
  const mappedSolutionsList = mappedSolutions.map(s => s.solution.name).join(', ');
  const casesList = cases.map(c => `- ${c.case.company_name}: ${c.case.title}`).join('\n');
  
  const prompt = SOLUTION_GENERATION_PROMPT
    .replace(/{{company}}/g, context.company)
    .replace(/{{industry}}/g, context.industry)
    .replace(/{{companySize}}/g, context.companySize)
    .replace(/{{sapStatus}}/g, context.sapStatus)
    .replace(/{{role}}/g, context.role)
    .replace('{{roleProfile}}', getRoleProfile(roleConfig))
    .replace('{{scenarioAnalysis}}', scenarioAnalysis)
    .replace('{{evidencesList}}', evidencesList || 'Nenhuma evidência específica')
    .replace('{{unmappedPains}}', painsToSolve.map(p => `- ${p.pain} (${p.confidence})`).join('\n'))
    .replace('{{mappedSolutions}}', mappedSolutionsList || 'Nenhuma')
    .replace('{{relevantCases}}', casesList || 'Nenhum case específico')
    .replace('{{languageStyle}}', roleConfig.language)
    .replace('{{focusAreas}}', roleConfig.priorityTopics.join(', '))
    .replace('{{avoidTopics}}', roleConfig.excludeTopics.join(', '));

  // Chamar IA com tool calling para estrutura garantida
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: 'Você é um arquiteto de soluções SAP. Responda APENAS com JSON válido.' },
        { role: 'user', content: prompt }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'generate_custom_solutions',
          description: 'Gera soluções personalizadas para dores não mapeadas',
          parameters: {
            type: 'object',
            properties: {
              solutions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    pain: { type: 'string' },
                    solution: { type: 'string' },
                    description: { type: 'string' },
                    benefits: { type: 'array', items: { type: 'string' } },
                    type: { type: 'string', enum: ['diagnostico', 'projeto', 'servico_continuo'] },
                    estimatedTimeline: { type: 'string' },
                    connectionToEvidence: { type: 'string' },
                    connectionToCase: { type: 'string' }
                  },
                  required: ['pain', 'solution', 'description', 'benefits', 'type']
                }
              }
            },
            required: ['solutions']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'generate_custom_solutions' } }
    }),
  });
  
  // Processar resposta e retornar soluções geradas
  // ... parsing e validação
}
```

### 4. Novo Tipo para Indicar Origem da Solução

**Arquivo**: `src/types/playbook.types.ts`

```typescript
export interface MetaSolution {
  pain: string;
  painConfidence?: 'alta' | 'media' | 'baixa';
  solution: string;
  description: string;
  personalizedDescription?: string;
  benefits?: string[];
  matchReason?: string;
  matchReasons?: string[];
  matchScore?: number;
  relatedEvidence?: string;
  relatedCase?: string;
  urgencyLevel?: 'critical' | 'high' | 'medium' | 'low';
  
  // NOVO: Indicador de origem
  solutionOrigin: 'existing' | 'generated';
  solutionType?: 'diagnostico' | 'projeto' | 'servico_continuo';
  estimatedTimeline?: string;
}
```

### 5. Atualizar UI para Mostrar Origem

**Arquivo**: `src/components/Playbook/PlaybookView.tsx`

Adicionar badge visual para indicar se a solução é existente ou nova recomendação:

```text
Soluções existentes:
  [SOLUÇÃO VALIDADA] - Badge verde
  - Indica que é uma solução que já entregamos antes
  
Soluções novas:
  [NOVA RECOMENDAÇÃO] - Badge amarelo/dourado
  - Indica que é uma sugestão personalizada da IA
  - Inclui ícone de "lightbulb" ou "sparkle"
```

---

## Fluxo Completo Atualizado

```text
ENTRADA: Lead com dores identificadas

  1. BUSCAR SOLUÇÕES EXISTENTES
     ├── Aplicar scoring multicritério
     ├── Filtrar por cargo (CORRIGIDO)
     └── Threshold: 0.35

  2. IDENTIFICAR LACUNAS
     ├── Dores com score < 0.35
     └── Máximo 3 lacunas

  3. SE HOUVER LACUNAS:
     ├── Gerar prompt personalizado
     ├── Chamar IA com contexto rico
     └── Criar soluções novas

  4. COMBINAR RESULTADOS
     ├── Soluções existentes (origin: 'existing')
     ├── Soluções geradas (origin: 'generated')
     └── Ordenar por urgência + score

  5. PERSONALIZAR DESCRIÇÕES
     ├── Para TODAS as soluções (existentes + novas)
     └── Batch call para eficiência

  6. OUTPUT FINAL
     ├── 5-7 soluções ranqueadas
     ├── Cada uma com origem identificada
     └── Descrição 100% personalizada
```

---

## Arquivos a Modificar

1. **`supabase/functions/generate-playbook/index.ts`**
   - Corrigir filtro de cargo com `ROLE_CATEGORY_MAP`
   - Adicionar função `generateNewSolutions()`
   - Integrar soluções existentes + geradas
   - Novo prompt otimizado

2. **`src/types/playbook.types.ts`**
   - Adicionar campo `solutionOrigin`
   - Adicionar campo `solutionType`
   - Adicionar campo `estimatedTimeline`

3. **`src/components/Playbook/PlaybookView.tsx`**
   - Badge visual para origem
   - Exibir timeline quando disponível
   - Melhorar layout para soluções novas

---

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Dor com match no banco | Descrição genérica | Descrição personalizada + "SOLUÇÃO VALIDADA" |
| Dor sem match no banco | Seção vazia | Solução gerada por IA + "NOVA RECOMENDAÇÃO" |
| Filtro de cargo | Não funciona | Funciona corretamente |
| Total de soluções | 0-5 | 5-7 (sempre) |
| Origem clara | Não | Sim, com badge visual |

---

## Estimativa de Esforço

- Correção do filtro de cargo: 15 min
- Função de geração de soluções: 45 min
- Prompt otimizado: 30 min
- Atualização da UI: 30 min
- Testes e ajustes: 20 min

**Total: ~2.5 horas**

