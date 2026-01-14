import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useLeadStore } from '@/store/leadStore';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AnalysisPanelProps {
  view: 'full' | 'script';
}

export default function AnalysisPanel({ view }: AnalysisPanelProps) {
  const { analysis, leadInfo, error } = useLeadStore();
  const [copied, setCopied] = useState(false);

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Preencha os dados do lead e gere a análise.</p>
      </div>
    );
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (view === 'script') {
    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Texto de Abordagem</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(analysis.textoAbordagem)}
            >
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed">
            {analysis.textoAbordagem}
          </div>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Resumo Executivo */}
        <Section title="📋 Resumo Executivo">
          <ul className="space-y-2">
            {analysis.resumoExecutivo.bullets.map((b, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-primary">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Evidências */}
        <Section title="🔍 Evidências e Sinais">
          <ul className="space-y-2">
            {analysis.evidenciasSinais.items.map((e, i) => (
              <li key={i} className="text-sm border-l-2 border-secondary pl-3">
                <p className="font-medium">{e.sinal}</p>
                <p className="text-muted-foreground">{e.indicacao}</p>
                {e.fonte && <p className="text-xs text-primary">{e.fonte}</p>}
              </li>
            ))}
          </ul>
        </Section>

        {/* Dores */}
        <Section title="⚠️ Dores Prováveis">
          <ul className="grid grid-cols-1 gap-1">
            {analysis.doresProvaveis.map((d, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-orange-500">{i + 1}.</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Soluções */}
        <Section title="🛠️ Como a Meta Pode Ajudar">
          <ul className="space-y-2">
            {analysis.solucoesMeta.map((s, i) => (
              <li key={i} className="text-sm bg-green-50 rounded p-2">
                <p className="font-medium text-green-700">{s.solucao}</p>
                <p className="text-muted-foreground">→ {s.dorAlinhada}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Discovery */}
        <Section title="❓ Perguntas de Discovery">
          <div className="space-y-4">
            <div>
              <h5 className="text-xs font-semibold text-sky-600 mb-2">Fase/Projetos/Prioridades</h5>
              <ul className="space-y-1">
                {analysis.perguntasDiscovery.faseProjetosPrioridades.map((p, i) => (
                  <li key={i} className="text-sm">• {p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-sky-600 mb-2">Operação/Integrações</h5>
              <ul className="space-y-1">
                {analysis.perguntasDiscovery.operacaoIntegracoes.map((p, i) => (
                  <li key={i} className="text-sm">• {p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-sky-600 mb-2">Qualificação</h5>
              <ul className="space-y-1">
                {analysis.perguntasDiscovery.qualificacao.map((p, i) => (
                  <li key={i} className="text-sm">• {p}</li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      </div>
    </ScrollArea>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section-card p-4">
      <h4 className="section-header text-sm mb-3">{title}</h4>
      {children}
    </div>
  );
}
