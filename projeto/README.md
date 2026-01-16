# Buscador de Páginas - SDR ProspectFlow

## Visão Geral

Aplicação web para geração automática de playbooks de abordagem comercial usando IA. O sistema extrai dados de leads a partir de screenshots (ex: Salesforce), enriquece com pesquisas web em tempo real e gera um playbook completo para SDRs.

## Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui (Radix primitives)
- **Estado**: Zustand
- **Backend**: Supabase (Edge Functions)
- **IA**: OpenAI GPT-4o (extração de dados + web search)
- **Gráficos**: Recharts
- **Flow/Canvas**: @xyflow/react

## Estrutura do Projeto

```
src/
├── components/
│   ├── Canvas/          # Componentes de canvas/flow
│   ├── Nodes/           # Nós customizados para o canvas
│   ├── Playbook/        # Componentes do fluxo de playbook
│   │   ├── UploadStep.tsx       # Upload de screenshot
│   │   ├── ProcessingStep.tsx   # Tela de processamento
│   │   └── PlaybookView.tsx     # Visualização do playbook gerado
│   ├── Sidebar/         # Componentes de sidebar
│   └── ui/              # Componentes shadcn/ui
├── services/
│   ├── playbookService.ts      # Orquestra extração e geração
│   ├── webSearch.service.ts    # Pesquisa de evidências na web
│   ├── openai.service.ts       # Integração OpenAI
│   └── analysisService.ts      # Serviço de análise
├── store/
│   ├── playbookStore.ts        # Estado do playbook (Zustand)
│   ├── canvasStore.ts          # Estado do canvas
│   ├── leadStore.ts            # Estado de leads
│   └── conversationStore.ts    # Estado de conversas
├── types/
│   ├── playbook.types.ts       # Tipos do playbook
│   ├── lead.types.ts           # Tipos de lead
│   ├── methodology.types.ts    # Tipos de metodologia
│   └── node.types.ts           # Tipos de nós
├── integrations/
│   └── supabase/               # Cliente Supabase
├── hooks/                      # Custom hooks
├── lib/                        # Utilitários
└── templates/                  # Templates
```

## Fluxo Principal

1. **Upload** (`upload`): Usuário faz upload de screenshot do Salesforce/CRM
2. **Extração** (`extracting`): Edge function extrai dados do lead via GPT-4o Vision
3. **Contexto** (`context`): Dados extraídos são exibidos para validação
4. **Geração** (`generating`): Sistema gera playbook + pesquisa evidências web
5. **Playbook** (`playbook`): Exibe playbook completo com 6 seções

## Estrutura do Playbook Gerado

### 1. Resumo Executivo (5 bullets)
- Contexto da empresa
- Perfil do lead
- Prioridades 2026
- Ângulo de abordagem
- Contexto público

### 2. Evidências (6-10 itens)
- 3 evidências SAP/ERP
- 3 evidências de Tecnologia
- Com links reais pesquisados na web

### 3. Dores Prováveis (10 itens)
- Dor identificada + motivo plausível

### 4. Soluções Meta IT (10 itens)
- Mapeamento 1:1 com as dores

### 5. Perguntas Discovery (12 perguntas)
- 4 sobre fase/prioridades
- 4 sobre operação/integrações
- 4 sobre qualificação

### 6. Script de Abordagem
- Abertura
- Menção a sinais públicos
- Intenção clara
- 2 perguntas estratégicas
- Texto completo

## Configuração

### Variáveis de Ambiente (.env)

```env
VITE_SUPABASE_URL=sua-url-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-supabase
VITE_OPENAI_API_KEY=sua-chave-openai
```

### Instalação

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

## Edge Functions (Supabase)

- `extract-salesforce-data`: Extrai dados do lead a partir de imagem
- `generate-playbook`: Gera o playbook completo com IA
