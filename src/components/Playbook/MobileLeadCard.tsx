import { useState } from 'react';
import { User, Building2, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ExtractedLeadData } from '@/types/playbook.types';

interface MobileLeadCardProps {
  extractedData: ExtractedLeadData | null;
}

export function MobileLeadCard({ extractedData }: MobileLeadCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!extractedData) return null;

  return (
    <Card className="p-3 lg:hidden">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 flex-shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 text-left">
              <p className="font-semibold truncate">{extractedData.name || 'Lead'}</p>
              <p className="text-sm text-muted-foreground truncate">
                {extractedData.company}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {extractedData.sapStatus && (
              <Badge variant="outline" className="text-xs hidden sm:flex">
                SAP: {extractedData.sapStatus}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      <div className={cn(
        'overflow-hidden transition-all duration-300',
        isExpanded ? 'max-h-40 mt-3 pt-3 border-t' : 'max-h-0'
      )}>
        <div className="space-y-2">
          {extractedData.role && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{extractedData.role}</span>
            </div>
          )}
          {extractedData.industry && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{extractedData.industry}</span>
            </div>
          )}
          {extractedData.sapStatus && (
            <Badge variant="outline" className="sm:hidden">
              SAP: {extractedData.sapStatus}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
