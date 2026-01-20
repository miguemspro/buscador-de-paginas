import { useState } from 'react';
import { usePlaybookStore } from '@/store/playbookStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  RotateCcw,
  User,
  Building2,
  Briefcase,
  AlertTriangle,
  Copy,
  Check,
  Target,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Users,
  Settings,
  Server,
  Database,
  Linkedin,
  Award,
  BarChart3,
  ClipboardCheck,
  MoreVertical,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ExportPDF } from './ExportPDF';
import { FeedbackForm } from '@/components/Feedback/FeedbackForm';
import { MobileBottomNav, type SectionId } from './MobileBottomNav';
import { MobileLeadCard } from './MobileLeadCard';
import { PlaybookChat } from './PlaybookChat';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function PlaybookView() {
  const { playbook, extractedData, reset, playbookId } = usePlaybookStore();
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('summary');
  const [showFeedback, setShowFeedback] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    evidences: true,
    pains: true,
    solutions: true,
    cases: true,
    discovery: true,
  });

  const isMobile = useIsMobile();

  if (!playbook) return null;

  // Separar evidências por categoria
  const sapEvidences = playbook.sapEvidences || playbook.evidences?.filter(e => e.category === 'SAP') || [];
  const techEvidences = playbook.techEvidences || playbook.evidences?.filter(e => e.category === 'Tecnologia') || [];
  const linkedinEvidences = playbook.linkedinEvidences || playbook.evidences?.filter(e => e.category === 'LinkedIn') || [];
  const hasCases = playbook.relevantCases && playbook.relevantCases.length > 0;

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

1. Sobre a Empresa:
${es?.companyContext || ''}

