# FASE 1: Fundação

> **Objetivo**: Implementar OCR robusto, pesquisa em etapas com citações e validação de qualidade.

## Status Geral da Fase

| Etapa | Descrição | Status |
|-------|-----------|--------|
| 1.1 | OCR e Extração de LeadCard | ⬜ |
| 1.2 | Pesquisa da Empresa | ⬜ |
| 1.3 | Pesquisa do Lead | ⬜ |
| 1.4 | Pesquisa Setorial | ⬜ |
| 1.5 | Validador de Citações | ⬜ |
| 1.6 | Cache de Resultados | ⬜ |

---

## 1.1 OCR e Extração de LeadCard

### Objetivo
Extrair dados estruturados do print do CRM/Salesforce com alta precisão.

### Tarefas

- [ ] Melhorar prompt de extração para capturar todos os campos
- [ ] Adicionar validação de campos obrigatórios (empresa, nome)
- [ ] Permitir edição manual dos dados extraídos
- [ ] Implementar fallback se OCR falhar
- [ ] Criar tela de confirmação antes de prosseguir

### Schema LeadCard

```json
{
  "empresa": "string",
  "site": "string | null",
  "segmento": "string | null",
  "regiao": "string | null",
  "lead_nome": "string",
  "lead_cargo": "string | null",
  "fonte_perfil_publico": "url | null",
  "anotacoes_sdr": "string | null",
  "data_captura": "date"
}
```

### Prompt de Extração

```
<!-- ESPAÇO PARA PROMPT DE OCR/EXTRAÇÃO -->




```

### Critérios de Aceite

- [ ] Extrai nome, cargo, empresa com 95%+ de acurácia
- [ ] Campos opcionais preenchidos quando disponíveis
- [ ] Usuário pode corrigir antes de avançar

---

## 1.2 Pesquisa da Empresa

### Objetivo
Coletar 5-8 evidências sobre a empresa focando SAP e tecnologia, com links obrigatórios.

### Tarefas

- [ ] Criar agente específico para pesquisa de empresa
- [ ] Implementar busca em fontes prioritárias (site institucional, imprensa, SAP News)
- [ ] Garantir 1-2 links por afirmação
- [ ] Rotular evidências fracas como "vi sinais públicos de..."
- [ ] Retornar JSON estruturado

### Schema Evidencia

```json
{
  "id": "string",
  "tipo": "empresa | lead | setor | concorrente",
  "titulo": "string",
  "descricao": "string",
  "data_publicacao": "date | null",
  "links": ["url", "url?"],
  "relevancia_sap": 1-5,
  "confianca": "alta | media | baixa"
}
```

### Prompt de Pesquisa da Empresa

```
<!-- ESPAÇO PARA PROMPT DE PESQUISA DA EMPRESA -->




```

### Critérios de Aceite

- [ ] Mínimo 5 evidências por empresa
- [ ] 100% das evidências com pelo menos 1 link válido
- [ ] Evidências fracas marcadas corretamente

---

## 1.3 Pesquisa do Lead

### Objetivo
Sumarizar perfil público do lead quando disponível, respeitando compliance LinkedIn.

### Tarefas

- [ ] Buscar apenas em fontes públicas indexadas
- [ ] Não usar scraping ou APIs restritas do LinkedIn
- [ ] Combinar dados do print com dados públicos
- [ ] Identificar histórico profissional relevante
- [ ] Inferir prioridades baseado no cargo

### Regras de Compliance

```
✅ PERMITIDO:
- Páginas públicas indexadas pelo Google/Bing
- Dados fornecidos pelo SDR no print
- Site institucional da empresa (página de equipe)

❌ PROIBIDO:
- LinkedIn API para lead gen
- Scraping automatizado
- Extensões de coleta de dados
```

### Prompt de Pesquisa do Lead

```
<!-- ESPAÇO PARA PROMPT DE PESQUISA DO LEAD -->




```

### Critérios de Aceite

- [ ] Respeita 100% das regras de compliance
- [ ] Se não encontrar dados públicos, usa apenas o print
- [ ] Não inventa informações sobre o lead

---

