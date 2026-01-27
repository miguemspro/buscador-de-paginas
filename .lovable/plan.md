
# Plano: Corrigir Validação que Bloqueia Geração de Playbook

## Problema Identificado

A geração de playbook está **falhando silenciosamente** porque a validação Zod rejeita valores `null`. Os logs mostram claramente:

```
ERROR Validation error: [
  { path: ["publicSignals"], message: "Expected string, received null" },
  { path: ["leadSource"], message: "Expected string, received null" }
]
```

## Causa Raiz

| Componente | O que acontece |
|------------|----------------|
| `extract-salesforce-data` | A IA (Gemini) retorna `null` para campos vazios |
| `playbookService.ts` | Passa os dados diretamente para `generate-playbook` |
| `generate-playbook` | Schema Zod usa `.optional()` que aceita `undefined` mas **rejeita `null`** |
| **Resultado** | Retorna erro 400 e o OpenAI é cobrado mas nada é exibido |

## Solução

### Estratégia Dupla (Robustez Total)

1. **Corrigir o Schema Zod** - Aceitar `null` como valor válido
2. **Sanitizar dados no frontend** - Converter `null` para `undefined` antes de enviar

## Alterações Necessárias

### 1. Edge Function `generate-playbook/index.ts`

Alterar o schema Zod para aceitar `null`:

```typescript
// ANTES - não aceita null
const LeadDataSchema = z.object({
  publicSignals: z.string().max(10000).optional(),
  leadSource: z.string().max(200).optional(),
  priority: z.string().max(50).optional(),
  // ...outros campos
});

// DEPOIS - aceita null e converte para undefined
const LeadDataSchema = z.object({
  publicSignals: z.string().max(10000).nullable().optional().transform(v => v ?? undefined),
  leadSource: z.string().max(200).nullable().optional().transform(v => v ?? undefined),
  priority: z.string().max(50).nullable().optional().transform(v => v ?? undefined),
  // ...aplicar em TODOS os campos string opcionais
});
```

### 2. Service `playbookService.ts`

Adicionar sanitização antes de enviar:

```typescript
// Função utilitária para limpar nulls
function sanitizeLeadData(data: ExtractedLeadData): ExtractedLeadData {
  const sanitized: ExtractedLeadData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export async function generatePlaybook(leadData: ExtractedLeadData): Promise<GeneratedPlaybook> {
  const sanitizedData = sanitizeLeadData(leadData); // Limpar antes de enviar
  // ...resto do código
}
```

### 3. Edge Function `extract-salesforce-data/index.ts`

Atualizar o prompt para retornar string vazia ao invés de null:

```
- Se um campo não estiver visível, use "" (string vazia) ao invés de null
```

## Fluxo Corrigido

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO CORRIGIDO                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  extract-salesforce-data                                        │
│  └─ Retorna { publicSignals: null, leadSource: null, ... }      │
│              │                                                  │
│              ▼                                                  │
│  playbookService.sanitizeLeadData()                             │
│  └─ Converte { publicSignals: undefined, ... }                  │
│              │                                                  │
│              ▼                                                  │
│  generate-playbook                                              │
│  └─ Schema Zod aceita undefined E null (via .nullable())        │
│  └─ Transform converte null -> undefined                        │
│              │                                                  │
│              ▼                                                  │
│  ✅ Playbook gerado com sucesso                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/generate-playbook/index.ts` | Adicionar `.nullable().transform()` em todos os campos string do schema |
| `src/services/playbookService.ts` | Adicionar função `sanitizeLeadData` e aplicar antes de enviar |
| `supabase/functions/extract-salesforce-data/index.ts` | (Opcional) Alterar prompt para retornar "" ao invés de null |

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| OpenAI cobrado, playbook não gerado | OpenAI cobrado, playbook exibido |
| Erro 400 silencioso | Fluxo completo funcional |
| Usuário vê loading infinito | Usuário vê playbook renderizado |

## Seção Tecnica

A correção aplica o padrão "defense in depth" com múltiplas camadas de proteção:

1. **Camada 1 (Frontend)**: `sanitizeLeadData()` remove todos os `null` antes de enviar
2. **Camada 2 (Backend)**: Schema Zod com `.nullable().transform()` aceita e converte `null`
3. **Camada 3 (IA)**: Prompt atualizado para evitar `null` desde a origem

A transformação Zod `z.string().nullable().optional().transform(v => v ?? undefined)`:
- `.nullable()` - Aceita `null` como valor válido
- `.optional()` - Aceita `undefined` como valor válido  
- `.transform(v => v ?? undefined)` - Converte `null` para `undefined` (normalização)

Isso garante que mesmo se uma das camadas falhar, as outras capturam o problema.
