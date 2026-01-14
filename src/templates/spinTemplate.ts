import type { TemplateDefinition } from '../types/methodology.types';

export const spinTemplate: TemplateDefinition = {
  id: 'spin-selling',
  name: 'SPIN Selling',
  description: 'Metodologia de descoberta profunda (Situation, Problem, Implication, Need-Payoff)',
  phases: [
    {
      id: 'abertura',
      title: 'Abertura',
      type: 'opening',
      icon: '🎤',
      description: 'Quebra-gelo inicial e apresentação',
      defaultContent: `Oi [nome do lead]! Tudo bem?

Meu nome é [Seu Nome], faço parte do time da Meta IT.

Acredito ter pego você desprevenido nesse começo de segunda, mas preciso apenas de 20 segundos para explicar o motivo da minha ligação e, caso faça sentido para você, a gente continua conversando. O que você acha?`
    },
    {
      id: 'gancho',
      title: 'Gancho de Conexão',
      type: 'hook',
      icon: '🎯',
      description: 'Contextualização e criação de relevância',
      defaultContent: `De forma bem objetiva, [lead]: trabalhamos com todo o ciclo SAP — desde AMS, adequações para a Reforma Tributária, migração e upgrade para S/4HANA, até rollouts, melhorias e evolução contínua do ambiente.

Além disso, temos uma operação robusta de outsourcing de especialistas SAP, com consultores funcionais e técnicos, arquitetos e líderes para reforçar squads internos e acelerar projetos críticos.

Tenho conversado com vários Gerentes de Tecnologia e um ponto comum é [dor/tendência do setor]. Imagino que seja um desafio para vocês também, me corrija se estiver errado.`
    },
    {
      id: 'situation',
      title: 'Situation (S)',
      type: 'discovery',
      method: 'SPIN',
      icon: '🔍',
      description: 'Perguntas de situação - entender contexto atual',
      defaultContent: `1. Qual é a stack tecnológica que vocês usam atualmente?

2. Vocês já iniciaram algum projeto de modernização ou migração para S/4HANA?

3. Como é o processo atual de integração entre seus sistemas?

4. Qual é o tamanho da equipe de TI que trabalha com SAP?`
    },
    {
      id: 'problem',
      title: 'Problem (P)',
      type: 'discovery',
      method: 'SPIN',
      icon: '🔍',
      description: 'Perguntas de problema - identificar dores',
      defaultContent: `1. Quais são os maiores desafios que vocês enfrentam com a integração de sistemas?

2. Como vocês lidam com a falta de agilidade na entrega de novas funcionalidades?

3. Vocês têm problemas com downtime ou indisponibilidade de sistemas?

4. Qual é o maior gargalo no seu processo de desenvolvimento atualmente?`
    },
    {
      id: 'implication',
      title: 'Implication (I)',
      type: 'discovery',
      method: 'SPIN',
      icon: '🔍',
      description: 'Perguntas de implicação - explorar consequências',
      defaultContent: `1. Se essa falta de agilidade continuar, qual seria o impacto no lançamento de novos produtos e na competitividade da empresa?

2. Quanto tempo e recurso da sua equipe é desperdiçado com integrações manuais ou processos repetitivos?

3. Se houvesse um downtime não planejado, qual seria o impacto financeiro para a empresa?

4. Como a falta de dados integrados afeta a tomada de decisão dos executivos?`
    },
    {
      id: 'need-payoff',
      title: 'Need-Payoff (N)',
      type: 'discovery',
      method: 'SPIN',
      icon: '🔍',
      description: 'Perguntas de necessidade - demonstrar valor',
      defaultContent: `1. Seria valioso ter uma plataforma que automatizasse essas integrações e reduzisse o tempo de deployment?

2. Se vocês conseguissem reduzir o tempo de entrega em 40%, qual seria o impacto para o negócio?

3. Como seria importante ter uma equipe de especialistas que pudesse acelerar seus projetos estratégicos?

4. Qual seria o valor de ter um sistema robusto que garantisse 99.9% de uptime?`
    },
    {
      id: 'apresentacao',
      title: 'Apresentação',
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
   → Temos 120+ projetos em empresas como [exemplos do mesmo setor]`
    },
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
    },
    {
      id: 'objecoes',
      title: 'Tratamento de Objeções',
      type: 'objections',
      icon: '⚠️',
      description: 'Respostas para objeções comuns',
      defaultContent: `OBJEÇÃO 1: "Não tenho agenda agora"
→ Compreendo totalmente. Qual seria um momento mais calmo? Segunda ou terça-feira que vem?

OBJEÇÃO 2: "Não vejo necessidade no momento"
→ Vale a pena! Mesmo que não seja o momento, conhecer as melhores práticas do mercado é sempre valioso.

OBJEÇÃO 3: "Me envie um e-mail primeiro"
→ Claro! Vou enviar material. Mas seria importante uma breve conversa de 30 min para contextualizarmos melhor.

OBJEÇÃO 4: "Não temos orçamento"
→ Entendo. Posso te enviar casos para avaliar quando tiver orçamento disponível.

OBJEÇÃO 5: "Já temos parceiros"
→ Perfeito! Nossa proposta não é substituir, mas complementar com Smart Squads para projetos pontuais.

OBJEÇÃO 6: "Preciso conversar com meu chefe"
→ Ótimo! Posso participar dessa conversa? Seria importante ele entender também o potencial.`
    }
  ]
};
