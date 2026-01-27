
# Plano: Correção Definitiva do Filtro de Migração S/4HANA

## Diagnóstico do Problema Real

O log mostra o que está acontecendo:

```
[SAP Status] Valor: "sap_services" | É S/4: false | É ECC: false
```

**Causa raiz identificada:** O campo `sapStatus` no Salesforce está como "SAP Services", mas a Klabin **JÁ ESTÁ EM S/4HANA**. O sistema está confiando cegamente no dado do Salesforce, que está desatualizado ou usando uma nomenclatura incorreta.

### Fluxo do problema:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO ATUAL (COM BUG)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1. OCR lê "SAP Services" do Salesforce                                   │
│      ↓                                                                      │
│   2. sapStatus = "sap_services"                                            │
│      ↓                                                                      │
│   3. isClientOnS4HANA("sap_services") = FALSE ❌                           │
│      ↓                                                                      │
│   4. Web search encontra notícias sobre "Klabin + ECC + deadline 2027"     │
│      ↓                                                                      │
│   5. PAIN_EVIDENCE_MATRIX dispara "Urgência de migração..."                │
│      ↓                                                                      │
│   6. Filtro não bloqueia porque clientIsOnS4 = false                       │
│      ↓                                                                      │
│   7. Solução "Conversão SAP S/4HANA Brownfield" é sugerida ❌              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Solução: Detecção Inteligente via Evidências

A solução é **detectar o status SAP REAL baseado nas evidências encontradas**, não apenas confiar no dado do Salesforce. Se as evidências indicarem que a empresa já implementou S/4HANA, devemos tratar como cliente S/4.

### Modificações no arquivo `supabase/functions/generate-playbook/index.ts`:

### 1. Nova função: Detectar Status SAP pelas Evidências

Adicionar após as funções de detecção existentes (~linha 280):

```typescript
// Palavras-chave que indicam S/4HANA JÁ IMPLEMENTADO
const S4_IMPLEMENTED_KEYWORDS = [
  'implementou s/4',
  'implementou s4',
  'migrou para s/4',
  'migrou para s4',
  'implantou s/4',
  'implantou s4',
  'go-live s/4',
  'go-live s4',
  'já está em s/4',
  'já está em s4',
  'opera em s/4',
  'opera em s4',
  'utiliza s/4',
  'utiliza s4',
  'adotou s/4',
  'adotou s4',
  'concluiu migração',
  'concluída migração',
  'finalizada migração para s/4',
  's/4hana em produção',
  's4hana em produção',
  'projeto s/4hana concluído',
  'projeto s4hana concluído'
];

// Palavras-chave que indicam cliente ainda em ECC (precisa migrar)
const ECC_KEYWORDS = [
  'ainda em ecc',
  'utiliza ecc',
  'opera em ecc',
  'precisa migrar',
  'planejando migração',
  'roadmap de migração',
  'projeto de migração em andamento',
  'avaliando migração'
];

function detectSapStatusFromEvidences(
  evidences: { title: string; indication: string }[]
): 's4hana' | 'ecc' | null {
  for (const evidence of evidences) {
    const text = `${evidence.title} ${evidence.indication}`.toLowerCase();
    
    // Verificar se indica S/4HANA já implementado
    for (const keyword of S4_IMPLEMENTED_KEYWORDS) {
      if (text.includes(keyword)) {
        console.log(`[SAP Detection] Evidência indica S/4HANA implementado: "${evidence.title}"`);
        return 's4hana';
      }
    }
    
    // Verificar se indica ainda em ECC
    for (const keyword of ECC_KEYWORDS) {
      if (text.includes(keyword)) {
        console.log(`[SAP Detection] Evidência indica ainda em ECC: "${evidence.title}"`);
        return 'ecc';
      }
    }
  }
  
  return null; // Não foi possível determinar
}

// Função combinada que usa ambas as fontes
function getEffectiveSapStatus(
  sapStatusFromForm: string | undefined,
  evidences: { title: string; indication: string }[]
): { isS4: boolean; isECC: boolean; source: 'form' | 'evidence' | 'unknown' } {
  
  // 1. Tentar detectar pelo formulário primeiro
  const formIsS4 = isClientOnS4HANA(sapStatusFromForm);
  const formIsECC = isClientOnECC(sapStatusFromForm);
  
  // Se o formulário indica claramente S/4 ou ECC, usar isso
  if (formIsS4) {
    return { isS4: true, isECC: false, source: 'form' };
  }
  if (formIsECC) {
    return { isS4: false, isECC: true, source: 'form' };
  }
  
  // 2. Se formulário é ambíguo (sap_services, unknown, etc), verificar evidências
  const evidenceStatus = detectSapStatusFromEvidences(evidences);
  
  if (evidenceStatus === 's4hana') {
    console.log(`[SAP Status Override] Formulário diz "${sapStatusFromForm}", mas evidências indicam S/4HANA`);
    return { isS4: true, isECC: false, source: 'evidence' };
  }
  
  if (evidenceStatus === 'ecc') {
    console.log(`[SAP Status Override] Formulário diz "${sapStatusFromForm}", mas evidências indicam ECC`);
    return { isS4: false, isECC: true, source: 'evidence' };
  }
  
  // 3. Não foi possível determinar - assumir status ambíguo (não filtrar agressivamente)
  return { isS4: false, isECC: false, source: 'unknown' };
}
```

