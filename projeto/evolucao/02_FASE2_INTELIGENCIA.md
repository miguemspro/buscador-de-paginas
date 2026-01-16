# FASE 2: Inteligência

> **Objetivo**: Implementar banco de cases, ranking por similaridade e sensibilidade a cargo.

## Pré-requisitos

⚠️ **Antes de iniciar esta fase, confirme:**

- [ ] Fase 1 100% completa
- [ ] Pesquisa em etapas funcionando
- [ ] Validador de citações ativo
- [ ] Cache implementado

---

## Status Geral da Fase

| Etapa | Descrição | Status |
|-------|-----------|--------|
| 2.1 | Banco de Cases Meta IT | ⬜ |
| 2.2 | Motor de Dores Prováveis | ⬜ |
| 2.3 | Mapeamento Dor → Solução | ⬜ |
| 2.4 | Sensibilidade a Cargo | ⬜ |
| 2.5 | Ranking de Cases por Similaridade | ⬜ |
| 2.6 | Geração de Entregáveis | ⬜ |

---

## 2.1 Banco de Cases Meta IT

### Objetivo
Criar base de cases estruturada com interface visual de administração para cadastro e gestão.

### Divisão de Trabalho

| Tarefa | Responsável |
|--------|-------------|
| Criar tabela no Supabase | Claude Code |
| Configurar autenticação admin | Claude Code |
| Criar página /admin/cases | Lovable |
| Criar formulário de cadastro | Lovable |
| Criar listagem com edição/exclusão | Lovable |
| Gerar embeddings para cada case | Claude Code |
| Implementar busca por similaridade | Claude Code |

### Tarefas

- [ ] Definir estrutura de dados do case
- [ ] Criar tabela no Supabase *(Claude Code)*
- [ ] Configurar Supabase Auth para admin *(Claude Code)*
- [ ] **Criar página /admin/cases no site** *(Lovable)*
- [ ] **Criar formulário visual de cadastro de case** *(Lovable)*
- [ ] **Criar listagem de cases com edição/exclusão** *(Lovable)*
- [ ] Gerar embeddings para cada case *(Claude Code)*
- [ ] Implementar busca por similaridade *(Claude Code)*

### Schema CaseMeta

```json
{
  "id": "uuid",
  "cliente": "string",
  "setor": "string",
  "pais": "string",
  "porte": "pequeno | medio | grande | enterprise",
  "produto_vendido": "string",
  "modulos_sap": ["MM", "SD", "FI", "CO", "PP", "TM", "EWM", "etc"],
  "tipo_projeto": "implementacao | migracao | upgrade | AMS | dados | BTP | DRC | analytics",
  "desafio": "string",
  "solucao": "string",
  "resultado_chave": "string",
  "metricas": {
    "reducao_tempo": "string | null",
    "reducao_custo": "string | null",
    "aumento_eficiencia": "string | null"
  },
  "link_case": "url | null",
  "data_projeto": "date",
  "embedding": "vector(1536)"
}
```

### SQL de Criação

```sql
-- ESPAÇO PARA SQL DE CRIAÇÃO DA TABELA CASES




```

### Lista de Cases para Importar

```
<!-- ESPAÇO PARA LISTAR CASES DA META IT -->

1.
2.
3.
4.
5.

```

### Interface Visual - Página /admin/cases

