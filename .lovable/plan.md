
# Plano: Corrigir Filtro de Compatibilidade SAP com Valores de Enum

## Diagnóstico do Problema

### Causa Raiz Identificada

O console log mostra que o lead está sendo enviado com:
```json
"sapStatus": "sap_services"
```

Mas o usuário reporta que o lead **já está em S/4HANA**. Existem **2 problemas**:

### Problema 1: Detecção de S/4HANA usa string matching incorreto

A função `isSolutionCompatibleWithSapStatus` (linha 239) verifica:
```typescript
const isS4 = sapLower.includes('s/4') || sapLower.includes('s4hana');
```

Isso falha porque:
- Valor do enum: `'s4hana'` (funciona ✓)
- Valor do enum: `'sap_services'` (não detecta ✗)
- Valor do enum: `'sap_ecc'` (não detecta ✗)

**A lógica deveria verificar os valores exatos do enum, não fazer matching parcial de strings.**

### Problema 2: Dores de migração são geradas mesmo para S/4HANA

A função `derivePainsFromContext` (linha 300-305) tem o `PAIN_EVIDENCE_MATRIX` que gera dores de "Urgência de migração antes do fim de suporte SAP ECC (2027)" quando evidências mencionam "ECC" ou "deadline 2027" - **mesmo que o lead já esteja em S/4HANA**.

### Problema 3: O valor `'sap_services'` é ambíguo

O valor `'sap_services'` não indica claramente se o cliente está em S/4HANA ou não. Isso pode significar "SAP Services" (um produto diferente) ou ser usado quando a versão é desconhecida.

---

## Solução Proposta

### Alterações no arquivo `supabase/functions/generate-playbook/index.ts`:

### 1. Criar constantes para os valores de enum SAP

```typescript
// Valores possíveis do enum sapStatus do frontend
const SAP_STATUS_ENUM = {
  S4HANA: 's4hana',        // Cliente já em S/4HANA - NÃO sugerir migração
  SAP_ECC: 'sap_ecc',      // Cliente em ECC - SUGERIR migração
  SAP_SERVICES: 'sap_services', // SAP Services - verificar se contém s/4
  BUSINESS_ONE: 'business_one', // Business One - não é ERP SAP tradicional
  NO_SAP: 'no_sap',        // Sem SAP
  UNKNOWN: 'unknown'       // Desconhecido
};
```

### 2. Corrigir a função `isSolutionCompatibleWithSapStatus`

```typescript
function isClientOnS4HANA(sapStatus: string | undefined): boolean {
  if (!sapStatus) return false;
  
  const sapLower = sapStatus.toLowerCase().trim();
  
  // 1. Verificar valor exato do enum
  if (sapLower === 's4hana') return true;
  
  // 2. Verificar se a string contém indicadores de S/4
  // (para casos de texto livre ou valores legados)
  if (sapLower.includes('s/4') || 
      sapLower.includes('s4 hana') ||
      sapLower.includes('s/4hana') ||
      (sapLower.includes('s4') && sapLower.includes('hana'))) {
    return true;
  }
  
  return false;
}

function isClientOnECC(sapStatus: string | undefined): boolean {
  if (!sapStatus) return false;
  
  const sapLower = sapStatus.toLowerCase().trim();
  
  // 1. Verificar valor exato do enum
  if (sapLower === 'sap_ecc') return true;
  
  // 2. Verificar se a string contém indicadores de ECC
  if (sapLower.includes('ecc') || sapLower.includes('r/3')) {
    return true;
  }
  
  return false;
}

function isSolutionCompatibleWithSapStatus(
  solutionName: string, 
  sapStatus: string | undefined
): boolean {
  if (!sapStatus) return true;
  
  // Se cliente está em S/4HANA, excluir soluções de migração PARA S/4
  if (isClientOnS4HANA(sapStatus) && isMigrationToS4Solution(solutionName)) {
    console.log(`[SAP Filter] Cliente em S/4HANA - excluindo migração: "${solutionName}"`);
    return false;
  }
  
  return true;
}
```

### 3. Corrigir `derivePainsFromContext` para filtrar dores de migração

Na função `derivePainsFromContext`, adicionar verificação do status SAP antes de adicionar dores relacionadas a migração:

