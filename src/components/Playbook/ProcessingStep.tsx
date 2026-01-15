import { Loader2, ScanSearch, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePlaybookStore } from '@/store/playbookStore';
import { cn } from '@/lib/utils';

export default function ProcessingStep() {
  const { currentStep, imagePreview, extractedData, loadingMessage } = usePlaybookStore();

  const steps = [
    { 
      id: 'extracting', 
      label: 'Extraindo dados do print', 
      icon: ScanSearch,
      description: 'IA analisando imagem...'
    },
    { 
      id: 'context', 
      label: 'Dados identificados', 
      icon: CheckCircle2,
      description: 'Contexto do lead confirmado'
    },
    { 
      id: 'generating', 
      label: 'Gerando playbook', 
      icon: Sparkles,
      description: 'Criando script personalizado...'
    },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-2xl w-full">
        <div className="grid grid-cols-2 gap-8">
          {/* Image Preview */}
          <div className="relative rounded-xl overflow-hidden border-2 border-muted">
            {imagePreview && (
              <img 
                src={imagePreview} 
                alt="Print Salesforce" 
                className={cn(
                  "w-full h-auto transition-all duration-500",
                  currentStep !== 'context' && "opacity-60"
                )}
              />
            )}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-t from-background/90 to-transparent",
              "flex items-end p-4"
            )}>
              {currentStep === 'context' && extractedData && (
                <div className="space-y-1 animate-in fade-in slide-in-from-bottom-4">
                  <p className="font-bold text-lg">{extractedData.name || 'Lead'}</p>
                  <p className="text-sm text-muted-foreground">
                    {extractedData.role} • {extractedData.company}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex flex-col justify-center space-y-6">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isComplete = index < currentIndex;
              const Icon = step.icon;

              return (
                <div 
                  key={step.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl transition-all duration-300",
                    isActive && "bg-primary/10 scale-105",
                    isComplete && "opacity-60"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full",
                    isActive && "bg-primary text-primary-foreground animate-pulse",
                    isComplete && "bg-green-500/20 text-green-600",
                    !isActive && !isComplete && "bg-muted text-muted-foreground"
                  )}>
                    {isActive ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : isComplete ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className={cn(
                      "font-semibold",
                      isActive && "text-primary"
                    )}>
                      {step.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isActive ? loadingMessage || step.description : step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
