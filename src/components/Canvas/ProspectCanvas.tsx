import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import { useLeadStore } from '@/store/leadStore';
import AnalysisNode from '../Nodes/AnalysisNode';
import { leadAnalysisTemplate, getNodePositions, getNodeEdges } from '@/templates/leadAnalysisTemplate';

const nodeTypes = {
  analysisNode: AnalysisNode,
};

const ProspectCanvas = () => {
  const { fitView } = useReactFlow();
  const { analysis, selectedSectionId, setSelectedSectionId } = useLeadStore();

  const nodes = useMemo(() => {
    return getNodePositions(leadAnalysisTemplate).map((node) => ({
      ...node,
      selected: node.id === selectedSectionId,
    }));
  }, [selectedSectionId]);

  const edges = useMemo(() => getNodeEdges(), []);

  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 100);
    }
  }, [nodes.length, fitView]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: any) => {
    setSelectedSectionId(node.id);
  }, [setSelectedSectionId]);

  return (
    <div className="w-full h-full bg-muted/30">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--muted-foreground) / 0.2)" />
        <Controls className="!bg-card !border-border" />
        <MiniMap
          nodeColor={() => 'hsl(var(--primary))'}
          className="!bg-card !border-border"
        />
      </ReactFlow>
    </div>
  );
};

export default ProspectCanvas;
