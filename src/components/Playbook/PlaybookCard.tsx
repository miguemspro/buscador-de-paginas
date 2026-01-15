import { useState } from 'react';
import { Copy, Check, ChevronRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PlaybookCardProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  icon: string;
  content: string | string[];
  tips?: string[];
  isActive: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  className?: string;
}

export default function PlaybookCard({
  step,
  totalSteps,
  title,
  subtitle,
  icon,
  content,
  tips,
  isActive,
  onNext,
  onPrevious,
  className,
}: PlaybookCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textContent = Array.isArray(content) ? content.join('\n\n') : content;
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    toast.success('Copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-500",
        isActive ? "scale-100 opacity-100 shadow-2xl" : "scale-95 opacity-50",
        className
      )}
    >
      {/* Progress indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-3xl">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Passo {step}/{totalSteps}
              </span>
            </div>
            <h3 className="text-xl font-bold mt-1">{title}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copiar
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {Array.isArray(content) ? (
          <div className="space-y-3">
            {content.map((item, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-muted/30 border">
            <p className="text-base leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
        )}

        {/* Tips */}
        {tips && tips.length > 0 && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
              <Lightbulb className="h-4 w-4" />
              <span className="text-sm font-semibold">Dicas</span>
            </div>
            <ul className="space-y-1">
              {tips.map((tip, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span>•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-4 border-t bg-muted/30">
        <Button
          variant="ghost"
          onClick={onPrevious}
          disabled={step === 1}
          className="gap-2"
        >
          Anterior
        </Button>
        
        {step < totalSteps ? (
          <Button onClick={onNext} className="gap-2">
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" onClick={() => window.location.reload()}>
            Novo Lead
          </Button>
        )}
      </div>
    </Card>
  );
}
