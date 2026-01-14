import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageUpload from './components/Sidebar/ImageUpload';
import LeadForm from './components/Sidebar/LeadForm';
import ProspectCanvas from './components/Canvas/ProspectCanvas';
import AnalysisPanel from './components/Sidebar/AnalysisPanel';
import { useLeadStore } from './store/leadStore';
import { Upload, FileText, LayoutGrid, MessageSquare } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<string>('upload');
  const { analysis, leadInfo, error } = useLeadStore();

  const handleAnalysisGenerated = () => {
    setActiveTab('analysis');
  };

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="gradient-header text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">SDR ProspectFlow</h1>
              <p className="text-sm text-primary-foreground/80">
                Análise Inteligente de Leads com IA
              </p>
            </div>
            <div className="flex items-center gap-4">
              {leadInfo && (
                <div className="text-right">
                  <p className="text-xs text-primary-foreground/70">Lead atual</p>
                  <p className="font-semibold">{leadInfo.name} - {leadInfo.company}</p>
                </div>
              )}
              <div className="text-right border-l border-white/20 pl-4">
                <p className="text-xs text-primary-foreground/70">Powered by</p>
                <p className="font-semibold">Meta IT × IA</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-[400px] border-r bg-card flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <TabsList className="grid w-full grid-cols-4 p-1 m-2">
                <TabsTrigger value="upload" className="gap-1 text-xs">
                  <Upload className="h-3 w-3" />
                  Print
                </TabsTrigger>
                <TabsTrigger value="form" className="gap-1 text-xs">
                  <FileText className="h-3 w-3" />
                  Manual
                </TabsTrigger>
                <TabsTrigger value="analysis" disabled={!analysis} className="gap-1 text-xs">
                  <LayoutGrid className="h-3 w-3" />
                  Análise
                </TabsTrigger>
                <TabsTrigger value="script" disabled={!analysis} className="gap-1 text-xs">
                  <MessageSquare className="h-3 w-3" />
                  Script
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="flex-1 overflow-hidden m-0">
                <ImageUpload onAnalysisGenerated={handleAnalysisGenerated} />
              </TabsContent>
              
              <TabsContent value="form" className="flex-1 overflow-hidden m-0">
                <LeadForm onAnalysisGenerated={handleAnalysisGenerated} />
              </TabsContent>
              
              <TabsContent value="analysis" className="flex-1 overflow-hidden m-0">
                <AnalysisPanel view="full" />
              </TabsContent>
              
              <TabsContent value="script" className="flex-1 overflow-hidden m-0">
                <AnalysisPanel view="script" />
              </TabsContent>
            </Tabs>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive text-sm border-t">
                {error}
              </div>
            )}
          </div>

          {/* Center - Canvas */}
          <div className="flex-1">
            <ProspectCanvas />
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}

export default App;
