
# Plano: Reestruturação da Seção "Como a Meta IT Pode Ajudar"

## Problema Identificado

Após análise detalhada do código, identifiquei que a seção "4. Como a Meta IT Pode Ajudar" possui várias deficiências:

1. **Mapeamento por keywords simples**: O algoritmo atual faz match por palavras-chave entre `related_pains` e a dor identificada, o que resulta em associações fracas ou irrelevantes
2. **Score de match baixo**: O threshold mínimo de 0.3 permite soluções com baixa aderência
3. **Falta de análise contextual profunda**: Não considera o cenário completo do cliente (setor + cargo + status SAP + evidências) de forma integrada
4. **Descrição genérica**: A descrição da solução vem diretamente do banco (`expected_result`) sem personalização para o contexto
5. **Limite de 5 soluções**: Mesmo com muitas dores identificadas, apenas 5 soluções são mostradas

## Solução Proposta

Criar um **motor de recomendação inteligente** que:
- Analisa o contexto completo do cliente
- Usa IA para gerar descrições personalizadas de como cada solução resolve a dor específica
- Prioriza soluções com base em critérios mais sofisticados

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     NOVO MOTOR DE SOLUÇÕES                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  INPUT:                                                                 │
│  ├── Dores Prováveis (seção 3)                                          │
│  ├── Evidências Encontradas (seção 2)                                   │
│  ├── Contexto do Lead (cargo, empresa, setor)                           │
│  ├── Status SAP (ECC, S/4HANA, etc)                                     │
│  └── Cases Ranqueados (seção 5)                                         │
│                                                                         │
│  PROCESSAMENTO:                                                         │
│  ├── 1. ANÁLISE CONTEXTUAL                                              │
│  │   ├── Determinar prioridades baseadas em status SAP                  │
│  │   ├── Identificar urgências (deadline 2027, reforma tributária)      │
│  │   └── Correlacionar com evidências reais                             │
│  │                                                                      │
│  ├── 2. SCORING INTELIGENTE                                             │
│  │   ├── Match direto dor-solução (0.4)                                 │
│  │   ├── Contexto SAP (0.25)                                            │
│  │   ├── Evidências confirmam necessidade (0.2)                         │
│  │   ├── Setor compatível (0.1)                                         │
│  │   └── Cargo alinhado (0.05)                                          │
│  │                                                                      │
│  └── 3. GERAÇÃO PERSONALIZADA VIA IA                                    │
│      ├── Para cada solução top, gerar descrição personalizada           │
│      ├── Explicar COMO a solução resolve AQUELA dor específica          │
│      └── Conectar com evidências reais do cliente                       │
│                                                                         │
│  OUTPUT:                                                                │
│  ├── 5-7 soluções ranqueadas                                            │
│  ├── Descrição personalizada para o contexto                            │
│  ├── Conexão explícita com dores e evidências                           │
│  └── Score de match transparente                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Alterações Detalhadas

### 1. Reestruturar o Motor de Soluções (Edge Function)

**Arquivo**: `supabase/functions/generate-playbook/index.ts`

Substituir a função `findRelevantSolutions` por uma versão mais inteligente:

```typescript
// Novos critérios de scoring
const SOLUTION_SCORING = {
  painMatch: {
    exact: 0.40,      // Match exato de dor mapeada
    partial: 0.25,    // Match parcial por keywords
    semantic: 0.30    // Match semântico via IA
  },
  context: {
    sapStatus: 0.25,  // ECC -> prioriza migração
    urgency: 0.15,    // Deadline 2027, reforma tributária
    evidence: 0.20    // Evidência confirma necessidade
  },
  alignment: {
    industry: 0.10,   // Setor compatível
    role: 0.05        // Cargo alinhado
  }
};
```

### 2. Novo Prompt para Geração de Descrições Personalizadas

Em vez de usar apenas `expected_result`, enviar um prompt à IA que:
- Recebe o contexto completo do cliente
- Explica como a solução resolve a dor específica
- Conecta com evidências reais

```typescript
const solutionPrompt = `
Você é um consultor SAP sênior da Meta IT. 
Explique em 2-3 frases como esta solução ajuda este cliente específico.

CLIENTE:
- Empresa: ${leadData.company}
- Setor: ${leadData.industry}
- Status SAP: ${leadData.sapStatus}
- Cargo do Lead: ${leadData.role}

DOR IDENTIFICADA:
${pain}

EVIDÊNCIA QUE CONFIRMA:
${evidenceText}

SOLUÇÃO META IT:
${solution.name}: ${solution.description}

INSTRUÇÕES:
- Seja específico para o contexto deste cliente
- Mencione o benefício principal
- Conecte com a evidência se possível
- Linguagem ${roleConfig.language}
`;
```

### 3. Novo Tipo de Dados para Soluções Enriquecidas

**Arquivo**: `src/types/playbook.types.ts`

