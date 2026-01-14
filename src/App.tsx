import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TemplateSidebar from './components/Sidebar/TemplateSidebar';
import ProspectCanvas from './components/Canvas/ProspectCanvas';
import AIPanel from './components/Sidebar/AIPanel';

function App() {
  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">SDR ProspectFlow</h1>
              <p className="text-sm text-blue-100">
                Ferramenta de Prospecção Consultiva com IA
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-blue-100">Powered by</p>
                <p className="font-semibold">Meta IT × GPT-4</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Templates */}
          <TemplateSidebar />

          {/* Center - Canvas */}
          <div className="flex-1">
            <ProspectCanvas />
          </div>

          {/* Right Sidebar - AI Suggestions */}
          <AIPanel />
        </div>
      </div>
    </ReactFlowProvider>
  );
}

export default App;
