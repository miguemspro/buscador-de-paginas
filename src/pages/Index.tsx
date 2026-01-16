import { usePlaybookStore } from '../store/playbookStore';
import UploadStep from '../components/Playbook/UploadStep';
import ProcessingStep from '../components/Playbook/ProcessingStep';
import PlaybookView from '../components/Playbook/PlaybookView';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

function Index() {
  const { currentStep, error, setError, reset } = usePlaybookStore();

  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return <UploadStep />;
      case 'extracting':
      case 'context':
      case 'generating':
        return <ProcessingStep />;
      case 'playbook':
        return <PlaybookView />;
      default:
        return <UploadStep />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {currentStep !== 'playbook' && (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container flex items-center justify-between h-16 px-4">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                SDR ProspectFlow
              </h1>
              <p className="text-xs text-muted-foreground">
                Playbook de Abordagem com IA
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/admin/cases">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
              <div className="text-right text-xs text-muted-foreground">
                <p>Powered by</p>
                <p className="font-semibold text-foreground">Meta IT × IA</p>
              </div>
            </div>
          </div>
        </header>
      )}

      {error && (
        <div className="container px-4 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setError(null);
                  reset();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <main>
        {renderStep()}
      </main>
    </div>
  );
}

export default Index;
