import type { AnalysisSection } from '../types/lead.types';

export const leadAnalysisTemplate: Omit<AnalysisSection, 'content'>[] = [
  {
    id: 'resumo',
    title: 'Resumo Executivo',
    icon: '📋',
    type: 'summary',
  },
  {
    id: 'evidencias',
    title: 'Evidências e Sinais Públicos',
    icon: '🔍',
    type: 'evidence',
  },
  {
    id: 'dores',
    title: 'Dores Prováveis',
    icon: '⚠️',
    type: 'pains',
  },
  {
    id: 'solucoes',
    title: 'Como a Meta Pode Ajudar',
    icon: '🛠️',
    type: 'solutions',
  },
  {
    id: 'discovery',
    title: 'Perguntas de Discovery',
    icon: '❓',
    type: 'questions',
  },
  {
    id: 'abordagem',
    title: 'Texto de Abordagem',
    icon: '📞',
    type: 'script',
  },
];

export const getNodePositions = (sections: typeof leadAnalysisTemplate) => {
  const startX = 100;
  const startY = 100;
  const nodeWidth = 320;
  const nodeHeight = 200;
  const gapX = 80;
  const gapY = 60;
  const nodesPerRow = 3;

  return sections.map((section, index) => {
    const row = Math.floor(index / nodesPerRow);
    const col = index % nodesPerRow;
    
    return {
      id: section.id,
      type: 'analysisNode',
      position: {
        x: startX + col * (nodeWidth + gapX),
        y: startY + row * (nodeHeight + gapY),
      },
      data: {
        ...section,
        content: null,
      },
    };
  });
};

export const getNodeEdges = () => {
  return [
    { id: 'e-resumo-evidencias', source: 'resumo', target: 'evidencias', animated: true },
    { id: 'e-evidencias-dores', source: 'evidencias', target: 'dores', animated: true },
    { id: 'e-resumo-dores', source: 'resumo', target: 'dores', animated: true },
    { id: 'e-dores-solucoes', source: 'dores', target: 'solucoes', animated: true },
    { id: 'e-solucoes-discovery', source: 'solucoes', target: 'discovery', animated: true },
    { id: 'e-discovery-abordagem', source: 'discovery', target: 'abordagem', animated: true },
    { id: 'e-evidencias-abordagem', source: 'evidencias', target: 'abordagem', animated: true },
  ];
};
