
# Plano: Filtrar Soluções de Migração S/4HANA para Clientes Já em S/4

## Problema Identificado

Quando o lead já está em **S/4HANA**, o sistema ainda sugere soluções de **migração para S/4HANA**, o que não faz sentido já que o cliente já migrou.

### Pontos do código que precisam de correção:

1. **`findRelevantSolutionsEnriched`** (linha 659-677): Dá boost para soluções de migração quando cliente está em ECC, mas NÃO exclui essas soluções quando está em S/4
2. **`generateNewSolutions`** (linha 894-901): O prompt menciona "Migração SAP S/4HANA" como capacidade da Meta IT, sem instruir a IA a não sugerir isso para quem já está em S/4
3. **Filtro de soluções**: Não existe um filtro que exclua soluções incompatíveis com o status SAP atual

## Solução Proposta

Implementar um **filtro de compatibilidade SAP** em 3 camadas:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                    FILTRO DE COMPATIBILIDADE SAP                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CAMADA 1: Filtro de Soluções Existentes                                │
│  ├── Se isS4 = true                                                      │
│  │   └── Excluir soluções cujo nome contém:                              │
│  │       "migração", "conversão s/4", "brownfield", "greenfield"         │
│  └── Se isECC = true                                                     │
│      └── Boost para essas soluções (já implementado)                     │
│                                                                          │
│  CAMADA 2: Ajuste no Prompt de Geração                                   │
│  ├── Se isS4 = true                                                      │
│  │   └── Adicionar regra: "NÃO sugira migração S/4HANA,                  │
│  │       pois o cliente já está nesta versão"                            │
│  └── Atualizar lista de capacidades dinamicamente                       │
│                                                                          │
│  CAMADA 3: Validação de Saída                                            │
│  ├── Após geração via IA                                                 │
│  │   └── Filtrar soluções que mencionem migração S/4 se isS4            │
│  └── Log de soluções descartadas para debug                              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Alterações Detalhadas

### 1. Nova Função Auxiliar: Verificar Compatibilidade com Status SAP

Adicionar no início do arquivo (após as interfaces):

```typescript
// Palavras-chave de soluções de MIGRAÇÃO para S/4HANA
const S4_MIGRATION_KEYWORDS = [
  'migração s/4',
  'migração s4',
  'migração para s/4',
  'conversão s/4',
  'conversão s4',
  'brownfield',
  'greenfield',
  'upgrade para s/4',
  'move to s/4',
  'journey to s/4',
  'transição para s/4'
];

function isMigrationToS4Solution(solutionName: string): boolean {
  const nameLower = solutionName.toLowerCase();
  return S4_MIGRATION_KEYWORDS.some(keyword => nameLower.includes(keyword));
}

function isSolutionCompatibleWithSapStatus(
  solutionName: string, 
  sapStatus: string | undefined
): boolean {
  if (!sapStatus) return true; // Se não soubermos o status, permitir tudo
  
  const sapLower = sapStatus.toLowerCase();
  const isS4 = sapLower.includes('s/4') || sapLower.includes('s4hana');
  
  // Se cliente está em S/4HANA, excluir soluções de migração PARA S/4
  if (isS4 && isMigrationToS4Solution(solutionName)) {
    return false;
  }
  
  return true;
}
```

### 2. Modificar `findRelevantSolutionsEnriched` - Aplicar Filtro

Na linha 587-594, após o filtro de cargo, adicionar filtro de compatibilidade SAP:

```typescript
// Filtrar soluções por cargo - CORRIGIDO com mapeamento
const filteredByRole = solutions.filter((sol: MetaSolution) => {
  if (!sol.target_roles || sol.target_roles.length === 0) return true;
  return sol.target_roles.some((targetRole: string) => 
    roleNames.some(category => targetRoleMatchesCategory(targetRole, category))
  );
});

// NOVO: Filtrar soluções incompatíveis com status SAP
const filteredSolutions = filteredByRole.filter((sol: MetaSolution) => {
  const isCompatible = isSolutionCompatibleWithSapStatus(sol.name, companyContext.sapStatus);
  if (!isCompatible) {
    console.log(`Solução "${sol.name}" excluída - incompatível com status SAP: ${companyContext.sapStatus}`);
  }
  return isCompatible;
});

console.log(`Soluções filtradas por cargo: ${filteredByRole.length}, após filtro SAP: ${filteredSolutions.length}`);
```

