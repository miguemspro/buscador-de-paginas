import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import { useCanvasStore } from '../../store/canvasStore';
import MindMapNode from '../Nodes/MindMapNode';

const nodeTypes = {
  mindMapNode: MindMapNode,
};

const ProspectCanvas = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useCanvasStore();
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 50);
    }
  }, [nodes.length, fitView]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: any) => {
    useCanvasStore.getState().setSelectedNodeId(node.id);
  }, []);

  return (
    <div className="w-full h-full bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
        <Controls />
        <MiniMap
          nodeColor={(node: any) => {
            const colors: Record<string, string> = {
              opening: '#3B82F6',
              hook: '#8B5CF6',
              discovery: '#10B981',
              qualification: '#F59E0B',
              presentation: '#EC4899',
              cta: '#EF4444',
              objections: '#6B7280',
            };
            return colors[node.data?.type] || '#6B7280';
          }}
          className="!bg-white !border-2 !border-gray-300"
        />
      </ReactFlow>
    </div>
  );
};

export default ProspectCanvas;
