// ============================================
// FASE 1: Progresso da Pesquisa em Etapas
// ============================================

import { Loader2, CheckCircle2, Building2, User, TrendingUp, Link2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ResearchPhase = 
  | 'extracting'     // OCR
  | 'company'        // Pesquisa empresa
  | 'lead'           // Pesquisa lead
  | 'sector'         // Pesquisa setorial
  | 'validating'     // Validando citações
  | 'generating'     // Gerando playbook
  | 'complete';

interface ResearchStep {
  id: ResearchPhase;
  label: string;
  description: string;
  icon: React.ElementType;
}

const RESEARCH_STEPS: ResearchStep[] = [
  { 
    id: 'extracting', 
    label: 'Extraindo dados', 
    description: 'Lendo informações do Salesforce...',
    icon: Building2
  },
  { 
    id: 'company', 
    label: 'Pesquisando empresa', 
    description: 'Buscando evidências SAP e tecnologia...',
    icon: Building2
  },
  { 
    id: 'lead', 
    label: 'Pesquisando lead', 
    description: 'Analisando perfil público...',
    icon: User
  },
  { 
    id: 'sector', 
    label: 'Pesquisa setorial', 
    description: 'Identificando tendências 2025-2026...',
    icon: TrendingUp
  },
  { 
    id: 'validating', 
    label: 'Validando citações', 
    description: 'Verificando links das evidências...',
    icon: Link2
  },
  { 
    id: 'generating', 
    label: 'Gerando playbook', 
    description: 'Criando seu script personalizado...',
    icon: Sparkles
  }
];

interface ResearchProgressProps {
  currentPhase: ResearchPhase;
  phaseMessage?: string;
  evidencesFound?: number;
  cacheHit?: boolean;
  extractedData?: {
    name?: string;
    company?: string;
    role?: string;
  };
}

export default function ResearchProgress({
  currentPhase,
  phaseMessage,
  evidencesFound = 0,
  cacheHit = false,
  extractedData
}: ResearchProgressProps) {
  const currentIndex = RESEARCH_STEPS.findIndex(s => s.id === currentPhase);
  const progress = currentPhase === 'complete' 
    ? 100 
    : Math.round(((currentIndex + 0.5) / RESEARCH_STEPS.length) * 100);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          {/* Header com contexto */}
          {extractedData?.name && (
            <div className="mb-8 text-center">
              <h2 className="text-xl font-bold">{extractedData.name}</h2>
              <p className="text-muted-foreground">
                {extractedData.role} • {extractedData.company}
              </p>
            </div>
          )}

          {/* Barra de progresso */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progresso da pesquisa</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Lista de etapas */}
          <div className="space-y-4">
            {RESEARCH_STEPS.map((step, index) => {
              const isActive = step.id === currentPhase;
              const isComplete = index < currentIndex;
              const isPending = index > currentIndex;
              const Icon = step.icon;

              return (
                <div 
                  key={step.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl transition-all duration-300",
                    isActive && "bg-primary/10 scale-[1.02]",
                    isComplete && "opacity-70",
                    isPending && "opacity-40"
                  )}
                >
                  {/* Ícone de status */}
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
                    isActive && "bg-primary text-primary-foreground",
                    isComplete && "bg-green-500/20 text-green-600",
                    isPending && "bg-muted text-muted-foreground"
                  )}>
                    {isActive ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isComplete ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  {/* Texto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "font-medium",
                        isActive && "text-primary"
                      )}>
                        {step.label}
                      </p>
                      
                      {/* Badges de status */}
                      {isComplete && step.id === 'company' && evidencesFound > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {evidencesFound} evidências
                        </Badge>
                      )}
                      {isComplete && cacheHit && (step.id === 'company' || step.id === 'sector') && (
                        <Badge variant="outline" className="text-xs">
                          cache
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {isActive ? (phaseMessage || step.description) : step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dica sobre citações */}
          {currentPhase === 'validating' && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
              💡 Garantindo que todas as evidências tenham links verificáveis
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