### 3. Modificar `generateNewSolutions` - Ajustar Prompt

Atualizar a seção de regras do prompt (linha 894-902) para ser dinâmica:

```typescript
// Construir lista de capacidades baseada no status SAP
let metaCapabilities = [
  'AMS (Application Management Services)',
  'Outsourcing de equipe SAP',
  'SAP BTP e integrações',
  'Adequação à Reforma Tributária',
  'Rollouts internacionais',
  'Consultoria e diagnósticos'
];

// Adicionar migração APENAS se não estiver em S/4HANA
if (!isS4) {
  metaCapabilities.unshift('Migração SAP S/4HANA (Brownfield/Greenfield)');
}

// Adicionar capacidades pós-migração se estiver em S/4HANA
if (isS4) {
  metaCapabilities.push(
    'Otimização e tuning de S/4HANA',
    'Estabilização pós-go-live',
    'Rollout de novas funcionalidades S/4',
    'Expansão de módulos SAP'
  );
}

// No prompt, substituir a seção de capacidades:
const capabilitiesText = metaCapabilities.map(c => `   - ${c}`).join('\n');
```

E adicionar regra explícita no prompt quando isS4:

```typescript
// Regras adicionais baseadas no contexto
let additionalRules = '';
if (isS4) {
  additionalRules = `
5. RESTRIÇÃO CRÍTICA: O cliente JÁ ESTÁ EM S/4HANA. 
   - NÃO sugira migração, conversão ou upgrade para S/4HANA
   - Foque em: otimização, estabilização, novos módulos, integrações, BTP
   - Válido: AMS, Outsourcing, Rollouts, Reforma Tributária, expansões`;
}
```

### 4. Adicionar Validação de Saída das Soluções Geradas

Após a geração via IA (linha 979-982), filtrar resultados:

```typescript
if (parsed.solutions && Array.isArray(parsed.solutions)) {
  // NOVO: Filtrar soluções incompatíveis geradas pela IA
  const compatibleSolutions = parsed.solutions.filter((sol: GeneratedSolution) => {
    const isCompatible = isSolutionCompatibleWithSapStatus(sol.solution, context.sapStatus);
    if (!isCompatible) {
      console.log(`Solução gerada "${sol.solution}" descartada - incompatível com S/4HANA`);
    }
    return isCompatible;
  });
  
  console.log(`Soluções geradas via IA: ${parsed.solutions.length}, compatíveis: ${compatibleSolutions.length}`);
  return compatibleSolutions;
}
```

## Resumo das Alterações por Arquivo

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/generate-playbook/index.ts` | 4 modificações |

### Modificações específicas:

1. **Linha ~200**: Adicionar constante `S4_MIGRATION_KEYWORDS` e funções auxiliares
2. **Linha ~587**: Adicionar filtro de compatibilidade SAP após filtro de cargo
3. **Linha ~820-900**: Tornar prompt dinâmico baseado no status SAP
4. **Linha ~979**: Adicionar validação de saída para soluções geradas

## Resultado Esperado

| Status SAP | Antes | Depois |
|------------|-------|--------|
| S/4HANA | Sugere migração S/4HANA | Sugere otimização, AMS, BTP, expansões |
| ECC | Sugere migração (correto) | Mantém igual |
| Não informado | Sugere tudo | Mantém igual |

## Logs de Debug

O sistema irá logar:
- Soluções excluídas por incompatibilidade SAP
- Quantidade antes e depois do filtro
- Soluções geradas pela IA que foram descartadas