2. Perfil do Lead:
${es?.leadProfile || ''}

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
    { id: 'cases' as SectionId, label: 'Cases', icon: Award },
    { id: 'discovery' as SectionId, label: 'Discovery', icon: HelpCircle },
    { id: 'chat' as SectionId, label: 'Chat', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <h1 className="text-base sm:text-xl font-bold truncate">SDR ProspectFlow</h1>
            <Badge variant="secondary" className="hidden sm:flex gap-1">
              <Check className="h-3 w-3" />
              Playbook Gerado
            </Badge>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <ExportPDF 
              playbook={playbook} 
              leadCompany={extractedData?.company || 'Lead'} 
              leadName={extractedData?.name}
            />
            <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Feedback
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-lg">
                <FeedbackForm
                  playbookId={playbookId || ''}
                  leadCompany={extractedData?.company || ''}
                  pains={playbook.probablePains || []}
                  onClose={() => setShowFeedback(false)}
                />
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-2">
              <Copy className="h-4 w-4" />
              Copiar Tudo
            </Button>
            <Button variant="ghost" size="sm" onClick={reset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Novo Lead
            </Button>
          </div>

          {/* Mobile Actions */}
          <div className="flex sm:hidden items-center gap-1">
            <Button variant="ghost" size="icon" onClick={reset} className="h-9 w-9">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyAll}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Tudo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowFeedback(true)}>
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Dar Feedback
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container px-3 sm:px-4 py-4 sm:py-6">
        {/* Mobile Lead Card */}
        <div className="mb-4 lg:hidden">
          <MobileLeadCard extractedData={extractedData} />
        </div>

        <div className="flex gap-6">
          
          {/* Left Sidebar - Lead Context + Navigation - FIXED (Desktop only) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-20 space-y-4">
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
                    if (section.id === 'cases' && !hasCases) return null;
                    if (section.id === 'chat') return null; // Chat is on the right side
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
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-4 sm:space-y-6">
            
            {/* 1. RESUMO EXECUTIVO */}
            <Card className="p-4 sm:p-6" id="summary">
              <button 
                onClick={() => toggleSection('summary')}
                className="flex items-center justify-between w-full text-left mb-3 sm:mb-4"
              >
                <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  1. Resumo Executivo
                </h2>
                {expandedSections.summary ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              
              {expandedSections.summary && playbook.executiveSummary && (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {[
                    { icon: Building2, label: 'Sobre a Empresa', value: playbook.executiveSummary.companyContext, color: 'text-blue-500' },
                    { icon: User, label: 'Perfil do Lead', value: playbook.executiveSummary.leadProfile, color: 'text-green-500' },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="bg-muted/50 rounded-lg p-3 sm:p-4 border">
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
            <Card className="p-4 sm:p-6" id="evidences">
              <button
                onClick={() => toggleSection('evidences')}
                className="flex items-center justify-between w-full text-left mb-3 sm:mb-4"
              >
                <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  2. Evidências e Notícias
                  {playbook.evidences && playbook.evidences.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{playbook.evidences.length}</Badge>
                  )}
                </h2>
                {expandedSections.evidences ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {expandedSections.evidences && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Seção SAP */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                      <h3 className="font-semibold text-sm sm:text-base">Ambiente SAP</h3>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 text-xs">
                        {sapEvidences.length}
                      </Badge>
                    </div>
                    {sapEvidences.length > 0 ? (
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {sapEvidences.map((evidence, i) => (
                          <a
                            key={i}
                            href={evidence.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border rounded-lg p-3 sm:p-4 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-colors group border-orange-200 dark:border-orange-800 active:scale-[0.98]"
                          >
                            <h4 className="font-medium text-sm mb-2 line-clamp-2">{evidence.title}</h4>
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">→ {evidence.indication}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950 dark:text-orange-400">
                                {evidence.source || 'Web'}
                              </Badge>
                              {evidence.date && (
                                <span className="text-xs text-muted-foreground">{evidence.date}</span>
                              )}
                              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Nenhuma evidência SAP encontrada para esta empresa.</p>
                    )}
                  </div>

                  {/* Separador */}
                  <div className="border-t" />

                  {/* Seção Tecnologia */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Server className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                      <h3 className="font-semibold text-sm sm:text-base">Ambiente de Tecnologia</h3>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 text-xs">
                        {techEvidences.length}
                      </Badge>
                    </div>
                    {techEvidences.length > 0 ? (
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {techEvidences.map((evidence, i) => (
                          <a
                            key={i}
                            href={evidence.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border rounded-lg p-3 sm:p-4 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-colors group border-purple-200 dark:border-purple-800 active:scale-[0.98]"
                          >
                            <h4 className="font-medium text-sm mb-2 line-clamp-2">{evidence.title}</h4>
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">→ {evidence.indication}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950 dark:text-purple-400">
                                {evidence.source || 'Web'}
                              </Badge>
                              {evidence.date && (
                                <span className="text-xs text-muted-foreground">{evidence.date}</span>
                              )}
                              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Nenhuma evidência de tecnologia encontrada para esta empresa.</p>
                    )}
                  </div>

                  {/* Separador */}
                  <div className="border-t" />

                  {/* Seção LinkedIn */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Linkedin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      <h3 className="font-semibold text-sm sm:text-base">LinkedIn</h3>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 text-xs">
                        {linkedinEvidences.length}
                      </Badge>
                    </div>
                    {linkedinEvidences.length > 0 ? (
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {linkedinEvidences.map((evidence, i) => (
                          <a
                            key={i}
                            href={evidence.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border rounded-lg p-3 sm:p-4 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors group border-blue-200 dark:border-blue-800 active:scale-[0.98]"
                          >
                            <h4 className="font-medium text-sm mb-2 line-clamp-2">{evidence.title}</h4>
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">→ {evidence.indication}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400">
                                {evidence.source || 'LinkedIn'}
                              </Badge>
                              {evidence.date && (
                                <span className="text-xs text-muted-foreground">{evidence.date}</span>
                              )}
                              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Nenhuma publicação LinkedIn sobre SAP encontrada para esta empresa.</p>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* 3. DORES PROVÁVEIS */}
            <Card className="p-4 sm:p-6" id="pains">
              <button 
                onClick={() => toggleSection('pains')}
                className="flex items-center justify-between w-full text-left mb-3 sm:mb-4"
              >
                <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{pain.pain}</p>
                          {pain.confidence && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                pain.confidence === 'alta' && "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300",
                                pain.confidence === 'media' && "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
                                pain.confidence === 'baixa' && "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400"
                              )}
                            >
                              {pain.confidence}
                            </Badge>
                          )}
                        </div>
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
            <Card className="p-4 sm:p-6" id="solutions">
              <button 
                onClick={() => toggleSection('solutions')}
                className="flex items-center justify-between w-full text-left mb-3 sm:mb-4"
              >
                <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  4. Como a Meta IT Pode Ajudar
                  <Badge variant="secondary" className="ml-2">{playbook.metaSolutions?.length || 0}</Badge>
                </h2>
                {expandedSections.solutions ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              
              {expandedSections.solutions && (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {playbook.metaSolutions?.map((sol, i) => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                      <div className="bg-destructive/10 px-3 sm:px-4 py-2 border-b">
                        <p className="text-xs font-medium text-destructive">Dor: {sol.pain}</p>
                      </div>
                      <div className="p-3 sm:p-4">
                        <p className="font-semibold text-sm text-primary">{sol.solution}</p>
                        <p className="text-xs text-muted-foreground mt-1">{sol.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* 5. CASES RELEVANTES */}
            {hasCases && (
              <Card className="p-4 sm:p-6" id="cases">
                <button 
                  onClick={() => toggleSection('cases')}
                  className="flex items-center justify-between w-full text-left mb-3 sm:mb-4"
                >
                  <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                    5. Cases Relevantes
                    <Badge variant="secondary" className="ml-2">{playbook.relevantCases?.length}</Badge>
                  </h2>
                  {expandedSections.cases ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                
                {expandedSections.cases && (
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {playbook.relevantCases?.map((caseItem, i) => (
                      <div key={i} className="border rounded-lg overflow-hidden bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
                        <div className="bg-amber-100/80 dark:bg-amber-900/40 px-3 sm:px-4 py-2 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm truncate">{caseItem.company}</p>
                          {caseItem.score && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300 flex-shrink-0">
                              {(caseItem.score * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                        <div className="p-3 sm:p-4 space-y-2">
                          <p className="text-sm font-medium">{caseItem.title}</p>
                          <p className="text-xs text-muted-foreground">{caseItem.result}</p>
                          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 pt-2 border-t border-amber-100 dark:border-amber-900">
                            <BarChart3 className="h-3 w-3" />
                            <span className="line-clamp-1">{caseItem.relevance}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* 6. PERGUNTAS DE DISCOVERY */}
            <Card className="p-4 sm:p-6" id="discovery">
              <button 
                onClick={() => toggleSection('discovery')}
                className="flex items-center justify-between w-full text-left mb-3 sm:mb-4"
              >
                <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                  6. Perguntas de Discovery
                  <Badge variant="secondary" className="ml-2">12</Badge>
                </h2>
                {expandedSections.discovery ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              
              {expandedSections.discovery && playbook.discoveryQuestions && (
                <Tabs defaultValue="phase" className="w-full">
                  <TabsList className="w-full grid grid-cols-3 mb-4 h-auto">
                    <TabsTrigger value="phase" className="text-xs py-2 px-1 sm:px-3">
                      <Target className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Fase/Prioridades</span>
                      <span className="sm:hidden">Fase</span>
                    </TabsTrigger>
                    <TabsTrigger value="operations" className="text-xs py-2 px-1 sm:px-3">
                      <Settings className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Operação</span>
                      <span className="sm:hidden">Op.</span>
                    </TabsTrigger>
                    <TabsTrigger value="qualification" className="text-xs py-2 px-1 sm:px-3">
                      <Users className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Qualificação</span>
                      <span className="sm:hidden">Qual.</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="phase" className="space-y-2">
                    {playbook.discoveryQuestions.phaseAndPriorities?.map((q, i) => (
                      <div key={i} className="flex gap-2 items-start bg-muted/50 rounded-lg p-3">
                        <span className="text-amber-500 font-bold flex-shrink-0">{i + 1}.</span>
                        <p className="text-sm">{q}</p>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="operations" className="space-y-2">
                    {playbook.discoveryQuestions.operationsIntegration?.map((q, i) => (
                      <div key={i} className="flex gap-2 items-start bg-muted/50 rounded-lg p-3">
                        <span className="text-amber-500 font-bold flex-shrink-0">{i + 1}.</span>
                        <p className="text-sm">{q}</p>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="qualification" className="space-y-2">
                    {playbook.discoveryQuestions.qualification?.map((q, i) => (
                      <div key={i} className="flex gap-2 items-start bg-muted/50 rounded-lg p-3">
                        <span className="text-amber-500 font-bold flex-shrink-0">{i + 1}.</span>
                        <p className="text-sm">{q}</p>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              )}
            </Card>

          </main>

          {/* Right Sidebar - Chat (Desktop only) */}
          <aside className="hidden xl:block w-96 flex-shrink-0">
            <PlaybookChat playbook={playbook} extractedData={extractedData} />
          </aside>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        hasCases={hasCases}
        onChatClick={() => setShowMobileChat(true)}
      />

      {/* Mobile Chat Sheet */}
      <Sheet open={showMobileChat} onOpenChange={setShowMobileChat}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Assistente de Chat</SheetTitle>
          </SheetHeader>
          <PlaybookChat playbook={playbook} extractedData={extractedData} />
        </SheetContent>
      </Sheet>

      {/* Mobile Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-lg sm:hidden">
          <FeedbackForm
            playbookId={playbookId || ''}
            leadCompany={extractedData?.company || ''}
            pains={playbook.probablePains || []}
            onClose={() => setShowFeedback(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
