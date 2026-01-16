import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { analyticsService } from '@/services/analyticsService';
import type { GeneratedPlaybook } from '@/types/playbook.types';

interface ExportPDFProps {
  playbook: GeneratedPlaybook;
  leadCompany: string;
  leadName?: string;
}

export function ExportPDF({ playbook, leadCompany, leadName }: ExportPDFProps) {
  const [isExporting, setIsExporting] = useState(false);

  const generatePDFContent = (): string => {
    const date = new Date().toLocaleDateString('pt-BR');
    
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Playbook - ${leadCompany}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    h3 { color: #4b5563; margin-top: 20px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .meta { color: #6b7280; font-size: 14px; }
    .section { margin-bottom: 25px; }
    .evidence { background: #f3f4f6; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .evidence a { color: #3b82f6; }
    .pain { padding: 10px; border-left: 3px solid #f59e0b; margin: 8px 0; background: #fffbeb; }
    .solution { padding: 10px; border-left: 3px solid #10b981; margin: 8px 0; background: #ecfdf5; }
    .case { background: #eff6ff; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .question { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .script { background: #f9fafb; padding: 20px; border-radius: 8px; white-space: pre-wrap; }
    ul { padding-left: 20px; }
    li { margin: 5px 0; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>📘 Playbook de Prospecção</h1>
      <p class="meta"><strong>${leadCompany}</strong>${leadName ? ` - ${leadName}` : ''}</p>
    </div>
    <div class="meta">
      <p>Gerado em: ${date}</p>
      <p>Meta IT - Parceira SAP</p>
    </div>
  </div>

  <div class="section">
    <h2>📋 Resumo Executivo</h2>
    <p>${playbook.executiveSummary || 'Não disponível'}</p>
  </div>
`;

    // Evidências
    if (playbook.evidences && playbook.evidences.length > 0) {
      html += `
  <div class="section">
    <h2>🔍 Evidências de Mercado</h2>
`;
      for (const evidence of playbook.evidences) {
        html += `
    <div class="evidence">
      <strong>${evidence.title}</strong>
      <p>${evidence.indication}</p>
      <p><a href="${evidence.link}" target="_blank">${evidence.source}${evidence.date ? ` - ${evidence.date}` : ''}</a></p>
    </div>
`;
      }
      html += `  </div>`;
    }

    // Dores
    if (playbook.probablePains && playbook.probablePains.length > 0) {
      html += `
  <div class="section">
    <h2>😓 Dores Prováveis</h2>
`;
      for (const pain of playbook.probablePains) {
        html += `
    <div class="pain">
      <strong>${pain.pain}</strong>
      <p>${pain.reason}</p>
    </div>
`;
      }
      html += `  </div>`;
    }

    // Soluções
    if (playbook.metaSolutions && playbook.metaSolutions.length > 0) {
      html += `
  <div class="section">
    <h2>💡 Soluções Meta IT</h2>
`;
      for (const solution of playbook.metaSolutions) {
        html += `
    <div class="solution">
      <strong>${solution.solution}</strong>
      <p>${solution.description}</p>
      <p><em>Para a dor: ${solution.pain}</em></p>
    </div>
`;
      }
      html += `  </div>`;
    }

    // Cases
    if (playbook.relevantCases && playbook.relevantCases.length > 0) {
      html += `
  <div class="section">
    <h2>🏆 Cases Relevantes</h2>
`;
      for (const caseItem of playbook.relevantCases) {
        html += `
    <div class="case">
      <strong>${caseItem.company}</strong>
      <p>${caseItem.title}</p>
      <p><em>${caseItem.result}</em></p>
    </div>
`;
      }
      html += `  </div>`;
    }

    // Perguntas
    const allQuestions = [
      ...(playbook.discoveryQuestions?.phaseAndPriorities || []),
      ...(playbook.discoveryQuestions?.operationsIntegration || []),
      ...(playbook.discoveryQuestions?.qualification || []),
    ];
    if (allQuestions.length > 0) {
      html += `
  <div class="section">
    <h2>❓ Perguntas de Descoberta</h2>
`;
      for (const question of allQuestions) {
        html += `    <div class="question">${question}</div>\n`;
      }
      html += `  </div>`;
    }

    // Script
    if (playbook.approachScript?.fullText) {
      html += `
  <div class="section">
    <h2>📞 Script de Abordagem</h2>
    <div class="script">${playbook.approachScript.fullText}</div>
  </div>
`;
    }

    html += `
</body>
</html>`;

    return html;
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const htmlContent = generatePDFContent();
      
      // Abrir em nova janela para impressão/PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Aguardar carregamento e abrir diálogo de impressão
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      await analyticsService.trackEvent({
        event_type: 'pdf_exported',
        lead_company: leadCompany,
      });

      toast.success('PDF gerado! Use Ctrl+P para salvar como PDF.');
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      Exportar PDF
    </Button>
  );
}
