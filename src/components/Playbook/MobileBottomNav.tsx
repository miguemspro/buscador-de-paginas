import { 
  FileText, 
  ExternalLink, 
  AlertTriangle, 
  Sparkles, 
  Award, 
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type SectionId = 'summary' | 'evidences' | 'pains' | 'solutions' | 'cases' | 'discovery';

interface MobileBottomNavProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  hasCases?: boolean;
}

const sections = [
  { id: 'summary' as SectionId, label: 'Resumo', icon: FileText },
  { id: 'evidences' as SectionId, label: 'Evidências', icon: ExternalLink },
  { id: 'pains' as SectionId, label: 'Dores', icon: AlertTriangle },
  { id: 'solutions' as SectionId, label: 'Soluções', icon: Sparkles },
  { id: 'cases' as SectionId, label: 'Cases', icon: Award },
  { id: 'discovery' as SectionId, label: 'Discovery', icon: HelpCircle },
];

export function MobileBottomNav({ activeSection, onSectionChange, hasCases = true }: MobileBottomNavProps) {
  const visibleSections = hasCases ? sections : sections.filter(s => s.id !== 'cases');

  const handleClick = (sectionId: SectionId) => {
    onSectionChange(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t lg:hidden safe-area-pb">
      <div className="flex items-center justify-around py-2">
        {visibleSections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          
          return (
            <button
              key={section.id}
              onClick={() => handleClick(section.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors min-w-[48px]',
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className="text-[10px] font-medium truncate">{section.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
