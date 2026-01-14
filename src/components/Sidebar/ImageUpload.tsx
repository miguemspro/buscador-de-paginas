import { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, Loader2, Sparkles, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLeadStore } from '@/store/leadStore';
import { extractLeadFromImage, generateLeadAnalysis } from '@/services/analysisService';
import type { LeadInfo } from '@/types/lead.types';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onAnalysisGenerated: () => void;
}

export default function ImageUpload({ onAnalysisGenerated }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Partial<LeadInfo> | null>(null);
  const [step, setStep] = useState<'upload' | 'extracting' | 'extracted' | 'generating'>('upload');
  const { setLeadInfo, setAnalysis, setError, isLoading, setLoading } = useLeadStore();

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor, envie apenas imagens');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      setStep('extracting');
      setLoading(true);

      try {
        // Step 1: Extract data from image
        const leadData = await extractLeadFromImage(base64);
        setExtractedData(leadData);
        setStep('extracted');
        
        // Step 2: Generate full analysis automatically
        setStep('generating');
        
        const fullLeadInfo: LeadInfo = {
          name: leadData.name || 'Lead',
          role: leadData.role || 'Cargo não identificado',
          company: leadData.company || 'Empresa',
          email: leadData.email || undefined,
          phone: leadData.phone || undefined,
          linkedinUrl: leadData.linkedinUrl || undefined,
          sapStatus: (leadData.sapStatus as LeadInfo['sapStatus']) || 'unknown',
          sapVersion: undefined,
          priority: leadData.priority || undefined,
          industry: leadData.industry || 'Tecnologia',
          companySize: (leadData.companySize as LeadInfo['companySize']) || 'large',
          challenges: [],
          publicSignals: leadData.publicSignals || undefined,
          notes: undefined,
          leadSource: leadData.leadSource || undefined,
        };

        setLeadInfo(fullLeadInfo);

        // Step 3: Generate analysis
        const analysis = await generateLeadAnalysis(fullLeadInfo);
        setAnalysis(analysis);
        onAnalysisGenerated();

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao processar imagem');
        setStep('upload');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }, [setLeadInfo, setAnalysis, setError, setLoading, onAnalysisGenerated]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleReset = () => {
    setPreview(null);
    setExtractedData(null);
    setStep('upload');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Upload Area */}
      {step === 'upload' && (
        <Card
          className={cn(
            'border-2 border-dashed p-8 text-center cursor-pointer transition-all',
            'hover:border-primary hover:bg-primary/5'
          )}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">Arraste o print do Salesforce</p>
              <p className="text-sm text-muted-foreground mt-1">
                ou clique para selecionar uma imagem
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              <span>PNG, JPG, WEBP até 20MB</span>
            </div>
          </div>
        </Card>
      )}

      {/* Processing State */}
      {(step === 'extracting' || step === 'generating') && (
        <div className="space-y-4">
          {preview && (
            <div className="relative rounded-lg overflow-hidden border">
              <img src={preview} alt="Print Salesforce" className="w-full opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="text-center space-y-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                  <div>
                    <p className="font-semibold">
                      {step === 'extracting' ? 'Extraindo dados do print...' : 'Gerando análise completa...'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {step === 'extracting' 
                        ? 'A IA está lendo as informações do Salesforce'
                        : 'Pesquisando e organizando resultados'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Extracted Preview */}
      {step === 'extracted' && extractedData && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-semibold">Dados Extraídos</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleReset}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            {extractedData.name && (
              <div>
                <span className="text-muted-foreground">Nome:</span>{' '}
                <span className="font-medium">{extractedData.name}</span>
              </div>
            )}
            {extractedData.company && (
              <div>
                <span className="text-muted-foreground">Empresa:</span>{' '}
                <span className="font-medium">{extractedData.company}</span>
              </div>
            )}
            {extractedData.role && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Cargo:</span>{' '}
                <span className="font-medium">{extractedData.role}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h4 className="font-semibold text-sm">Como funciona:</h4>
        <ol className="text-sm text-muted-foreground space-y-1">
          <li>1. Faça print da tela do lead no Salesforce</li>
          <li>2. Arraste ou cole a imagem aqui</li>
          <li>3. A IA extrai todos os dados automaticamente</li>
          <li>4. Análise completa gerada em segundos</li>
        </ol>
      </div>
    </div>
  );
}