```typescript
export interface EnrichedMetaSolution {
  pain: string;                    // Dor que resolve
  painConfidence: 'alta' | 'media' | 'baixa';
  solution: string;                // Nome da solução
  personalizedDescription: string; // Descrição gerada por IA
  genericDescription: string;      // Descrição padrão (fallback)
  benefits: string[];              // Top 3 benefícios
  matchScore: number;              // Score de compatibilidade (0-1)
  matchReasons: string[];          // Motivos do match
  relatedEvidence?: string;        // Evidência que confirma
  relatedCase?: string;            // Case similar
  urgencyLevel?: 'critical' | 'high' | 'medium' | 'low';
}
```

### 4. Atualizar Interface do Playbook

**Arquivo**: `src/components/Playbook/PlaybookView.tsx`

Melhorar a apresentação visual das soluções:

```text
┌───────────────────────────────────────────────────────────────┐
│  [DOR] Pressão pelo deadline 2027 de fim de suporte SAP ECC   │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  💡 SOLUÇÃO: Conversão SAP S/4HANA Brownfield                 │
│                                                               │
│  Para a [Empresa], que está em SAP ECC e precisa migrar       │
│  antes do deadline de 2027, a conversão brownfield permite    │
│  preservar customizações críticas enquanto atualiza para      │
│  S/4HANA. Baseado na evidência de "vagas SAP abertas",        │
│  nossa equipe de outsourcing pode acelerar a migração.        │
│                                                               │
│  ✓ Preservação de investimentos anteriores                    │
│  ✓ Menor impacto nas operações                                │
│  ✓ Transição mais rápida                                      │
│                                                               │
│  [92% match] [Case similar: Bruning]                          │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Fluxo de Dados Atualizado

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          FLUXO ATUAL                                   │
└────────────────────────────────────────────────────────────────────────┘

  Dores → Match Keywords → Solução com expected_result genérico

┌────────────────────────────────────────────────────────────────────────┐
│                          FLUXO NOVO                                    │
└────────────────────────────────────────────────────────────────────────┘

  Dores
    ↓
  + Evidências (seção 2)
    ↓
  + Status SAP do lead
    ↓
  + Setor e cargo
    ↓
  SCORING MULTICRITÉRIO
    ↓
  Top 7 soluções ranqueadas
    ↓
  IA GERA DESCRIÇÃO PERSONALIZADA para cada
    ↓
  Conecta com evidências e cases reais
    ↓
  SOLUÇÃO CONTEXTUALIZADA
```

## Detalhamento Técnico

### Fase 1: Melhorar Scoring (sem IA adicional)

1. **Adicionar novos critérios ao scoring**:
   - Peso maior para match de `related_pains`
   - Considerar `use_cases` como critério secundário
   - Boost para soluções que têm cases do mesmo setor

2. **Priorização por urgência**:
   - ECC + deadline 2027 → Migração S/4HANA tem prioridade máxima
   - Reforma tributária mencionada → Adequação Tributária tem prioridade máxima
   - Vagas SAP abertas → AMS ou Outsourcing tem boost

3. **Limite de soluções**: Aumentar de 5 para 7

### Fase 2: Geração de Descrições Personalizadas (com IA)

1. **Batch de descrições**: Para as top 7 soluções, fazer UMA chamada à IA solicitando descrições personalizadas para todas

2. **Prompt otimizado**:
```text
Para cada solução abaixo, gere uma descrição de 2-3 frases 
explicando como ela resolve a dor específica deste cliente.

CONTEXTO DO CLIENTE:
[dados do lead]

SOLUÇÕES A DESCREVER:
1. Dor: X | Solução: Y
2. Dor: A | Solução: B
...

Retorne um JSON com as descrições personalizadas.
```

3. **Fallback**: Se a IA falhar, usar `expected_result` do banco

### Fase 3: Conectar com Cases e Evidências

1. Para cada solução, verificar se existe um case ranqueado que usou aquela solução
2. Se sim, adicionar referência: "Case similar: Bruning (migração S/4HANA)"
3. Conectar com evidência que confirmou a necessidade

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Descrição genérica do banco | Descrição personalizada para o contexto |
| Match por keywords simples | Scoring multicritério inteligente |
| 5 soluções sem priorização clara | 7 soluções com urgência e relevância |
| Sem conexão com evidências | Evidência que confirma mostrada |
| Sem conexão com cases | Case similar referenciado |

## Arquivos a Modificar

1. `supabase/functions/generate-playbook/index.ts` - Motor de scoring e prompt
2. `src/types/playbook.types.ts` - Novo tipo EnrichedMetaSolution
3. `src/components/Playbook/PlaybookView.tsx` - Nova UI das soluções
4. `src/store/playbookStore.ts` - Atualizar tipagem se necessário

## Estimativa de Esforço

- Motor de scoring melhorado: 30 min
- Geração de descrições via IA: 45 min
- Atualização da UI: 30 min
- Testes e ajustes: 15 min

**Total: ~2 horas**
