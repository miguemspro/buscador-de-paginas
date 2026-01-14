import { useState } from 'react';
import { Sparkles, Copy, Check, Loader2 } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { useConversationStore } from '../../store/conversationStore';
import { openAIService } from '../../services/openai.service';

const AIPanel = () => {
  const { selectedNodeId, nodes, updateNode } = useCanvasStore();
  const { getContext } = useConversationStore();

  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string>('');
  const [reasoning, setReasoning] = useState<string>('');
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const generateSuggestion = async () => {
    if (!selectedNode) return;

    if (!customPrompt.trim()) {
      alert('Por favor, digite um prompt personalizado antes de gerar sugestões.');
      return;
    }

    setIsLoading(true);
    setSuggestion('');
    setReasoning('');
    setAlternatives([]);

    try {
      const context = getContext();
      const result = await openAIService.generateSuggestions(
        context,
        selectedNode.data.title,
        customPrompt
      );

      setSuggestion(result.suggestion);
      setReasoning(result.reasoning);
      setAlternatives(result.alternatives);
    } catch (error) {
      console.error('Erro ao gerar sugestão:', error);
      setSuggestion('Erro ao gerar sugestão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleUse = (text: string) => {
    if (!selectedNode) return;
    updateNode(selectedNode.id, { content: text });
  };

  if (!selectedNode) {
    return (
      <div className="w-96 bg-gradient-to-br from-purple-50 to-white border-l border-purple-200 p-4 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Sparkles size={48} className="mx-auto mb-2 opacity-30 animate-pulse" />
          <p className="text-sm font-medium">Selecione um nó para ver sugestões da IA</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-gradient-to-br from-white to-purple-50 border-l border-purple-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Sparkles size={24} className="text-purple-500 animate-pulse" />
          Sugestões IA
        </h2>
        <button
          onClick={generateSuggestion}
          disabled={isLoading || !customPrompt.trim()}
          className="text-sm bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          title={!customPrompt.trim() ? 'Digite um prompt primeiro' : 'Gerar sugestões'}
        >
          {isLoading ? '⏳ Gerando...' : '✨ Gerar'}
        </button>
      </div>

      {/* Nó Selecionado */}
      <div className="mb-4 p-3 bg-white rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-1">
          {selectedNode.data.icon && (
            <span className="text-lg">{selectedNode.data.icon}</span>
          )}
          <h3 className="font-semibold text-sm text-gray-800">
            {selectedNode.data.title}
          </h3>
        </div>
        {selectedNode.data.methodology && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
            {selectedNode.data.methodology}
          </span>
        )}
      </div>

      {/* Campo de Prompt Personalizado */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Prompt Personalizado
        </label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Digite aqui instruções específicas para a IA... Ex: 'Foque em benefícios financeiros' ou 'Inclua exemplos do setor bancário'"
          className="w-full h-28 p-3 border-2 border-purple-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">
          💡 Digite um prompt específico para gerar sugestões personalizadas
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 size={48} className="animate-spin text-purple-500 mb-4" />
          <p className="text-sm text-gray-600 font-medium">✨ Gerando sugestões mágicas...</p>
        </div>
      )}

      {/* Sugestão Principal */}
      {!isLoading && suggestion && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-purple-900 text-sm">
                Sugestão Principal
              </h4>
              <div className="flex gap-1">
                <button
                  onClick={() => handleCopy(suggestion, 0)}
                  className="p-1 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                  title="Copiar"
                >
                  {copiedIndex === 0 ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-800 whitespace-pre-wrap mb-3">
              {suggestion}
            </p>

            {reasoning && (
              <div className="mt-3 pt-3 border-t border-purple-200">
                <p className="text-xs text-purple-700 italic">{reasoning}</p>
              </div>
            )}

            <button
              onClick={() => handleUse(suggestion)}
              className="w-full mt-3 bg-purple-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-600 transition-all duration-200 hover:shadow-lg hover:scale-105 text-sm"
            >
              ✅ Usar esta sugestão
            </button>
          </div>

          {/* Alternativas */}
          {alternatives.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 text-sm mb-2">
                Alternativas
              </h4>

              <div className="space-y-3">
                {alternatives.map((alt, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-md p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500">
                        Opção {index + 1}
                      </span>
                      <button
                        onClick={() => handleCopy(alt, index + 1)}
                        className="p-1 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        title="Copiar"
                      >
                        {copiedIndex === index + 1 ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>

                    <p className="text-sm text-gray-800 whitespace-pre-wrap mb-2">
                      {alt}
                    </p>

                    <button
                      onClick={() => handleUse(alt)}
                      className="w-full bg-purple-100 text-purple-700 py-1 px-3 rounded-lg text-xs hover:bg-purple-200 transition-all duration-200 hover:scale-105 font-medium"
                    >
                      ✅ Usar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estado inicial */}
      {!isLoading && !suggestion && (
        <div className="text-center text-gray-400 py-12">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Digite um prompt e clique em "Gerar"</p>
          <p className="text-xs mt-2">A IA só gerará quando você solicitar</p>
        </div>
      )}
    </div>
  );
};

export default AIPanel;