## 1.4 Pesquisa Setorial

### Objetivo
Identificar tendências, prioridades 2025-2026 e movimentos de concorrentes no setor.

### Tarefas

- [ ] Mapear CNAE/segmento para palavras-chave de busca
- [ ] Buscar notícias setoriais dos últimos 12 meses
- [ ] Identificar movimentos SAP no setor (S/4HANA, RISE, etc.)
- [ ] Listar concorrentes e seus movimentos tecnológicos
- [ ] Extrair prioridades típicas do setor

### Fontes Prioritárias por Setor

```
Varejo: Mercado&Consumo, SA Varejo, SBVC
Indústria: CNI, FIEMG, portais industriais
Agro: Canal Rural, Agrolink, ABES
Financeiro: Valor, InfoMoney, Fintechs Brasil
Saúde: Saúde Business, Healthcare Management
```

### Prompt de Pesquisa Setorial

```
<!-- ESPAÇO PARA PROMPT DE PESQUISA SETORIAL -->




```

### Critérios de Aceite

- [ ] Identifica 3-5 tendências do setor
- [ ] Lista 2-3 concorrentes com movimentos tech
- [ ] Prioridades 2025-2026 documentadas

---

## 1.5 Validador de Citações

### Objetivo
Garantir que toda afirmação tenha fonte verificável, rejeitando ou marcando conteúdo sem citação.

### Tarefas

- [ ] Criar função de validação de links (URL válida, acessível)
- [ ] Implementar regra: mínimo 1 link por evidência
- [ ] Marcar evidências com "confianca: baixa" se só 1 link
- [ ] Rejeitar evidências sem nenhum link
- [ ] Converter afirmações fracas em perguntas discovery

### Lógica de Validação

```
SE links.length === 0:
  → REJEITAR ou converter em pergunta discovery

SE links.length === 1:
  → confianca = "media"
  → adicionar flag "verificar_na_call"

SE links.length >= 2:
  → confianca = "alta"
```

### Critérios de Aceite

- [ ] 0% de evidências sem links no output final
- [ ] Evidências fracas viram perguntas discovery
- [ ] Links verificados como acessíveis (status 200)

---

## 1.6 Cache de Resultados

### Objetivo
Armazenar resultados de pesquisa para reduzir custos e garantir consistência.

### Tarefas

- [ ] Criar tabela de cache no Supabase
- [ ] Implementar TTL configurável (padrão 24h)
- [ ] Cache por empresa (domínio)
- [ ] Cache por setor (CNAE)
- [ ] Invalidação manual pelo SDR
- [ ] Métricas de hit/miss rate

### Schema Cache

```sql
CREATE TABLE research_cache (
  id UUID PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE,  -- "empresa:acme.com.br" ou "setor:varejo"
  tipo VARCHAR(50),                -- "empresa" | "lead" | "setor"
  resultado JSONB,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  hit_count INTEGER DEFAULT 0
);
```

### Critérios de Aceite

- [ ] Cache funcional com TTL
- [ ] Redução de 50%+ em chamadas de API repetidas
- [ ] SDR pode forçar refresh

---

## Checklist Final da Fase 1

### Pré-requisitos para avançar para Fase 2

- [ ] **1.1** OCR extraindo LeadCard com validação
- [ ] **1.2** Pesquisa empresa retornando 5+ evidências com links
- [ ] **1.3** Pesquisa lead respeitando compliance
- [ ] **1.4** Pesquisa setorial identificando tendências
- [ ] **1.5** Validador rejeitando evidências sem citação
- [ ] **1.6** Cache reduzindo chamadas repetidas

### Métricas de Sucesso

| Métrica | Meta |
|---------|------|
| Evidências com 2+ links | > 70% |
| Evidências com 1+ links | 100% |
| Tempo médio de geração | < 30s |
| Cache hit rate | > 40% |

---

## Notas e Decisões

```
<!-- ESPAÇO PARA ANOTAÇÕES DURANTE IMPLEMENTAÇÃO -->




```

---

**Próxima fase**: [02_FASE2_INTELIGENCIA.md](02_FASE2_INTELIGENCIA.md)
