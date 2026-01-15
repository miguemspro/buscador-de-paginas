import { useState } from 'react';
import { usePlaybookStore } from '@/store/playbookStore';
import PlaybookCard from './PlaybookCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  RotateCcw, 
  User, 
  Building2, 
  Briefcase,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PlaybookView() {
  const { playbook, extractedData, reset } = usePlaybookStore();
  const [activeStep, setActiveStep] = useState(1);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!playbook) return null;

  const cards = [
    {
      step: 1,
      title: 'Abertura',
      subtitle: 'Primeiros 20 segundos',
      icon: '👋',
      content: playbook.callScript.opener,
      tips: [
        'Fale devagar e com confiança',
        'Pause após pedir os 20 segundos',
        'Se disser não, agradeça e desligue'
      ]
    },
    {
      step: 2,
      title: 'Ponte de Contexto',
      subtitle: 'Mostre que você pesquisou',
      icon: '🔍',
      content: playbook.callScript.contextBridge,
      tips: [
        'Use tom consultivo, não de vendas',
        'Cite fatos específicos que você viu'
      ]
    },
    {
      step: 3,
      title: 'Gancho de Valor',
      subtitle: 'Por que você está ligando',
      icon: '🎯',
      content: playbook.callScript.valueHook,
      tips: [
        'Conecte o gancho às dores prováveis',
        'Deixe claro que quer entender, não vender'
      ]
    },
    {
      step: 4,
      title: 'Perguntas de Discovery',
      subtitle: 'Descubra a dor real',
      icon: '❓',
      content: playbook.callScript.discoveryQuestions,
      tips: [
        'Faça uma pergunta por vez',
        'Ouça mais do que fala',
        'Anote as respostas'
      ]
    },
    {
      step: 5,
      title: 'Objeções Comuns',
      subtitle: 'Respostas prontas',
      icon: '🛡️',
      content: playbook.callScript.objectionHandlers.map(
        h => `"${h.objection}" → ${h.response}`
      ),
      tips: [
        'Não discuta, acolha a objeção',
        'Use "Faz sentido" antes de responder'
      ]
    },
    {
      step: 6,
      title: 'Fechamento',
      subtitle: 'Próximo passo',
      icon: '📅',
      content: playbook.callScript.closeAttempt,
      tips: [
        'Ofereça um próximo passo concreto',
        'Confirme data/hora antes de desligar'
      ]
    },
  ];

  const handleCopyAll = () => {
    const fullScript = `ABERTURA:\n${playbook.callScript.opener}\n\nCONTEXTO:\n${playbook.callScript.contextBridge}\n\nGANCHO:\n${playbook.callScript.valueHook}\n\nPERGUNTAS:\n${playbook.callScript.discoveryQuestions.join('\n')}\n\nOBJEÇÕES:\n${playbook.callScript.objectionHandlers.map(h => `"${h.objection}" → ${h.response}`).join('\n')}\n\nFECHAMENTO:\n${playbook.callScript.closeAttempt}`;
    navigator.clipboard.writeText(fullScript);
    setCopiedAll(true);
    toast.success('Script completo copiado!');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">SDR ProspectFlow</h1>
            <Badge variant="secondary" className="hidden sm:flex">
              Playbook Gerado ✓
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-2">
              {copiedAll ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedAll ? 'Copiado!' : 'Copiar Tudo'}
            </Button>
            <Button variant="ghost" size="sm" onClick={reset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Novo Lead
            </Button>
          </div>
        </div>
      </header>

      <div className="container px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Lead Context */}
          <div className="lg:col-span-1 space-y-4">
            {/* Lead Summary Card */}
            <Card className="p-6 sticky top-24">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Lead
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">{extractedData?.name || 'Lead'}</p>
                  <p className="text-muted-foreground">{extractedData?.role}</p>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{extractedData?.company}</span>
                </div>
                
                {extractedData?.industry && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{extractedData.industry}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                  Insights Chave
                </h4>
                <div className="space-y-2">
                  {playbook.keyInsights.slice(0, 4).map((insight, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Reference - Pains */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                  Dores Prováveis
                </h4>
                <div className="space-y-2">
                  {playbook.probablePains.slice(0, 5).map((pain, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <span>{pain}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content - Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {cards.map((card) => (
                <button
                  key={card.step}
                  onClick={() => setActiveStep(card.step)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all",
                    activeStep === card.step
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <span>{card.icon}</span>
                  <span className="text-sm font-medium">{card.title}</span>
                </button>
              ))}
            </div>

            {/* Active Card */}
            <div className="relative">
              {cards.map((card) => (
                <div
                  key={card.step}
                  className={cn(
                    "transition-all duration-300",
                    activeStep === card.step 
                      ? "opacity-100 visible" 
                      : "opacity-0 invisible absolute inset-0"
                  )}
                >
                  <PlaybookCard
                    step={card.step}
                    totalSteps={cards.length}
                    title={card.title}
                    subtitle={card.subtitle}
                    icon={card.icon}
                    content={card.content}
                    tips={card.tips}
                    isActive={activeStep === card.step}
                    onNext={() => setActiveStep(Math.min(card.step + 1, cards.length))}
                    onPrevious={() => setActiveStep(Math.max(card.step - 1, 1))}
                  />
                </div>
              ))}
            </div>

            {/* Keyboard hint */}
            <p className="text-center text-sm text-muted-foreground">
              Use os botões ou clique nas etapas acima para navegar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
