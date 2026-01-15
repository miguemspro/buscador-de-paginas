import { useState } from 'react';
import { usePlaybookStore } from '@/store/playbookStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Target,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Zap,
  TrendingUp,
  Users,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type SectionId = 'summary' | 'evidences' | 'pains' | 'solutions' | 'discovery' | 'approach';

export default function PlaybookView() {
  const { playbook, extractedData, reset } = usePlaybookStore();
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('summary');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    evidences: true,
    pains: true,
    solutions: true,
    discovery: true,
    approach: true,
  });

  if (!playbook) return null;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCopyScript = () => {
    if (playbook.approachScript?.fullText) {
      navigator.clipboard.writeText(playbook.approachScript.fullText);
      setCopiedScript(true);
      toast.success('Script de abordagem copiado!');
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  const handleCopyAll = () => {
    const es = playbook.executiveSummary;
    const fullContent = `
PLAYBOOK CONSULTIVO - ${extractedData?.name || 'Lead'}
${extractedData?.company || ''} | ${extractedData?.role || ''}
${'='.repeat(60)}

📋 RESUMO EXECUTIVO:

1. Contexto da Empresa:
${es?.companyContext || ''}

2. Perfil do Lead:
${es?.leadProfile || ''}

3. Prioridades 2025/2026:
${es?.priorities2026 || ''}

4. Ângulo de Abordagem:
${es?.approachAngle || ''}

5. Contexto Público:
${es?.publicContext || ''}

${'─'.repeat(60)}

📰 EVIDÊNCIAS E NOTÍCIAS:

${playbook.evidences?.map((e, i) => `${i + 1}. ${e.title}
   → ${e.indication}
   🔗 ${e.link} (${e.source})`).join('\n\n') || 'Nenhuma evidência'}

${'─'.repeat(60)}

🎯 DORES PROVÁVEIS:

${playbook.probablePains?.map((p, i) => `${i + 1}. ${p.pain}
   Motivo: ${p.reason}`).join('\n\n') || 'Nenhuma dor identificada'}

${'─'.repeat(60)}

💡 COMO A META IT PODE AJUDAR:

${playbook.metaSolutions?.map((s, i) => `${i + 1}. ${s.solution}
   Resolve: ${s.pain}
   ${s.description}`).join('\n\n') || 'Nenhuma solução mapeada'}

${'─'.repeat(60)}

❓ PERGUNTAS DE DISCOVERY:

FASE E PRIORIDADES:
${playbook.discoveryQuestions?.phaseAndPriorities?.map((q, i) => `${i + 1}. ${q}`).join('\n') || ''}

OPERAÇÃO E INTEGRAÇÕES:
${playbook.discoveryQuestions?.operationsIntegration?.map((q, i) => `${i + 1}. ${q}`).join('\n') || ''}

QUALIFICAÇÃO:
${playbook.discoveryQuestions?.qualification?.map((q, i) => `${i + 1}. ${q}`).join('\n') || ''}

${'─'.repeat(60)}

📞 TEXTO DE ABORDAGEM:

${playbook.approachScript?.fullText || ''}
    `.trim();
    
    navigator.clipboard.writeText(fullContent);
    toast.success('Playbook completo copiado!');
  };

  const sections = [
    { id: 'summary' as SectionId, label: 'Resumo', icon: FileText },
    { id: 'evidences' as SectionId, label: 'Evidências', icon: ExternalLink },
    { id: 'pains' as SectionId, label: 'Dores', icon: AlertTriangle },
    { id: 'solutions' as SectionId, label: 'Soluções', icon: Sparkles },
    { id: 'discovery' as SectionId, label: 'Discovery', icon: HelpCircle },
    { id: 'approach' as SectionId, label: 'Abordagem', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">SDR ProspectFlow</h1>
            <Badge variant="secondary" className="hidden sm:flex gap-1">
              <Check className="h-3 w-3" />
              Playbook Gerado
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

      <div className="container px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar - Lead Context + Navigation */}
          <div className="lg:col-span-1 space-y-4">
            {/* Lead Info Card */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Lead</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xl font-bold">{extractedData?.name || 'Lead'}</p>
                  <p className="text-sm text-muted-foreground">{extractedData?.role}</p>
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

                {extractedData?.sapStatus && (
                  <Badge variant="outline" className="mt-2">
                    SAP: {extractedData.sapStatus}
                  </Badge>
                )}
              </div>
            </Card>

            {/* Section Navigation */}
            <Card className="p-3">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        setActiveSection(section.id);
                        document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left',
                        activeSection === section.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* 1. RESUMO EXECUTIVO */}
            <Card className="p-6" id="summary">
              <button 
                onClick={() => toggleSection('summary')}
                className="flex items-center justify-between w-full text-left mb-4"
              >
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  1. Resumo Executivo
                </h2>
                {expandedSections.summary ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              
              {expandedSections.summary && playbook.executiveSummary && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { icon: Building2, label: 'Contexto da Empresa', value: playbook.executiveSummary.companyContext, color: 'text-blue-500' },
                    { icon: User, label: 'Perfil do Lead', value: playbook.executiveSummary.leadProfile, color: 'text-green-500' },
                    { icon: Target, label: 'Prioridades 2025/2026', value: playbook.executiveSummary.priorities2026, color: 'text-amber-500' },
                    { icon: Zap, label: 'Ângulo de Abordagem', value: playbook.executiveSummary.approachAngle, color: 'text-purple-500' },
                    { icon: TrendingUp, label: 'Contexto Público', value: playbook.executiveSummary.publicContext, color: 'text-cyan-500' },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="bg-muted/50 rounded-lg p-4 border">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={cn('h-4 w-4', item.color)} />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {item.label}
                          </span>
                        </div>
                        <p className="text-sm">{item.value}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* 2. EVIDÊNCIAS E NOTÍCIAS */}
            <Card className="p-6" id="evidences">
              <button 
                onClick={() => toggleSection('evidences')}
                className="flex items-center justify-between w-full text-left mb-4"
              >
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-blue-500" />
                  2. Evidências e Notícias
                  <Badge variant="secondary" className="ml-2">{playbook.evidences?.length || 0}</Badge>
                </h2>
                {expandedSections.evidences ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              
              {expandedSections.evidences && (
                <div className="space-y-4">
                  {(!playbook.evidences || playbook.evidences.length === 0) ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma evidência específica encontrada.</p>
                      <p className="text-xs mt-1">Pesquise manualmente no LinkedIn e Google sobre a empresa.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {playbook.evidences.map((evidence, i) => {
                        // Criar URL de busca no Google com base no título
                        const searchQuery = encodeURIComponent(`"${extractedData?.company || ''}" ${evidence.title.replace(/^\[.*?\]\s*/, '')}`);
                        const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;
                        
                        return (
                          <div key={i} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <p className="font-medium text-sm mb-2">{evidence.title}</p>
                            <p className="text-sm text-muted-foreground mb-3">
                              <span className="text-primary">→</span> {evidence.indication}
                            </p>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-muted-foreground italic">
                                📍 {evidence.link}
                              </span>
                              <a 
                                href={googleSearchUrl}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Pesquisar
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* 3. DORES PROVÁVEIS */}
            <Card className="p-6" id="pains">
              <button 
                onClick={() => toggleSection('pains')}
                className="flex items-center justify-between w-full text-left mb-4"
              >
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  3. Dores Prováveis
                  <Badge variant="secondary" className="ml-2">{playbook.probablePains?.length || 0}</Badge>
                </h2>
                {expandedSections.pains ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              
              {expandedSections.pains && (
                <div className="space-y-3">
                  {playbook.probablePains?.map((pain, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-destructive/10 text-destructive text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{pain.pain}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Motivo: {pain.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* 4. COMO A META IT PODE AJUDAR */}
            <Card className="p-6" id="solutions">
              <button 
                onClick={() => toggleSection('solutions')}
                className="flex items-center justify-between w-full text-left mb-4"
              >
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  4. Como a Meta IT Pode Ajudar
                  <Badge variant="secondary" className="ml-2">{playbook.metaSolutions?.length || 0}</Badge>
                </h2>
                {expandedSections.solutions ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              
              {expandedSections.solutions && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {playbook.metaSolutions?.map((sol, i) => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                      <div className="bg-destructive/10 px-4 py-2 border-b">
                        <p className="text-xs font-medium text-destructive">Dor: {sol.pain}</p>
                      </div>
                      <div className="p-4">
                        <p className="font-semibold text-sm text-primary">{sol.solution}</p>
                        <p className="text-xs text-muted-foreground mt-1">{sol.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* 5. PERGUNTAS DE DISCOVERY */}
            <Card className="p-6" id="discovery">
              <button 
                onClick={() => toggleSection('discovery')}
                className="flex items-center justify-between w-full text-left mb-4"
              >
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-amber-500" />
                  5. Perguntas de Discovery
                  <Badge variant="secondary" className="ml-2">12</Badge>
                </h2>
                {expandedSections.discovery ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              
              {expandedSections.discovery && playbook.discoveryQuestions && (
                <Tabs defaultValue="phase" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="phase" className="text-xs">
                      <Target className="h-3 w-3 mr-1" />
                      Fase/Prioridades
                    </TabsTrigger>
                    <TabsTrigger value="operations" className="text-xs">
                      <Settings className="h-3 w-3 mr-1" />
                      Operação
                    </TabsTrigger>
                    <TabsTrigger value="qualification" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      Qualificação
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="phase" className="space-y-2">
                    {playbook.discoveryQuestions.phaseAndPriorities?.map((q, i) => (
                      <div key={i} className="flex gap-2 items-start bg-muted/50 rounded-lg p-3">
                        <span className="text-amber-500 font-bold">{i + 1}.</span>
                        <p className="text-sm">{q}</p>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="operations" className="space-y-2">
                    {playbook.discoveryQuestions.operationsIntegration?.map((q, i) => (
                      <div key={i} className="flex gap-2 items-start bg-muted/50 rounded-lg p-3">
                        <span className="text-amber-500 font-bold">{i + 1}.</span>
                        <p className="text-sm">{q}</p>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="qualification" className="space-y-2">
                    {playbook.discoveryQuestions.qualification?.map((q, i) => (
                      <div key={i} className="flex gap-2 items-start bg-muted/50 rounded-lg p-3">
                        <span className="text-amber-500 font-bold">{i + 1}.</span>
                        <p className="text-sm">{q}</p>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              )}
            </Card>

            {/* 6. TEXTO FINAL DE ABORDAGEM */}
            <Card className="p-6" id="approach">
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => toggleSection('approach')}
                  className="flex items-center gap-2 text-left"
                >
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    6. Texto de Abordagem
                  </h2>
                </button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleCopyScript}
                  className="gap-2"
                >
                  {copiedScript ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedScript ? 'Copiado!' : 'Copiar Script'}
                </Button>
              </div>
              
              {expandedSections.approach && playbook.approachScript && (
                <div className="space-y-4">
                  {/* Estrutura do Script */}
                  <div className="grid gap-3 sm:grid-cols-2 mb-4">
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase mb-1">Abertura</p>
                      <p className="text-sm">{playbook.approachScript.opening}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase mb-1">Sinais Públicos</p>
                      <p className="text-sm">{playbook.approachScript.publicSignalsMention}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                      <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase mb-1">Intenção</p>
                      <p className="text-sm">{playbook.approachScript.clearIntention}</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase mb-1">Perguntas Estratégicas</p>
                      <ul className="text-sm space-y-1">
                        {playbook.approachScript.strategicQuestions?.map((q, i) => (
                          <li key={i}>• {q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Texto Completo */}
                  <div className="bg-muted/50 rounded-lg p-6 border-2 border-primary/20">
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-3">
                      📞 Texto Completo para a Ligação
                    </p>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="text-base leading-relaxed whitespace-pre-wrap">
                        {playbook.approachScript.fullText}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
