# FASE 3: Enterprise

> **Objetivo**: Migrar para stack Azure, integrar SharePoint para cases internos e implementar compliance avançado.

## Pré-requisitos

⚠️ **Antes de iniciar esta fase, confirme:**

- [ ] Fase 1 100% completa
- [ ] Fase 2 100% completa
- [ ] Acesso ao Azure configurado
- [ ] Tenant Microsoft 365 disponível

---

## Status Geral da Fase

| Etapa | Descrição | Status |
|-------|-----------|--------|
| 3.1 | Migração para Azure OpenAI | ⬜ |
| 3.2 | Azure AI Vision para OCR | ⬜ |
| 3.3 | Azure AI Foundry + Bing Grounding | ⬜ |
| 3.4 | Azure AI Search para Vetores | ⬜ |
| 3.5 | Microsoft 365 Retrieval API | ⬜ |
| 3.6 | Compliance e Governança | ⬜ |

---

## 3.1 Migração para Azure OpenAI

### Objetivo
Substituir OpenAI direto por Azure OpenAI para maior controle enterprise.

### Tarefas

- [ ] Criar recurso Azure OpenAI
- [ ] Deployar modelo GPT-4o
- [ ] Atualizar SDK no código
- [ ] Configurar rate limits
- [ ] Implementar retry com backoff
- [ ] Testar paridade de resultados

### Benefícios Azure OpenAI

```
✅ Dados não usados para treino
✅ Compliance SOC 2, HIPAA, etc.
✅ Controle de acesso via Azure AD
✅ Logs e auditoria nativos
✅ SLA enterprise
✅ Rede privada (VNET)
```

### Configuração

```typescript
// ESPAÇO PARA CÓDIGO DE CONFIGURAÇÃO AZURE OPENAI




```

### Critérios de Aceite

- [ ] Todas as chamadas usando Azure OpenAI
- [ ] Mesma qualidade de output
- [ ] Logs funcionando no Azure Monitor

---

## 3.2 Azure AI Vision para OCR

### Objetivo
Substituir GPT-4o Vision por Azure AI Vision Read API para OCR mais preciso.

### Tarefas

- [ ] Criar recurso Azure AI Vision
- [ ] Implementar chamada à Read API
- [ ] Processar resposta estruturada
- [ ] Manter fallback para GPT-4o Vision
- [ ] Comparar precisão entre os dois

### Comparativo

| Aspecto | GPT-4o Vision | Azure AI Vision |
|---------|---------------|-----------------|
| Precisão OCR | ~90% | ~98% |
| Estruturação | LLM interpreta | Coordenadas + texto |
| Custo | Tokens | Por página |
| Latência | ~3s | ~1s |

### Código de Integração

```typescript
// ESPAÇO PARA CÓDIGO DE INTEGRAÇÃO AZURE AI VISION




```

### Critérios de Aceite

- [ ] OCR com 95%+ de precisão
- [ ] Tempo de extração < 2s
- [ ] Fallback funcionando

---

## 3.3 Azure AI Foundry + Bing Grounding

### Objetivo
Implementar pesquisa web com citações nativas via Bing no Azure AI Foundry.

### Tarefas

- [ ] Configurar Azure AI Foundry
- [ ] Habilitar ferramenta Bing Web Search
- [ ] Criar agente com grounding
- [ ] Testar citações automáticas
- [ ] Comparar com web_search_preview atual

### Benefícios Bing Grounding

```
✅ Citações nativas no response
✅ Fontes verificadas
✅ Proteção enterprise
✅ Menos alucinações
✅ Integração com Azure AD
```

### Configuração do Agente

```json
// ESPAÇO PARA CONFIGURAÇÃO DO AGENTE NO AZURE AI FOUNDRY




```

### Prompt de Pesquisa com Grounding

```
<!-- ESPAÇO PARA PROMPT DE PESQUISA COM BING GROUNDING -->




```

### Critérios de Aceite

- [ ] 100% das pesquisas com citações
- [ ] Links funcionais e verificados
- [ ] Latência < 5s por pesquisa

---

## 3.4 Azure AI Search para Vetores

### Objetivo
Migrar busca de cases para Azure AI Search com índice híbrido (texto + vetor).

### Tarefas

- [ ] Criar recurso Azure AI Search
- [ ] Criar índice com schema de cases
- [ ] Configurar campo de vetor (1536 dims)
- [ ] Importar cases existentes
- [ ] Implementar busca híbrida
- [ ] Testar ranking por similaridade

### Schema do Índice

