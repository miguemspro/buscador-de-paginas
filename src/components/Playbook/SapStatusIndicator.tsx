import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Server,
  Sparkles,
} from 'lucide-react';
import type { SapStatusDetection } from '@/types/playbook.types';

interface SapStatusIndicatorProps {
  detection: SapStatusDetection;
  className?: string;
}

export function SapStatusIndicator({ detection, className }: SapStatusIndicatorProps) {
  const {
    detectedStatus,
    s4hanaProbability,
    confidence,
    matchedPatterns,
    primaryEvidence,
  } = detection;

  // Cores e labels baseados no status
  const statusConfig = {
    s4hana_live: {
      label: 'S/4HANA em Produção',
      shortLabel: 'S/4HANA Live',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      borderColor: 'border-green-200 dark:border-green-800',
      progressColor: 'bg-green-500',
      icon: CheckCircle2,
      emoji: '✅',
      description: 'Cliente já migrou para S/4HANA',
      solutionType: 'Otimização e AMS',
    },
    s4hana_in_progress: {
      label: 'Migração em Andamento',
      shortLabel: 'Migrando',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-blue-200 dark:border-blue-800',
      progressColor: 'bg-blue-500',
      icon: TrendingUp,
      emoji: '🔄',
      description: 'Cliente está migrando para S/4HANA',
      solutionType: 'Suporte à Migração',
    },
    ecc: {
      label: 'SAP ECC',
      shortLabel: 'ECC',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      borderColor: 'border-orange-200 dark:border-orange-800',
      progressColor: 'bg-orange-500',
      icon: Server,
      emoji: '⚠️',
      description: 'Cliente ainda está em SAP ECC',
      solutionType: 'Migração S/4HANA',
    },
    no_sap: {
      label: 'Sem SAP',
      shortLabel: 'Sem SAP',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-950/30',
      borderColor: 'border-gray-200 dark:border-gray-800',
      progressColor: 'bg-gray-400',
      icon: HelpCircle,
      emoji: '❓',
      description: 'Cliente não utiliza SAP',
      solutionType: 'Nova Implementação',
    },
    unknown: {
      label: 'Status Indefinido',
      shortLabel: 'Indefinido',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-800',
      progressColor: 'bg-amber-400',
      icon: AlertTriangle,
      emoji: '🔍',
      description: 'Não foi possível determinar o status SAP',
      solutionType: 'Diagnóstico Necessário',
    },
  };

  const config = statusConfig[detectedStatus];
  const Icon = config.icon;

  // Cor da barra de confiança
  const confidenceColor = {
    alta: 'bg-green-500',
    media: 'bg-amber-500',
    baixa: 'bg-red-400',
  };

  return (
    <Card className={cn('p-4 border-2', config.borderColor, config.bgColor, className)}>
      {/* Header com Status Principal */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-5 w-5', config.color)} />
          <h3 className={cn('font-bold text-lg', config.color)}>
            {config.emoji} {config.shortLabel}
          </h3>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-xs',
            confidence === 'alta' && 'bg-green-100 text-green-700 border-green-300',
            confidence === 'media' && 'bg-amber-100 text-amber-700 border-amber-300',
            confidence === 'baixa' && 'bg-red-100 text-red-700 border-red-300'
          )}
        >
          Confiança: {confidence}
        </Badge>
      </div>

      {/* Barra de Probabilidade S/4HANA */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Probabilidade S/4HANA</span>
          <span className={cn('font-bold', config.color)}>{s4hanaProbability}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', config.progressColor)}
            style={{ width: `${s4hanaProbability}%` }}
          />
        </div>
      </div>

      {/* Descrição e Tipo de Solução */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{config.description}</p>

        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            Soluções recomendadas: <span className="text-primary">{config.solutionType}</span>
          </span>
        </div>
      </div>

      {/* Evidência Principal (se houver) */}
      {primaryEvidence && (
        <div className="mt-3 pt-3 border-t border-dashed">
          <p className="text-xs text-muted-foreground mb-1">Evidência principal:</p>
          <p className="text-xs italic line-clamp-2">"{primaryEvidence}"</p>
        </div>
      )}

      {/* Padrões Detectados (expandível) */}
      {matchedPatterns && matchedPatterns.length > 0 && (
        <details className="mt-3 pt-3 border-t">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            {matchedPatterns.length} padrões detectados
          </summary>
          <div className="mt-2 flex flex-wrap gap-1">
            {matchedPatterns.slice(0, 5).map((pattern, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {pattern}
              </Badge>
            ))}
            {matchedPatterns.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{matchedPatterns.length - 5} mais
              </Badge>
            )}
          </div>
        </details>
      )}
    </Card>
  );
}
