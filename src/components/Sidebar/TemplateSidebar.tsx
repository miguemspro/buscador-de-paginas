import { useState } from 'react';
import { FileText, User, Building2, Briefcase } from 'lucide-react';
import { spinTemplate } from '../../templates/spinTemplate';
import { spinTemplateHierarchical } from '../../templates/spinTemplateHierarchical';
import { useCanvasStore } from '../../store/canvasStore';
import { useConversationStore } from '../../store/conversationStore';
import { nanoid } from 'nanoid';
import type { PhaseDefinition } from '../../types/methodology.types';

function replacePlaceholders(text: string, prospectInfo: any): string {
  if (!text) return '';

  let result = text;

  if (prospectInfo.name) {
    result = result.replace(/\[nome do lead\]/gi, prospectInfo.name);
    result = result.replace(/\[lead\]/g, prospectInfo.name);
    result = result.replace(/\[Seu Nome\]/g, prospectInfo.name);
  }

  if (prospectInfo.company) {
    result = result.replace(/\[empresa\]/gi, prospectInfo.company);
  }

  if (prospectInfo.role) {
    result = result.replace(/\[cargo\]/gi, prospectInfo.role);
  }

  if (prospectInfo.industry) {
    result = result.replace(/\[setor\]/gi, prospectInfo.industry);
    result = result.replace(/\[indústria\]/gi, prospectInfo.industry);
    result = result.replace(/\[dor\/tendência do setor\]/gi, `desafios comuns no setor de ${prospectInfo.industry}`);
    result = result.replace(/\[exemplos do mesmo setor\]/gi, `empresas do setor de ${prospectInfo.industry}`);
  }

  return result;
}

interface FlattenResult {
  nodes: any[];
  edges: any[];
}

function flattenPhases(
  phases: PhaseDefinition[],
  prospectInfo: any,
  parentId: string | null = null,
  startX: number = 400,
  startY: number = 100,
  level: number = 0
): FlattenResult {
  const nodes: any[] = [];
  const edges: any[] = [];

  phases.forEach((phase, phaseIndex) => {
    const nodeId = nanoid();
    const yPosition = startY + (phaseIndex * 300);

    const node = {
      id: nodeId,
      type: 'mindMapNode',
      position: { x: startX, y: yPosition },
      data: {
        id: phase.id,
        type: phase.type,
        methodology: phase.method,
        title: replacePlaceholders(phase.title, prospectInfo),
        content: replacePlaceholders(phase.defaultContent || '', prospectInfo),
        phase: phase.id,
        icon: phase.icon,
        parentId: parentId,
        children: [],
        isCollapsed: false,
        level: level,
      },
    };

    nodes.push(node);

    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        type: 'smoothstep',
        animated: true,
      });
    }

    if (phase.children && phase.children.length > 0) {
      const childResult = flattenPhases(
        phase.children,
        prospectInfo,
        nodeId,
        startX + 500,
        yPosition - ((phase.children.length - 1) * 150),
        level + 1
      );

      node.data.children = childResult.nodes.map(n => n.id);

      nodes.push(...childResult.nodes);
      edges.push(...childResult.edges);
    }
  });

  return { nodes, edges };
}