```json
{
  "name": "cases-meta-it",
  "fields": [
    { "name": "id", "type": "Edm.String", "key": true },
    { "name": "cliente", "type": "Edm.String", "searchable": true },
    { "name": "setor", "type": "Edm.String", "filterable": true, "facetable": true },
    { "name": "modulos_sap", "type": "Collection(Edm.String)", "filterable": true },
    { "name": "tipo_projeto", "type": "Edm.String", "filterable": true },
    { "name": "descricao", "type": "Edm.String", "searchable": true },
    { "name": "resultado_chave", "type": "Edm.String", "searchable": true },
    { "name": "embedding", "type": "Collection(Edm.Single)", "dimensions": 1536, "vectorSearchProfile": "vector-profile" }
  ],
  "vectorSearch": {
    "profiles": [{ "name": "vector-profile", "algorithm": "hnsw" }]
  }
}
```

### Query Híbrida

```json
// ESPAÇO PARA QUERY HÍBRIDA (TEXTO + VETOR)




```

### Critérios de Aceite

- [ ] Índice criado e populado
- [ ] Busca híbrida funcionando
- [ ] Top 3 cases relevantes por lead

---

## 3.5 Microsoft 365 Retrieval API

### Objetivo
Integrar SharePoint/OneDrive para buscar cases e materiais internos com permissionamento.

### Tarefas

- [ ] Configurar Microsoft Graph permissions
- [ ] Implementar Copilot Retrieval API
- [ ] Definir escopo de busca (sites, pastas)
- [ ] Testar com documentos de case
- [ ] Respeitar ACL (permissões)

### Benefícios

```
✅ Acesso a documentos internos
✅ Respeita permissões do SharePoint
✅ Não precisa replicar dados
✅ Sempre atualizado
✅ Governança nativa M365
```

### Fluxo de Integração

```
1. SDR solicita case relevante
2. Sistema chama Retrieval API
3. API busca no SharePoint com ACL do usuário
4. Retorna trechos relevantes
5. LLM usa para gerar recomendação
```

### Configuração

```typescript
// ESPAÇO PARA CÓDIGO DE INTEGRAÇÃO MICROSOFT 365 RETRIEVAL API




```

### Critérios de Aceite

- [ ] Busca em SharePoint funcionando
- [ ] Permissões respeitadas
- [ ] Cases internos aparecendo no ranking

---

## 3.6 Compliance e Governança

### Objetivo
Implementar controles de segurança, auditoria e compliance.

### Tarefas

- [ ] Implementar audit log de ações
- [ ] Configurar retenção de dados
- [ ] Criar política de uso de dados
- [ ] Implementar rate limiting
- [ ] Configurar alertas de uso anômalo
- [ ] Documentar compliance LinkedIn

### Controles de Segurança

| Controle | Implementação |
|----------|---------------|
| Autenticação | Azure AD SSO |
| Autorização | RBAC por role |
| Criptografia | TLS 1.3 + AES-256 |
| Auditoria | Azure Monitor + Log Analytics |
| Retenção | 90 dias (configurável) |
| Rate Limit | 100 req/min por usuário |

### Política de Dados LinkedIn

```markdown
## Política de Uso de Dados do LinkedIn

### Permitido
- Usar dados públicos indexados por buscadores
- Usar dados fornecidos manualmente pelo SDR
- Citar páginas públicas como fonte

### Proibido
- Usar LinkedIn API para lead gen
- Fazer scraping automatizado
- Usar extensões de coleta
- Armazenar dados privados do LinkedIn

### Compliance
- LGPD: Dados tratados apenas para fins comerciais legítimos
- GDPR: Aplicável se leads na UE
```

### Critérios de Aceite

- [ ] Audit log funcionando
- [ ] Rate limiting ativo
- [ ] Política de dados documentada
- [ ] Alertas configurados

---

## Checklist Final da Fase 3

### Pré-requisitos para avançar para Fase 4

- [ ] **3.1** Azure OpenAI em produção
- [ ] **3.2** Azure AI Vision para OCR
- [ ] **3.3** Bing grounding com citações
- [ ] **3.4** Azure AI Search com vetores
- [ ] **3.5** SharePoint integrado (ou planejado)
- [ ] **3.6** Compliance implementado

### Métricas de Sucesso

| Métrica | Meta |
|---------|------|
| Uptime | > 99.5% |
| Latência P95 | < 10s |
| Citações válidas | 100% |
| Audit coverage | 100% |

---

## Custos Estimados Azure

```
<!-- ESPAÇO PARA ESTIMATIVA DE CUSTOS -->

Azure OpenAI GPT-4o:
Azure AI Vision:
Azure AI Search:
Azure AI Foundry:
Total mensal estimado:

```

---

## Notas e Decisões

```
<!-- ESPAÇO PARA ANOTAÇÕES DURANTE IMPLEMENTAÇÃO -->




```

---

**Fase anterior**: [02_FASE2_INTELIGENCIA.md](02_FASE2_INTELIGENCIA.md)
**Próxima fase**: [04_FASE4_ESCALA.md](04_FASE4_ESCALA.md)