### 2. Modificar `derivePainsFromContext` para usar detecção inteligente

Alterar a função (~linha 378) para usar a nova lógica:

```typescript
function derivePainsFromContext(
  evidences: { title: string; indication: string }[],
  industry: string | undefined,
  sapStatus: string | undefined,
  roleConfig: RoleConfig
): { pain: string; reason: string; confidence: 'alta' | 'media' | 'baixa' }[] {
  const pains: { pain: string; reason: string; confidence: 'alta' | 'media' | 'baixa' }[] = [];
  const addedPains = new Set<string>();
  
  // NOVO: Usar detecção inteligente que combina formulário + evidências
  const effectiveStatus = getEffectiveSapStatus(sapStatus, evidences);
  const clientIsOnS4 = effectiveStatus.isS4;
  const clientIsOnECC = effectiveStatus.isECC;
  
  console.log(`[SAP Status] Formulário: "${sapStatus}" | Efetivo: É S/4: ${clientIsOnS4} | É ECC: ${clientIsOnECC} | Fonte: ${effectiveStatus.source}`);

  // ... resto da função continua igual
```

### 3. Atualizar `findRelevantSolutionsEnriched` para usar mesma lógica

A função de soluções também precisa usar a detecção inteligente:

```typescript
// No início de findRelevantSolutionsEnriched, após carregar evidências:
const effectiveStatus = getEffectiveSapStatus(companyContext.sapStatus, evidences);
const isS4 = effectiveStatus.isS4;
const isECC = effectiveStatus.isECC;

// Usar isS4 e isECC no lugar de isClientOnS4HANA(sapStatus)
```

### 4. Adicionar logs detalhados para debug

```typescript
console.log(`[SAP Detection] Analisando ${evidences.length} evidências para detectar status SAP real`);
```

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/generate-playbook/index.ts` | 4 modificações |

### Modificações detalhadas:

1. **Linha ~280**: Adicionar `S4_IMPLEMENTED_KEYWORDS`, `ECC_KEYWORDS`, `detectSapStatusFromEvidences()` e `getEffectiveSapStatus()`
2. **Linha ~388**: Modificar `derivePainsFromContext` para usar `getEffectiveSapStatus()`
3. **Linha ~680**: Modificar `findRelevantSolutionsEnriched` para usar `getEffectiveSapStatus()`
4. **Linha ~1000**: Modificar `generateNewSolutions` para usar `getEffectiveSapStatus()`

## Casos de Teste Esperados

| sapStatus do Salesforce | Evidências encontradas | Status Efetivo | Sugere Migração? |
|-------------------------|------------------------|----------------|------------------|
| `sap_services` | "Klabin migrou para S/4HANA" | S/4 (via evidência) | NAO |
| `sap_services` | "Klabin ainda usa ECC" | ECC (via evidência) | SIM |
| `sap_services` | Nenhuma indicação clara | Ambíguo | SIM (default) |
| `s4hana` | Qualquer | S/4 (via formulário) | NAO |
| `sap_ecc` | "Klabin migrou para S/4" | S/4 (via evidência, override) | NAO |

## Resultado Esperado

Para a Klabin:
- **Antes**: Mostra "Urgência de migração antes do fim de suporte SAP ECC (2027)" + "Conversão SAP S/4HANA Brownfield"
- **Depois**: 
  - Se evidências indicam S/4HANA: Mostra dores de otimização/AMS/expansão
  - Se evidências indicam ECC: Mostra dores de migração (correto)
  - Se não houver indicação clara: Assume status do formulário

## Impacto

- Corrige o bug onde clientes já em S/4HANA recebem sugestões de migração
- Melhora a inteligência do sistema usando múltiplas fontes de dados
- Adiciona logs para facilitar debug futuro