```
┌─────────────────────────────────────────────────────────────────┐
│  Cases Meta IT                                    [+ Novo Case] │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Buscar case...                    Filtro: [Todos os setores]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📦 Cliente XYZ - Varejo                                 │   │
│  │ Tipo: Migração S/4HANA | Módulos: MM, SD, FI           │   │
│  │ Resultado: Redução de 30% no tempo de fechamento       │   │
│  │                                    [Editar] [Excluir]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📦 Cliente ABC - Indústria                              │   │
│  │ Tipo: AMS | Módulos: PP, QM, PM                        │   │
│  │ Resultado: 99.5% de disponibilidade do sistema         │   │
│  │                                    [Editar] [Excluir]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Formulário de Cadastro de Case

```
┌─────────────────────────────────────────────────────────────────┐
│  Novo Case                                              [X]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Cliente *                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Setor *                              Porte                     │
│  ┌───────────────────────┐           ┌───────────────────────┐ │
│  │ Selecione...       ▼  │           │ Selecione...       ▼  │ │
│  └───────────────────────┘           └───────────────────────┘ │
│                                                                 │
│  Tipo de Projeto *                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Selecione...                                         ▼  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Módulos SAP                                                    │
│  [x] MM  [x] SD  [ ] FI  [ ] CO  [ ] PP  [ ] TM  [ ] EWM       │
│                                                                 │
│  Desafio do Cliente *                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Solução Aplicada *                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Resultado Chave *                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Link do Case (opcional)                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ https://                                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                              [Cancelar]  [Salvar Case]          │
└─────────────────────────────────────────────────────────────────┘
```

### Critérios de Aceite

- [ ] Página /admin/cases funcional
- [ ] Formulário de cadastro completo
- [ ] Listagem com busca e filtros
- [ ] Edição e exclusão funcionando
- [ ] Mínimo 10 cases cadastrados
- [ ] Todos cases com embeddings gerados
- [ ] Busca por similaridade retornando top 3

---

## 2.2 Motor de Dores Prováveis

### Objetivo
Derivar 10 dores com base nas evidências, setor e cargo do lead.

### Tarefas

- [ ] Criar lógica de inferência de dores
- [ ] Amarrar cada dor a 1+ evidências
- [ ] Ordenar por prioridade/relevância
- [ ] Calibrar por cargo (C-level vs Key User)
- [ ] Converter inferências fracas em perguntas

### Schema DorProvavel

```json
{
  "id": "string",
  "descricao": "string",
  "motivo_baseado_em": ["id_evidencia", "segmento", "cargo_lead"],
  "prioridade": 1-10,
  "confianca": "alta | media | baixa",
  "relevante_para_cargos": ["C-level", "Diretor", "Gerente", "Especialista", "Key User"]
}
```

### Matriz Dor x Evidência

| Tipo de Evidência | Dores Típicas |
|-------------------|---------------|
| Migração S/4HANA anunciada | Estabilização, dados mestres, integrações |
| Vagas SAP abertas | Falta de recursos, conhecimento interno |
| Notícia de fusão/aquisição | Consolidação de sistemas, harmonização |
| Crescimento acelerado | Escalabilidade, performance, novos módulos |
| Projeto de transformação digital | Change management, adoção, treinamento |

### Prompt de Geração de Dores

```
<!-- ESPAÇO PARA PROMPT DE GERAÇÃO DE DORES -->




```

### Critérios de Aceite

- [ ] 10 dores geradas por lead
- [ ] Cada dor amarrada a pelo menos 1 evidência
- [ ] Dores ordenadas por prioridade
- [ ] Dores de C-level não aparecem para Key User

---

## 2.3 Banco de Soluções Meta IT

### Objetivo
Criar catálogo de soluções/capacidades da Meta IT com interface visual de administração.

### Divisão de Trabalho

| Tarefa | Responsável |
|--------|-------------|
| Criar tabela no Supabase | Claude Code |
| Criar página /admin/solucoes | Lovable |
| Criar formulário de cadastro | Lovable |
| Criar listagem com edição/exclusão | Lovable |
| Implementar mapeamento dor → solução | Claude Code |
| Aplicar restrição por cargo | Claude Code |

### Tarefas

- [ ] Definir estrutura de dados da solução
- [ ] Criar tabela no Supabase *(Claude Code)*
- [ ] **Criar página /admin/solucoes no site** *(Lovable)*
- [ ] **Criar formulário visual de cadastro de solução** *(Lovable)*
- [ ] **Criar listagem de soluções com edição/exclusão** *(Lovable)*
- [ ] Implementar mapeamento automático dor → solução *(Claude Code)*
- [ ] Aplicar restrição por cargo *(Claude Code)*

### Catálogo de Capacidades Meta IT

```json
{
  "capacidades": [
    "S4HANA",
    "BTP",
    "CPI",
    "PI/PO",
    "Fiori",
    "SolMan",
    "Ariba",
    "SuccessFactors",
    "DRC (Reforma Tributária)",
    "SAC/BW/BO",
    "GRC",
    "Basis",
    "AMS",
    "Smart AMS",
    "Operação Assistida",
    "Squads",
    "Dados e IA"
  ]
}
```

### Schema SolucaoMeta

```json
{
  "id": "uuid",
  "nome": "string",
  "categoria": "string",
  "descricao": "string",
  "beneficios": ["string"],
  "dores_relacionadas": ["string"],
  "modulos_sap": ["MM", "SD", "FI", "etc"],
  "restricao_por_cargo": ["C-level", "Diretor", "Gerente", "Especialista", "Key User"],
  "casos_de_uso": ["string"],
  "resultado_esperado": "string",
  "ativo": true
}
```

### SQL de Criação

```sql
-- ESPAÇO PARA SQL DE CRIAÇÃO DA TABELA SOLUCOES




