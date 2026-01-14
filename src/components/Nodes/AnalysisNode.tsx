import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Copy, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLeadStore } from '@/store/leadStore';
import { cn } from '@/lib/utils';

interface AnalysisNodeData {
  id: string;
  title: string;
  icon: string;
  type: string;
}

const sectionColors: Record<string, string> = {
  summary: 'border-primary bg-primary/5',
  evidence: 'border-secondary bg-secondary/5',
  pains: 'border-orange-500 bg-orange-50',
  solutions: 'border-green-500 bg-green-50',
  questions: 'border-sky-500 bg-sky-50',
  script: 'border-pink-500 bg-pink-50',
};

function AnalysisNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as AnalysisNodeData;
  const { getSectionContent, setSelectedSectionId, analysis } = useLeadStore();
  const content = getSectionContent(nodeData.id);
  
  const hasContent = content !== null && analysis !== null;
  
  const getPreview = () => {
    if (!content) return 'Aguardando análise...';
    if (typeof content === 'string') return content.slice(0, 120) + '...';
    if (Array.isArray(content)) {
      if (typeof content[0] === 'string') return content.slice(0, 2).join(' • ');
      return `${content.length} itens`;
    }
    if (typeof content === 'object' && 'faseProjetosPrioridades' in content) {
      return '12 perguntas de discovery';
    }
    return 'Conteúdo disponível';
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!content) return;
    const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    navigator.clipboard.writeText(text);
  };

  return (
    <div
      className={cn(
        'analysis-node w-[300px] p-4 border-2 cursor-pointer',
        sectionColors[nodeData.type] || 'border-border',
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
      onClick={() => setSelectedSectionId(nodeData.id)}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{nodeData.icon}</span>
          <h3 className="font-semibold text-sm">{nodeData.title}</h3>
        </div>
        {hasContent && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      
      <p className={cn(
        'text-xs leading-relaxed',
        hasContent ? 'text-foreground' : 'text-muted-foreground italic'
      )}>
        {getPreview()}
      </p>
      
      {hasContent && (
        <div className="flex items-center justify-end mt-2 text-xs text-primary">
          <span>Ver detalhes</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  );
}

export default memo(AnalysisNode);