```typescript
function derivePainsFromContext(
  evidences: { title: string; indication: string }[],
  industry: string | undefined,
  sapStatus: string | undefined,
  roleConfig: RoleConfig
): { pain: string; reason: string; confidence: 'alta' | 'media' | 'baixa' }[] {
  const pains: { pain: string; reason: string; confidence: 'alta' | 'media' | 'baixa' }[] = [];
  const addedPains = new Set<string>();
  
  // NOVO: Verificar status SAP para filtrar dores irrelevantes
  const clientIsOnS4 = isClientOnS4HANA(sapStatus);
  
  // Dores que NÃO devem aparecer se o cliente já está em S/4HANA
  const MIGRATION_PAIN_PATTERNS = [
    'migração',
    'deadline 2027',
    'fim de suporte',
    'suporte ecc',
    'upgrade para s/4',
    'conversão para s/4',
    'planejamento de roadmap de migração'
  ];

  // 1. Derivar dores das evidências encontradas
  for (const evidence of evidences) {
    const combinedText = `${evidence.title} ${evidence.indication}`.toLowerCase();
    
    for (const matrix of PAIN_EVIDENCE_MATRIX) {
      const patterns = matrix.evidenceType.split('|');
      if (patterns.some(p => combinedText.includes(p.toLowerCase()))) {
        for (const pain of matrix.typicalPains) {
          if (!addedPains.has(pain)) {
            // NOVO: Filtrar dores de migração se cliente já está em S/4
            if (clientIsOnS4) {
              const painLower = pain.toLowerCase();
              const isMigrationPain = MIGRATION_PAIN_PATTERNS.some(p => painLower.includes(p));
              if (isMigrationPain) {
                console.log(`[Pain Filter] Dor de migração excluída para cliente S/4: "${pain}"`);
                continue; // Pular esta dor
              }
            }
            
            // Filtrar por cargo
            const shouldExclude = roleConfig.excludeTopics.some(topic => 
              pain.toLowerCase().includes(topic.toLowerCase())
            );
            if (!shouldExclude) {
              addedPains.add(pain);
              pains.push({
                pain,
                reason: `Baseado em: "${evidence.title}"`,
                confidence: 'alta'
              });
            }
          }
        }
      }
    }
  }

  // 2. Derivar dores do status SAP
  if (sapStatus) {
    // CORRIGIDO: Usar funções de detecção de enum
    if (isClientOnECC(sapStatus)) {
      if (!addedPains.has('deadline_2027')) {
        addedPains.add('deadline_2027');
        pains.push({
          pain: 'Pressão pelo deadline 2027 de fim de suporte SAP ECC',
          reason: `Status SAP atual: ${sapStatus}`,
          confidence: 'alta'
        });
      }
    }
    
    // Para clientes em S/4, sugerir otimização
    if (clientIsOnS4) {
      if (!addedPains.has('pos_golive')) {
        addedPains.add('pos_golive');
        pains.push({
          pain: 'Otimização e estabilização do ambiente S/4HANA',
          reason: `Status SAP atual: ${sapStatus}`,
          confidence: 'media'
        });
      }
    }
  }
  
  // ... resto da função continua igual
}
```

### 4. Adicionar logs de debug para visibilidade

No início do processamento, logar o status SAP para facilitar debug:

```typescript
// No handler principal, após extrair leadData:
console.log(`[SAP Status] Valor recebido: "${leadData.sapStatus}" | É S/4: ${isClientOnS4HANA(leadData.sapStatus)} | É ECC: ${isClientOnECC(leadData.sapStatus)}`);
```

---

## Resumo das Correções

| Ponto de Correção | Antes | Depois |
|-------------------|-------|--------|
| Detecção S/4HANA | `includes('s/4')` | Verifica enum `'s4hana'` + patterns |
| Detecção ECC | `includes('ecc')` | Verifica enum `'sap_ecc'` + patterns |
| Dores de migração | Geradas sempre | Filtradas se cliente em S/4 |
| Logs de debug | Ausentes | Adicionados para visibilidade |

## Casos de Teste

| sapStatus | isS4 | isECC | Sugere Migração? |
|-----------|------|-------|------------------|
| `'s4hana'` | ✓ | ✗ | ❌ NÃO |
| `'sap_ecc'` | ✗ | ✓ | ✅ SIM |
| `'sap_services'` | ✗ | ✗ | ✅ SIM (status ambíguo) |
| `'business_one'` | ✗ | ✗ | ✅ SIM |
| `'S/4HANA'` (texto livre) | ✓ | ✗ | ❌ NÃO |
| `'SAP ECC 6.0'` (texto livre) | ✗ | ✓ | ✅ SIM |

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/generate-playbook/index.ts` | Corrigir detecção de enum + filtrar dores |

## Estimativa de Esforço

- Implementação: ~30 minutos
- Testes: ~15 minutos
