import { useState } from 'react';
import { usePlaybookStore } from '@/store/playbookStore';
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
  Check,
  MessageSquare,
  Shield,
  Target,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PlaybookView() {
  const { playbook, extractedData, reset } = usePlaybookStore();
  const [copiedScript, setCopiedScript] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    insights: true,
    script: true,
    cases: true,
    pains: false,
    solutions: false,
    objections: false,
  });

  if (!playbook) return null;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(playbook.linearScript);
    setCopiedScript(true);
    toast.success('Script copiado!');
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopyAll = () => {
    const fullContent = `
PLAYBOOK DE LIGAÇÃO - ${extractedData?.name || 'Lead'}
${extractedData?.company || ''} | ${extractedData?.role || ''}
================================================

📊 INSIGHTS CHAVE:
${playbook.keyInsights.map((i, idx) => `${idx + 1}. ${i.insight}\n   Fonte: ${i.source}\n   Relevância: ${i.relevance}`).join('\n\n')}

📞 SCRIPT DA LIGAÇÃO:
${playbook.linearScript}

🏆 CASES PARA CITAR:
${playbook.casesToCite.map(c => `• ${c.company}: ${c.result}\n  Como introduzir: "${c.howToIntroduce}"`).join('\n\n')}

🎯 DORES PROVÁVEIS:
${playbook.probablePains.map(p => `• ${p.pain}\n  Impacto: ${p.impact}\n  Pergunta: "${p.question}"`).join('\n\n')}

💡 SOLUÇÕES META IT:
${playbook.metaSolutions.map(s => `• ${s.solution}: ${s.description}\n  Dor que resolve: ${s.alignedPain}\n  Como mencionar: "${s.howToMention}"`).join('\n\n')}

🛡️ OBJEÇÕES E RESPOSTAS:
${playbook.objectionHandlers.map(o => `• "${o.objection}"\n  → ${o.response}`).join('\n\n')}
    `.trim();
    
    navigator.clipboard.writeText(fullContent);
    toast.success('Playbook completo copiado!');
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
              <Copy className="h-4 w-4" />
              Copiar Tudo
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
            {/* Lead Info Card */}
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
                
                {playbook.leadSummary && (
                  <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3 mt-4">
                    {playbook.leadSummary}
                  </p>
                )}
              </div>

              {/* Cases para Citar */}
              <div className="mt-6 pt-4 border-t">
                <button 
                  onClick={() => toggleSection('cases')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    Cases para Citar
                  </h4>
                  {expandedSections.cases ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedSections.cases && (
                  <div className="space-y-3 mt-3">
                    {playbook.casesToCite.map((caseItem, i) => (
                      <div key={i} className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-sm">
                        <p className="font-semibold text-green-700 dark:text-green-400">{caseItem.company}</p>
                        <p className="text-green-600 dark:text-green-300 mt-1">{caseItem.result}</p>
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          💬 "{caseItem.howToIntroduce}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dores Prováveis */}
              <div className="mt-6 pt-4 border-t">
                <button 
                  onClick={() => toggleSection('pains')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Dores Prováveis
                  </h4>
                  {expandedSections.pains ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedSections.pains && (
                  <div className="space-y-3 mt-3">
                    {playbook.probablePains.map((painItem, i) => (
                      <div key={i} className="text-sm">
                        <p className="font-medium">{painItem.pain}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Impacto: {painItem.impact}
                        </p>
                        <p className="text-xs text-primary mt-1 italic">
                          Pergunta: "{painItem.question}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Soluções Meta IT */}
              <div className="mt-6 pt-4 border-t">
                <button 
                  onClick={() => toggleSection('solutions')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Soluções Meta IT
                  </h4>
                  {expandedSections.solutions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedSections.solutions && (
                  <div className="space-y-3 mt-3">
                    {playbook.metaSolutions.map((sol, i) => (
                      <div key={i} className="bg-primary/5 rounded-lg p-3 text-sm">
                        <p className="font-semibold text-primary">{sol.solution}</p>
                        <p className="text-muted-foreground text-xs mt-1">{sol.description}</p>
                        <p className="text-xs mt-2">
                          <span className="text-destructive">Resolve:</span> {sol.alignedPain}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          💬 "{sol.howToMention}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Insights Chave */}
            <Card className="p-6">
              <button 
                onClick={() => toggleSection('insights')}
                className="flex items-center justify-between w-full text-left mb-4"
              >
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Insights Chave do Lead
                </h3>
                {expandedSections.insights ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              
              {expandedSections.insights && (
                <div className="grid gap-3">
                  {playbook.keyInsights.map((insightItem, i) => (
                    <div 
                      key={i} 
                      className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border border-amber-100 dark:border-amber-900"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-amber-600 font-bold">{i + 1}</span>
                        <div className="flex-1">
                          <p className="font-medium text-amber-900 dark:text-amber-100">
                            {insightItem.insight}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {insightItem.source}
                            </span>
                          </div>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                            ➜ {insightItem.relevance}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Script Linear */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => toggleSection('script')}
                  className="flex items-center gap-2 text-left"
                >
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Script da Ligação
                  </h3>
                </button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyScript}
                  className="gap-2"
                >
                  {copiedScript ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedScript ? 'Copiado!' : 'Copiar Script'}
                </Button>
              </div>
              
              {expandedSections.script && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="bg-muted/50 rounded-lg p-6 text-base leading-relaxed whitespace-pre-wrap font-normal">
                    {playbook.linearScript.split('\n').map((paragraph, i) => {
                      // Destacar instruções entre colchetes
                      const formattedParagraph = paragraph.replace(
                        /\[(.*?)\]/g, 
                        '<span class="text-primary font-semibold">[$1]</span>'
                      );
                      
                      return paragraph.trim() ? (
                        <p 
                          key={i} 
                          className="mb-4"
                          dangerouslySetInnerHTML={{ __html: formattedParagraph }}
                        />
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </Card>

            {/* Objeções */}
            <Card className="p-6">
              <button 
                onClick={() => toggleSection('objections')}
                className="flex items-center justify-between w-full text-left mb-4"
              >
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  Objeções e Respostas
                </h3>
                {expandedSections.objections ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              
              {expandedSections.objections && (
                <div className="space-y-4">
                  {playbook.objectionHandlers.map((obj, i) => (
                    <div 
                      key={i} 
                      className="border rounded-lg overflow-hidden"
                    >
                      <div className="bg-red-50 dark:bg-red-950/30 p-3 border-b">
                        <p className="font-medium text-red-700 dark:text-red-300">
                          🚫 "{obj.objection}"
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/30 p-3">
                        <p className="text-green-700 dark:text-green-300">
                          ✅ {obj.response}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
