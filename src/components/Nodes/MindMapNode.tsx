import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Edit2, Copy, Trash2, Sparkles, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { nanoid } from 'nanoid';
import type { MindMapNodeData } from '../../types/node.types';
import { useCanvasStore } from '../../store/canvasStore';

const nodeColors: Record<string, string> = {
  opening: 'bg-blue-500',
  hook: 'bg-purple-500',
  discovery: 'bg-green-500',
  qualification: 'bg-orange-500',
  presentation: 'bg-pink-500',
  cta: 'bg-red-500',
  objections: 'bg-gray-500',
  'response-positive': 'bg-emerald-500',
  'response-neutral': 'bg-yellow-500',
  'response-negative': 'bg-rose-500',
  'followup': 'bg-cyan-500',
};

const MindMapNode = ({ id, data }: { id: string; data: MindMapNodeData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(data.title);
  const [editedContent, setEditedContent] = useState(data.content);

  const { updateNode, deleteNode, duplicateNode, setSelectedNodeId, addChildNode, toggleCollapse, getChildren } = useCanvasStore();

  const children = getChildren(id);
  const hasChildren = children.length > 0;

  const handleSave = () => {
    updateNode(id, { title: editedTitle, content: editedContent });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(data.title);
    setEditedContent(data.content);
    setIsEditing(false);
  };

  const handleRequestAI = () => {
    setSelectedNodeId(id);
  };

  const handleAddChild = () => {
    const childNode = {
      id: nanoid(),
      type: 'mindMapNode',
      position: { x: 0, y: 0 },
      data: {
        id: nanoid(),
        type: data.type,
        methodology: data.methodology,
        title: `${data.title} - Sub-nó`,
        content: '',
        phase: data.phase,
        icon: data.icon,
        parentId: id,
        children: [],
        isCollapsed: false,
        level: (data.level || 0) + 1,
      },
    };

    addChildNode(id, childNode);
  };

  const handleToggleCollapse = () => {
    toggleCollapse(id);
  };

  const colorClass = nodeColors[data.type] || 'bg-gray-500';

  return (
    <div className="min-w-[300px] max-w-[400px] bg-white rounded-lg shadow-lg border-2 border-gray-200 hover:shadow-xl transition-shadow">
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />

      {/* Header */}
      <div className={`${colorClass} text-white p-3 rounded-t-lg flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {hasChildren && (
            <button
              onClick={handleToggleCollapse}
              className="hover:bg-white/20 p-1 rounded transition-colors"
              title={data.isCollapsed ? 'Expandir' : 'Colapsar'}
            >
              {data.isCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
          )}

          {data.icon && <span className="text-xl">{data.icon}</span>}
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="bg-white/20 text-white px-2 py-1 rounded text-sm font-semibold outline-none"
              autoFocus
            />
          ) : (
            <h3 className="font-semibold text-sm">{data.title}</h3>
          )}

          {hasChildren && (
            <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full">
              {children.length}
            </span>
          )}
        </div>

        {data.methodology && (
          <span className="text-xs bg-white/20 px-2 py-1 rounded">
            {data.methodology}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-40 p-2 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite o conteúdo..."
          />
        ) : (
          <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
            {data.content || <span className="text-gray-400 italic">Sem conteúdo</span>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-gray-200 flex gap-2">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-xs hover:bg-blue-600 transition-colors"
            >
              Salvar
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded text-xs hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleAddChild}
              className="flex items-center gap-1 px-3 py-2 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors font-medium"
              title="Adicionar Sub-nó"
            >
              <Plus size={14} />
              Filho
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-2 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              title="Editar"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={handleRequestAI}
              className="flex items-center gap-1 px-2 py-2 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors"
              title="Sugestão IA"
            >
              <Sparkles size={14} />
            </button>
            <button
              onClick={() => duplicateNode(id)}
              className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              title="Duplicar"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={() => deleteNode(id)}
              className="p-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
              title="Deletar"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
};

export default memo(MindMapNode);