```

### Interface Visual - Página /admin/solucoes

```
┌─────────────────────────────────────────────────────────────────┐
│  Soluções Meta IT                              [+ Nova Solução] │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Buscar solução...               Filtro: [Todas as categorias]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔧 S/4HANA                                    [Ativo]   │   │
│  │ Categoria: ERP | Módulos: Todos                        │   │
│  │ Migração e implementação do SAP S/4HANA                │   │
│  │                                    [Editar] [Excluir]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔧 AMS - Application Management                [Ativo]   │   │
│  │ Categoria: Suporte | Módulos: Todos                    │   │
│  │ Sustentação e evolução contínua do ambiente SAP        │   │
│  │                                    [Editar] [Excluir]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔧 BTP - Business Technology Platform          [Ativo]   │   │
│  │ Categoria: Integração | Módulos: -                     │   │
│  │ Extensões e integrações na plataforma SAP BTP          │   │
│  │                                    [Editar] [Excluir]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Formulário de Cadastro de Solução

```
┌─────────────────────────────────────────────────────────────────┐
│  Nova Solução                                           [X]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Nome da Solução *                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Categoria *                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Selecione...                                         ▼  │   │
│  └─────────────────────────────────────────────────────────┘   │
│  (ERP, Integração, Analytics, Suporte, Dados, Fiscal, etc.)    │
│                                                                 │
│  Descrição *                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                                                         │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Benefícios (um por linha)                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Redução de custos operacionais                       │   │
│  │ • Maior agilidade nos processos                        │   │
│  │ •                                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Dores que esta solução resolve (um por linha)                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Sistemas legados desatualizados                      │   │
│  │ • Falta de integração entre áreas                      │   │
│  │ •                                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Módulos SAP Relacionados                                       │
│  [ ] MM  [ ] SD  [ ] FI  [ ] CO  [ ] PP  [ ] TM  [ ] EWM       │
│  [ ] BTP [ ] CPI [ ] Fiori [ ] Analytics [ ] Todos             │
│                                                                 │
│  Público-alvo (cargos)                                          │
│  [x] C-level  [x] Diretor  [x] Gerente  [ ] Especialista       │
│  [ ] Key User                                                   │
│                                                                 │
│  Resultado Esperado (1 frase, tom consultivo)                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Ex: "Potencial para reduzir tempo de fechamento"       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [x] Solução ativa                                              │
│                                                                 │
│                            [Cancelar]  [Salvar Solução]         │
└─────────────────────────────────────────────────────────────────┘
```

### Lista de Soluções para Cadastrar

```
<!-- ESPAÇO PARA LISTAR SOLUÇÕES DA META IT -->

1. S/4HANA -
2. BTP -
3. CPI -
4. AMS -
5. Smart AMS -
6. DRC (Reforma Tributária) -
7. Basis -
8. Fiori -
9. Analytics (SAC/BW/BO) -
10. Dados e IA -
11.
12.

```

### Prompt de Mapeamento Dor → Solução

```
<!-- ESPAÇO PARA PROMPT DE MAPEAMENTO DOR → SOLUÇÃO -->




```

### Critérios de Aceite

- [ ] Página /admin/solucoes funcional
- [ ] Formulário de cadastro completo
- [ ] Listagem com busca e filtros
- [ ] Edição e exclusão funcionando
- [ ] Mínimo 10 soluções cadastradas
- [ ] Mapeamento dor → solução funcionando
- [ ] Tom consultivo em todas as soluções

---

## 2.4 Sensibilidade a Cargo

### Objetivo
Calibrar todo o output baseado no nível hierárquico do lead.

### Tarefas

- [ ] Criar classificador de cargo (C-level, Diretor, Gerente, Especialista, Key User)
- [ ] Definir filtros por nível
- [ ] Ajustar linguagem por cargo
- [ ] Filtrar dores irrelevantes
- [ ] Filtrar soluções irrelevantes

### Matriz Cargo x Conteúdo

| Cargo | Foco de Dores | Foco de Soluções | Linguagem |
|-------|---------------|------------------|-----------|
| C-level | Estratégia, ROI, Competitividade | Transformação, Valor de negócio | Executiva |
| Diretor | Resultados, Prazos, Orçamento | Projetos, Entregas | Gerencial |
| Gerente | Operação, Equipe, Processos | Eficiência, Automação | Tática |
| Especialista | Técnico, Integração, Performance | Ferramentas, Metodologia | Técnica |
| Key User | Dia-a-dia, Usabilidade, Treinamento | Suporte, Capacitação | Prática |

### Regras de Filtro

