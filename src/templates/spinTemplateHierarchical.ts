import type { TemplateDefinition } from '../types/methodology.types';

export const spinTemplateHierarchical: TemplateDefinition = {
  id: 'spin-selling-hierarchical',
  name: 'SPIN Selling Hierárquico',
  description: 'Metodologia SPIN com estrutura hierárquica de perguntas, respostas e follow-ups',
  phases: [
    {
      id: 'abertura',
      title: 'Abertura',
      type: 'opening',
      icon: '🎤',
      description: 'Quebra-gelo inicial e apresentação',
      defaultContent: `Oi [nome do lead]! Tudo bem?

Meu nome é [Seu Nome], faço parte do time da Meta IT.

Acredito ter pego você desprevenido nesse começo de segunda, mas preciso apenas de 20 segundos para explicar o motivo da minha ligação e, caso faça sentido para você, a gente continua conversando. O que você acha?`,
      children: [
        {
          id: 'abertura-positiva',
          title: '✅ RESPOSTA POSITIVA',
          type: 'response-positive',
          icon: '✅',
          description: 'Prospect aceita conversar',
          defaultContent: 'Claro! Pode falar.',
          children: [
            {
              id: 'gancho',
              title: 'Gancho de Conexão',
              type: 'hook',
              icon: '🎯',
              description: 'Contextualização e criação de relevância',
              defaultContent: `De forma bem objetiva, [lead]: trabalhamos com todo o ciclo SAP — desde AMS, adequações para a Reforma Tributária, migração e upgrade para S/4HANA, até rollouts, melhorias e evolução contínua do ambiente.

Além disso, temos uma operação robusta de outsourcing de especialistas SAP, com consultores funcionais e técnicos, arquitetos e líderes para reforçar squads internos e acelerar projetos críticos.

Tenho conversado com vários Gerentes de Tecnologia e um ponto comum é [dor/tendência do setor]. Imagino que seja um desafio para vocês também, me corrija se estiver errado.`
            }
          ]
        },
        {
          id: 'abertura-negativa',
          title: '❌ RESPOSTA NEGATIVA',
          type: 'response-negative',
          icon: '❌',
          description: 'Prospect resiste',
          defaultContent: 'Não tenho tempo agora.',
          children: [
            {
              id: 'objecao-tempo',
              title: 'Tratamento: Falta de Tempo',
              type: 'objections',
              icon: '⚠️',
              description: 'Contornar objeção de tempo',
              defaultContent: `Entendo perfeitamente, [lead]!

São literalmente 20 segundos só para contextualizar. Se não fizer sentido, encerro a ligação. Posso?`
            }
          ]
        }
      ]
    },
    {
      id: 'situation-1',
      title: 'Situation (S) - Pergunta 1',
      type: 'discovery',
      method: 'SPIN',
      icon: '🔍',
      description: 'Stack tecnológica atual',
      defaultContent: 'Qual é a stack tecnológica que vocês usam atualmente?',
      children: [
        {
          id: 'situation-1-positiva',
          title: '✅ Usa SAP',
          type: 'response-positive',
          icon: '✅',
          description: 'Cliente usa SAP',
          defaultContent: 'Usamos SAP ECC 6.0',
          children: [
            {
              id: 'situation-1-followup-positivo',
              title: 'Follow-up: Versão SAP',
              type: 'followup',
              icon: '💬',
              description: 'Aprofundar na versão SAP',
              defaultContent: `Perfeito! E vocês já iniciaram algum projeto de modernização ou migração para S/4HANA?`
            }
          ]
        },
        {
          id: 'situation-1-negativa',
          title: '❌ Não usa SAP',
          type: 'response-negative',
          icon: '❌',
          description: 'Cliente não usa SAP',
          defaultContent: 'Não usamos SAP, usamos outro ERP',
          children: [
            {
              id: 'situation-1-followup-negativo',
              title: 'Follow-up: Integração',
              type: 'followup',
              icon: '💬',
              description: 'Explorar necessidade de integração',
              defaultContent: `Entendo! E como vocês fazem a integração entre os sistemas? Tem algum desafio de integração ou falta de dados centralizados?`
            }
          ]
        }
      ]
    },
    {
      id: 'problem-1',
      title: 'Problem (P) - Pergunta 1',
      type: 'discovery',
      method: 'SPIN',
      icon: '🔍',
      description: 'Desafios com integração',
      defaultContent: 'Quais são os maiores desafios que vocês enfrentam com a integração de sistemas?',
      children: [
        {
          id: 'problem-1-positiva',
          title: '✅ Tem Desafios',
          type: 'response-positive',
          icon: '✅',
          description: 'Cliente reconhece desafios',
          defaultContent: 'Sim, temos problemas de integração entre nossos sistemas legados',
          children: [
            {
              id: 'problem-1-followup-positivo',
              title: 'Follow-up: Impacto',
              type: 'followup',
              icon: '💬',
              description: 'Aprofundar no impacto',
              defaultContent: `E quanto tempo da sua equipe é desperdiçado com integrações manuais ou processos repetitivos?`
            }
          ]
        },
        {
          id: 'problem-1-neutra',
          title: '⚠️ Desafios Menores',
          type: 'response-neutral',
          icon: '⚠️',
          description: 'Cliente tem desafios menores',
          defaultContent: 'Temos alguns desafios, mas nada muito crítico',
          children: [
            {
              id: 'problem-1-followup-neutro',
              title: 'Follow-up: Agilidade',
              type: 'followup',
              icon: '💬',
              description: 'Explorar agilidade',
              defaultContent: `Entendo. E em relação à agilidade na entrega de novas funcionalidades, vocês conseguem entregar na velocidade que o negócio precisa?`
            }
          ]
        }
      ]
    },
    {
      id: 'implication-1',
      title: 'Implication (I) - Pergunta 1',
      type: 'discovery',
      method: 'SPIN',
      icon: '🔍',
      description: 'Impacto da falta de agilidade',
      defaultContent: 'Se essa falta de agilidade continuar, qual seria o impacto no lançamento de novos produtos e na competitividade da empresa?',
      children: [
        {
          id: 'implication-1-positiva',
          title: '✅ Reconhece Impacto',
          type: 'response-positive',
          icon: '✅',
          description: 'Cliente reconhece impacto',
          defaultContent: 'Sim, isso afetaria nossa competitividade no mercado',
          children: [
            {
              id: 'implication-1-followup-positivo',
              title: 'Follow-up: Custo',
              type: 'followup',
              icon: '💬',
              description: 'Quantificar impacto financeiro',
              defaultContent: `E em termos financeiros, vocês conseguem estimar quanto isso representa em receita perdida ou custos operacionais?`
            }
          ]
        },
        {
          id: 'implication-1-negativa',
          title: '❌ Não Vê Impacto',
          type: 'response-negative',
          icon: '❌',
          description: 'Cliente não vê impacto imediato',
          defaultContent: 'Não vejo isso como um problema tão grande',
          children: [
            {
              id: 'implication-1-followup-negativo',
              title: 'Follow-up: Competição',
              type: 'followup',
              icon: '💬',
              description: 'Trazer perspectiva de mercado',
              defaultContent: `Entendo. E como vocês veem seus competidores? Eles têm sido mais ágeis no lançamento de novos produtos?`
            }
          ]
        }
      ]
    },
    {
      id: 'need-payoff-1',
      title: 'Need-Payoff (N) - Pergunta 1',
      type: 'discovery',
      method: 'SPIN',
      icon: '🔍',
      description: 'Valor de automatizar',
      defaultContent: 'Seria valioso ter uma plataforma que automatizasse essas integrações e reduzisse o tempo de deployment?',
      children: [
        {
          id: 'need-payoff-1-positiva',
          title: '✅ Sim, Seria Valioso',
          type: 'response-positive',
          icon: '✅',
          description: 'Cliente vê valor',
          defaultContent: 'Sim, isso seria muito valioso para nós',
          children: [
            {
              id: 'apresentacao',
              title: 'Apresentação da Solução',
              type: 'presentation',
              icon: '🎁',
              description: 'Apresentar solução customizada',
              defaultContent: `Perfeito, [lead]! É exatamente aí que a Meta IT pode ajudar.

Somos especialistas em transformação digital e temos 35 anos de experiência em implementação de soluções SAP.

Nossa abordagem tem 4 pilares:

1. DIAGNÓSTICO E SIMULAÇÃO
   → Mapeamos seu ambiente atual e simulamos o impacto da solução

2. IMPLEMENTAÇÃO ÁGIL
   → Implementamos em sprints, com entrega de valor incremental

3. GESTÃO DA TRANSIÇÃO
   → Garantimos zero downtime e migração segura dos dados

4. CASES DE SUCESSO
   → Temos 120+ projetos em empresas como [exemplos do mesmo setor]`,
              children: [
                {
                  id: 'cta',
                  title: 'Call-to-Action',
                  type: 'cta',
                  icon: '📞',
                  description: 'Agendamento de próximo passo',
                  defaultContent: `Perfeito, [lead]! Pelo que conversamos, vejo que há uma janela crítica para vocês.

Gostaria de agendar uma reunião de 30 minutos com nosso Arquiteto de Soluções para:

1. Fazer um diagnóstico inicial do seu ambiente
2. Apresentar um plano de implementação customizado
3. Discutir timeline e investimento

Você teria disponibilidade segunda ou terça-feira que vem? Qual horário funciona melhor para você?`
                }
              ]
            }
          ]
        },
        {
          id: 'need-payoff-1-negativa',
          title: '❌ Não Vê Valor Imediato',
          type: 'response-negative',
          icon: '❌',
          description: 'Cliente não vê valor imediato',
          defaultContent: 'Não sei se teríamos orçamento para isso agora',
          children: [
            {
              id: 'objecao-orcamento',
              title: 'Tratamento: Sem Orçamento',
              type: 'objections',
              icon: '⚠️',
              description: 'Contornar objeção de orçamento',
              defaultContent: `Entendo perfeitamente, [lead]. Muitas empresas começam sem um orçamento definido.

O que costumo fazer é agendar uma conversa para mostrarmos o ROI que podemos gerar. Muitas vezes, o investimento se paga em meses com a economia de tempo e recursos.

Que tal agendarmos uma conversa rápida só para avaliarmos o potencial? Sem compromisso.`
            }
          ]
        }
      ]
    }
  ]
};
