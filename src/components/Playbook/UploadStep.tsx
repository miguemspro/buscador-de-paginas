import { useCallback, useEffect } from 'react';
import { Upload, Image as ImageIcon, Clipboard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { usePlaybookStore } from '@/store/playbookStore';
import { extractLeadFromImage, generatePlaybook } from '@/services/playbookService';

export default function UploadStep() {
  const { 
    setStep, 
    setImagePreview, 
    setExtractedData, 
    setPlaybookComplete,
    setLoading, 
    setError 
  } = usePlaybookStore();

  const processImage = useCallback(async (base64: string) => {
    setImagePreview(base64);
    setStep('extracting');
    setLoading(true, 'Lendo informações do Salesforce...');

    try {
      // Step 1: Extract data from image
      const extracted = await extractLeadFromImage(base64);
      setExtractedData(extracted);
      setStep('context');
      
      // Brief pause to show context
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 2: Generate playbook
      setStep('generating');
      setLoading(true, 'Gerando seu playbook de abordagem...');
      
      const playbook = await generatePlaybook(extracted);
      
      // Atualização atômica para evitar race conditions
      setPlaybookComplete(playbook);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar imagem');
      setStep('upload');
    }
  }, [setStep, setImagePreview, setExtractedData, setPlaybookComplete, setLoading, setError]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor, envie apenas imagens');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      processImage(base64);
    };
    reader.readAsDataURL(file);
  }, [processImage, setError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  // Handle Ctrl+V paste
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleFileSelect(file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handleFileSelect]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 sm:p-8">
      <div className="max-w-lg w-full space-y-4 sm:space-y-6">
        {/* Main Upload Card */}
        <Card
          className={cn(
            'border-2 border-dashed p-6 sm:p-12 text-center cursor-pointer transition-all duration-300',
            'hover:border-primary hover:bg-primary/5 hover:scale-[1.02]',
            'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
            'active:scale-[0.98]' // Better touch feedback
          )}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById('file-input')?.click()}
          tabIndex={0}
        >
          <input
            id="file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
          
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <div className="p-4 sm:p-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 animate-pulse">
              <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <h2 className="text-lg sm:text-2xl font-bold">Arraste o print do Salesforce</h2>
              <p className="text-sm text-muted-foreground">
                ou clique para selecionar uma imagem
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-muted">
                <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>PNG, JPG, WEBP</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-accent text-accent-foreground font-medium">
                <Clipboard className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Ctrl+V para colar</span>
                <span className="sm:hidden">Cole aqui</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { step: 1, text: 'Cole o print', icon: '📋' },
            { step: 2, text: 'IA extrai dados', icon: '🤖' },
            { step: 3, text: 'Playbook pronto', icon: '🎯' },
          ].map((item) => (
            <div 
              key={item.step}
              className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 rounded-lg bg-muted/50"
            >
              <span className="text-xl sm:text-2xl">{item.icon}</span>
              <div className="text-center">
                <div className="text-[10px] sm:text-xs text-muted-foreground">Passo {item.step}</div>
                <div className="text-xs sm:text-sm font-medium">{item.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