```
SE cargo == "Key User":
  REMOVER dores sobre: "decisão de investimento", "estratégia corporativa", "M&A"
  REMOVER soluções sobre: "Reforma Tributária", "decisões de board"

SE cargo == "C-level":
  PRIORIZAR dores sobre: "competitividade", "inovação", "resultados financeiros"
  LINGUAGEM: evitar jargões técnicos, focar em valor de negócio
```

### Prompt de Ajuste por Cargo

```
<!-- ESPAÇO PARA PROMPT DE AJUSTE POR CARGO -->




```

### Critérios de Aceite

- [ ] Classificador de cargo funcionando
- [ ] Filtros aplicados corretamente
- [ ] Linguagem ajustada por nível

---

## 2.5 Ranking de Cases por Similaridade

### Objetivo
Selecionar 1-3 cases mais aderentes ao contexto do lead.

### Tarefas

- [ ] Gerar embedding do contexto do lead
- [ ] Buscar cases por similaridade de vetor
- [ ] Aplicar filtros (setor, módulos, tipo projeto)
- [ ] Ranquear por score combinado
- [ ] Retornar top 3 com justificativa

### Algoritmo de Ranking

```
score_final = (
  similaridade_embedding * 0.4 +
  match_setor * 0.25 +
  match_modulos * 0.2 +
  match_tipo_projeto * 0.15
)

ORDENAR por score_final DESC
RETORNAR top 3
```

### SQL de Busca por Similaridade

```sql
-- ESPAÇO PARA SQL DE BUSCA POR SIMILARIDADE




```

### Critérios de Aceite

- [ ] Retorna 1-3 cases relevantes
- [ ] Cases do mesmo setor priorizados
- [ ] Justificativa de seleção para cada case

---

## 2.6 Geração de Entregáveis

### Objetivo
Produzir o playbook completo em Markdown com todas as seções.

### Tarefas

- [ ] Consolidar todas as etapas anteriores
- [ ] Gerar Resumo Executivo (5 bullets)
- [ ] Montar seção de Evidências com links
- [ ] Listar Dores Prováveis ordenadas
- [ ] Mapear Soluções Meta IT
- [ ] Incluir Case Relevante

### Estrutura do Playbook Final

```markdown
# Playbook de Abordagem: [EMPRESA]

## 1. Resumo Executivo
- Contexto da empresa
- Perfil do lead
- Prioridades 2025-2026
- Ângulo de abordagem
- Contexto público

## 2. Evidências e Notícias (com links)
### SAP/ERP
- [Evidência 1](link)
- [Evidência 2](link)

### Tecnologia
- [Evidência 3](link)
- [Evidência 4](link)

## 3. Dores Prováveis
1. Dor X - Motivo
2. Dor Y - Motivo
...

## 4. Como a Meta IT Pode Ajudar
| Dor | Solução | Resultado Esperado |
|-----|---------|-------------------|
| ... | ...     | ...               |

## 5. Case Relevante
**[Cliente]** - [Tipo de Projeto]
Resultado: ...

<!-- FORA DO ESCOPO POR ENQUANTO:
## 6. Perguntas Discovery
## 7. Script de Abordagem
-->
```

### Prompt de Geração Final

```
<!-- ESPAÇO PARA PROMPT DE GERAÇÃO FINAL DO PLAYBOOK -->




```

### Critérios de Aceite

- [ ] Todas as 5 seções presentes
- [ ] Links funcionais nas evidências
- [ ] Tom consultivo mantido
- [ ] Sensibilidade a cargo aplicada

---

## Checklist Final da Fase 2

### Pré-requisitos para avançar para Fase 3

- [ ] **2.1** Banco de cases com 10+ registros
- [ ] **2.2** Motor de dores gerando 10 dores/lead
- [ ] **2.3** Mapeamento 1:1 dor → solução
- [ ] **2.4** Filtros por cargo funcionando
- [ ] **2.5** Ranking retornando cases relevantes
- [ ] **2.6** Playbook completo sendo gerado

### Métricas de Sucesso

| Métrica | Meta |
|---------|------|
| Dores confirmadas na call | > 60% |
| Cases apresentados aceitos | > 50% |
| Tempo de geração completa | < 45s |
| Satisfação SDR | > 4/5 |

---

## Notas e Decisões

```
<!-- ESPAÇO PARA ANOTAÇÕES DURANTE IMPLEMENTAÇÃO -->




```

---

**Fase anterior**: [01_FASE1_FUNDACAO.md](01_FASE1_FUNDACAO.md)
**Próxima fase**: [03_FASE3_ENTERPRISE.md](03_FASE3_ENTERPRISE.md)
