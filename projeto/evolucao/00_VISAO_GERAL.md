# Evolução SDR ProspectFlow - Visão Geral

## Objetivo
Transformar o SDR ProspectFlow em uma plataforma enterprise-ready com pesquisa em etapas, validação de citações, banco de cases e sensibilidade a cargo.

## Arquitetura Alvo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SDR ProspectFlow v2                          │
├─────────────────────────────────────────────────────────────────────┤
│  INTAKE     │  PESQUISA    │  INTELIGÊNCIA  │  ENTREGÁVEIS         │
│  ─────────  │  ──────────  │  ────────────  │  ────────────        │
│  • OCR      │  • Empresa   │  • Dores       │  • Playbook MD       │
│  • LeadCard │  • Lead      │  • Soluções    │  • Script            │
│             │  • Setor     │  • Cases       │  • Discovery         │
│             │  • Tech      │                │                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Fases do Projeto

| Fase | Nome | Foco | Status |
|------|------|------|--------|
| 1 | Fundação | OCR + Pesquisa em etapas + Citações | ⬜ Não iniciada |
| 2 | Inteligência | Banco de cases + Ranking + Cargo | ⬜ Não iniciada |
| 3 | Enterprise | Azure + SharePoint + Métricas | ⬜ Não iniciada |
| 4 | Escala | Feedback loop + Otimizações | ⬜ Não iniciada |

## Stack Tecnológica Planejada

### Fase 1-2 (Atual + Melhorias)
- Frontend: React + TypeScript + Vite
- Backend: Supabase Edge Functions
- LLM: OpenAI GPT-4o
- Pesquisa: OpenAI web_search_preview → Bing grounding
- Banco: Supabase PostgreSQL

### Fase 3-4 (Enterprise)
- LLM: Azure OpenAI GPT-4o
- OCR: Azure AI Vision
- Pesquisa: Azure AI Foundry + Bing grounding
- Vetores: Azure AI Search
- Docs internos: Microsoft 365 Copilot Retrieval API

## Documentos desta Pasta

| Arquivo | Conteúdo |
|---------|----------|
| `01_FASE1_FUNDACAO.md` | OCR, pesquisa em etapas, validação de citações |
| `02_FASE2_INTELIGENCIA.md` | Banco de cases, ranking, sensibilidade a cargo |
| `03_FASE3_ENTERPRISE.md` | Migração Azure, SharePoint, compliance |
| `04_FASE4_ESCALA.md` | Feedback loop, métricas, otimizações |

## Escopo Atual

**Incluído:**
- Resumo Executivo
- Evidências e Notícias
- Dores Prováveis
- Soluções Meta IT
- Cases Relevantes

**Fora do escopo (por enquanto):**
- Script de Abordagem
- Perguntas Discovery

## Decisões Técnicas

| Decisão | Escolha |
|---------|---------|
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação Admin | Sim - usuário e senha via Supabase Auth |
| Frontend | Lovable (para páginas admin) |
| Backend/Lógica complexa | Claude Code |
| Cases iniciais | Cadastro manual via interface |
| Soluções iniciais | Cadastro manual via interface |

## Princípios de Qualidade

1. **Toda afirmação com 1-2 links** - Sem alucinações
2. **Cache 24-72h** - Reduzir custo e garantir consistência
3. **Sensibilidade a cargo** - Não sugerir decisões C-level para Key Users
4. **Compliance LinkedIn** - Só dados públicos ou fornecidos pelo usuário
5. **Tom consultivo** - Diagnosticar antes de oferecer

## Como Usar

1. Abra o documento da fase atual
2. Siga as etapas em ordem
3. Marque cada checkbox [x] quando concluído
4. Preencha os prompts nos espaços indicados
5. Só avance para próxima fase quando todas etapas estiverem completas