const TemplateSidebar = () => {
  const { setNodes, setEdges, clearCanvas } = useCanvasStore();
  const { prospectInfo, updateProspectInfo, setTemplateId } = useConversationStore();

  const [prospectName, setProspectName] = useState(prospectInfo.name || '');
  const [prospectCompany, setProspectCompany] = useState(prospectInfo.company || '');
  const [prospectRole, setProspectRole] = useState(prospectInfo.role || '');
  const [prospectIndustry, setProspectIndustry] = useState(prospectInfo.industry || '');

  const handleLoadTemplate = () => {
    clearCanvas();
    setTemplateId(spinTemplate.id);

    const prospectData = {
      name: prospectName,
      company: prospectCompany,
      role: prospectRole,
      industry: prospectIndustry,
    };

    updateProspectInfo(prospectData);

    const nodes = spinTemplate.phases.map((phase, index) => {
      const yPosition = index * 250;

      return {
        id: nanoid(),
        type: 'mindMapNode',
        position: { x: 400, y: yPosition },
        data: {
          id: phase.id,
          type: phase.type,
          methodology: phase.method,
          title: replacePlaceholders(phase.title, prospectData),
          content: replacePlaceholders(phase.defaultContent || '', prospectData),
          phase: phase.id,
          icon: phase.icon,
          parentId: null,
          children: [],
          isCollapsed: false,
          level: 0,
        },
      };
    });

    const edges = nodes.slice(0, -1).map((node, index) => ({
      id: `edge-${index}`,
      source: node.id,
      target: nodes[index + 1].id,
      type: 'smoothstep',
      animated: true,
    }));

    console.log('📍 Carregando template com', nodes.length, 'nós');

    setNodes(nodes);
    setEdges(edges);
  };

  const handleLoadHierarchicalTemplate = () => {
    clearCanvas();
    setTemplateId(spinTemplateHierarchical.id);

    const prospectData = {
      name: prospectName,
      company: prospectCompany,
      role: prospectRole,
      industry: prospectIndustry,
    };

    updateProspectInfo(prospectData);

    const result = flattenPhases(spinTemplateHierarchical.phases, prospectData);

    console.log('📍 Carregando template hierárquico com', result.nodes.length, 'nós');

    setNodes(result.nodes);
    setEdges(result.edges);
  };

  return (
    <div className="w-80 bg-gradient-to-br from-white to-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FileText size={24} className="text-blue-500" />
        Templates
      </h2>

      {/* Informações do Prospect */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          📋 Informações do Prospect
        </h3>

        <div className="space-y-3">
          <div>
            <label className="flex items-center gap-2 text-xs text-gray-600 mb-1">
              <User size={14} />
              Nome
            </label>
            <input
              type="text"
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs text-gray-600 mb-1">
              <Building2 size={14} />
              Empresa
            </label>
            <input
              type="text"
              value={prospectCompany}
              onChange={(e) => setProspectCompany(e.target.value)}
              placeholder="Ex: Banco XYZ"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs text-gray-600 mb-1">
              <Briefcase size={14} />
              Cargo
            </label>
            <input
              type="text"
              value={prospectRole}
              onChange={(e) => setProspectRole(e.target.value)}
              placeholder="Ex: Gerente de TI"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs text-gray-600 mb-1">
              <Building2 size={14} />
              Setor/Indústria
            </label>
            <input
              type="text"
              value={prospectIndustry}
              onChange={(e) => setProspectIndustry(e.target.value)}
              placeholder="Ex: Serviços Financeiros"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Templates SPIN Selling */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Metodologia</h3>

        {/* Template Linear */}
        <div className="border-2 border-blue-500 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg hover:shadow-xl transition-shadow mb-3">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-blue-900">SPIN Selling (Linear)</h4>
              <p className="text-xs text-blue-700 mt-1">
                Fluxo sequencial simples - 8 fases
              </p>
            </div>
          </div>

          <div className="mt-3 text-xs text-blue-800">
            <p className="font-medium mb-1">Fases:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Abertura</li>
              <li>Gancho de Conexão</li>
              <li>SPIN (S-P-I-N)</li>
              <li>Apresentação</li>
              <li>Call-to-Action</li>
              <li>Objeções</li>
            </ul>
          </div>

          <button
            onClick={handleLoadTemplate}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-all duration-200 hover:shadow-lg hover:scale-105 w-full mt-4 text-sm shadow-md"
          >
            📝 Carregar Template Linear
          </button>
        </div>

        {/* Template Hierárquico */}
        <div className="border-2 border-emerald-500 rounded-lg p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-emerald-900">SPIN Selling (Hierárquico)</h4>
              <p className="text-xs text-emerald-700 mt-1">
                Com ramificações de respostas e follow-ups
              </p>
            </div>
            <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded">
              Novo!
            </span>
          </div>

          <div className="mt-3 text-xs text-emerald-800">
            <p className="font-medium mb-1">Estrutura:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Perguntas SPIN</li>
              <li>↳ Respostas Positivas/Negativas</li>
              <li>↳↳ Follow-ups personalizados</li>
              <li>Tratamento de objeções</li>
            </ul>
          </div>

          <button
            onClick={handleLoadHierarchicalTemplate}
            className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-600 transition-all duration-200 hover:shadow-lg hover:scale-105 w-full mt-4 text-sm shadow-md"
          >
            🚀 Carregar Template Hierárquico
          </button>
        </div>
      </div>

      {/* Informações */}
      <div className="mt-6 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg text-xs text-gray-700">
        <p className="font-semibold mb-2 flex items-center gap-1">
          💡 Dica:
        </p>
        <p>Preencha as informações do prospect antes de carregar o template para personalização automática.</p>
      </div>
    </div>
  );
};

export default TemplateSidebar;
