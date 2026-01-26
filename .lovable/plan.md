
# Plano: Cadastro Completo dos Cases de Sucesso da Meta IT

## Resumo

Vou cadastrar **18 cases de sucesso** extraídos do site oficial da Meta IT na tabela `meta_cases`. Os cases estão divididos em:
- **7 cases detalhados** (com informações completas)
- **11 cases em preparação** (com informações básicas)

## Cases a Cadastrar

### Cases Detalhados (7)

| # | Empresa | Setor | Tipo de Projeto |
|---|---------|-------|-----------------|
| 1 | Bruning | Industrial/Metalmecânico | Atualização S/4HANA + Reforma Tributária |
| 2 | Cocatrel | Agronegócio/Laticínios | Automação Industrial + S/4HANA |
| 3 | Meta | Tecnologia | Transformação Digital Interna |
| 4 | Tromink | Agronegócio/Industrial | Implementação S/4HANA |
| 5 | Argenta | Combustíveis | Implementação S/4HANA Rise |
| 6 | Supera Farma | Farmacêutico | Implementação S/4HANA Rise |
| 7 | Lavoro | Agronegócio | Rollout + AMS |

### Cases em Preparação (11)

| # | Empresa | Setor | Título |
|---|---------|-------|--------|
| 8 | Paradise Mobile | Tecnologia | 5G tecnologia e inovação |
| 9 | V4 | Financeiro | Preparação para IPO |
| 10 | Sicoob | Financeiro | Redução de R$3M em custos |
| 11 | TJ-RS | Setor Público | Transformação digital |
| 12 | Min. Justiça | Setor Público | Vanguarda digital |
| 13 | CRT-BA | Setor Público | DX para órgãos públicos |
| 14 | Olist | Tecnologia | Unicórnio brasileiro |
| 15 | Bruning (v2) | Industrial | Atualização S/4HANA |
| 16 | TV Globo | Mídia | Transformação ágil |
| 17 | Sicredi | Financeiro | BPO |
| 18 | Banco Original | Financeiro | Transformação ágil |

## Mapeamento de Campos

Cada case será cadastrado seguindo a estrutura da tabela `meta_cases`:

```text
┌────────────────────────────────────────────────────────────────┐
│  CAMPOS OBRIGATÓRIOS                                           │
├────────────────────────────────────────────────────────────────┤
│  company_name     → Nome da Empresa (ex: "Bruning")            │
│  industry         → Setor principal (ex: "Industrial")         │
│  industry_keywords→ Keywords do setor ["metalmecânico", ...]   │
│  title            → Título do case                             │
│  description      → Descrição completa (min 50 palavras)       │
│  results          → Array de resultados obtidos                │
│  sap_solutions    → Soluções SAP utilizadas ["S/4HANA", ...]   │
├────────────────────────────────────────────────────────────────┤
│  CAMPOS OPCIONAIS                                              │
├────────────────────────────────────────────────────────────────┤
│  company_size     → Porte (pequeno/medio/grande/enterprise)    │
│  sap_modules      → Módulos SAP ["MM", "FI", ...]              │
│  challenge        → Desafio do cliente                         │
│  solution         → Solução aplicada pela Meta                 │
│  key_result       → Resultado principal destacado              │
│  project_type     → Tipo de projeto (implementacao/migracao)   │
│  case_url         → Link do case no site                       │
│  country          → País ("Brasil")                            │
│  is_active        → true (para cases detalhados)               │
│                   → false (para cases em preparação)           │
└────────────────────────────────────────────────────────────────┘
```

## Detalhamento Técnico

### Estrutura de Cada Case

**Exemplo - Case Bruning (detalhado):**
```json
{
  "company_name": "Bruning",
  "industry": "Industrial",
  "industry_keywords": ["metalmecânico", "manufatura", "indústria"],
  "company_size": "enterprise",
  "title": "Bruning evolui sua operação para a última versão do SAP S/4HANA e se prepara para a reforma tributária",
  "description": "Atualização para a última versão do SAP S/4HANA, migrando de um sistema próprio para uma solução ERP robusta, visando conformidade com a Reforma Tributária e busca contínua por eficiência. A Bruning, com mais de 1.001 colaboradores, é referência no setor metalmecânico brasileiro.",
  "challenge": "Sustentar o crescimento acelerado, garantir conformidade com a Reforma Tributária e manter a eficiência operacional.",
  "solution": "Atualização do SAP S/4HANA com a Meta, com foco em alinhamento cultural, equipes integradas e Gestão de Mudança Organizacional (GMO).",
  "key_result": "Preparação para a Reforma Tributária e potencialização do uso da ferramenta para decisões mais seguras.",
  "results": [
    "Maior estabilidade operacional",
    "Melhorias na integração entre módulos e processos",
    "Mais eficiência na tomada de decisão",
    "Base tecnológica preparada para exigências fiscais",
    "Fortalecimento da estrutura interna"
  ],
  "sap_solutions": ["S/4HANA", "DRC"],
  "sap_modules": ["FI", "CO", "MM", "SD"],
  "project_type": "upgrade",
  "case_url": "https://meta.com.br/cases/bruning-atualizacao",
  "country": "Brasil",
  "is_active": true
}
```

**Exemplo - Case em Preparação (Sicoob):**
```json
{
  "company_name": "Sicoob",
  "industry": "Financeiro",
  "industry_keywords": ["cooperativa", "crédito", "banco", "financeiro"],
  "company_size": "enterprise",
  "title": "Sicoob reduz R$3 milhões em custos operacionais com apoio da Meta",
  "description": "Projeto de otimização e redução de custos operacionais com o Sicoob, uma das maiores cooperativas de crédito do Brasil, resultando em economia significativa de R$3 milhões.",
  "results": ["Redução de R$3 milhões em custos operacionais"],
  "sap_solutions": ["S/4HANA"],
  "project_type": "implementacao",
  "case_url": "https://meta.com.br/cases/sicoob",
  "country": "Brasil",
  "is_active": false
}
```

## Execução

A inserção será feita em **2 lotes**:

1. **Lote 1**: 7 cases detalhados (com `is_active: true`)
2. **Lote 2**: 11 cases em preparação (com `is_active: false`)

Os cases em preparação ficam com `is_active: false` para não aparecerem nos playbooks até que tenham conteúdo completo. Quando o site da Meta IT atualizar o conteúdo, basta mudar para `is_active: true`.

## Resultado Final

Após a execução, a tabela `meta_cases` terá:
- **18 cases** cadastrados
- **7 cases ativos** (aparecem nos playbooks)
- **11 cases inativos** (prontos para ativação futura)

Os cases serão automaticamente utilizados pelo sistema de ranking para sugerir cases relevantes baseados em:
- Similaridade de indústria
- Módulos SAP em comum
- Tipo de projeto correspondente
