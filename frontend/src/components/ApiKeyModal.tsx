import React, { useState } from 'react';
import { 
  KeyRound, 
  X, 
  ShieldCheck, 
  Cpu, 
  Check, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { AIProvider } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  aiProvider: AIProvider;
  setAiProvider: (provider: AIProvider) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  aiProvider,
  setAiProvider
}) => {
  const [tempKey, setTempKey] = useState(apiKey);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(tempKey.trim());
    onClose();
  };

  const providers: { id: AIProvider; name: string; tag: string; desc: string }[] = [
    {
      id: 'local',
      name: 'Local Graph NLP Engine',
      tag: '100% Free & Private',
      desc: 'Built-in TextRank + TF-IDF + LexRank graph centrality. Runs directly without API keys.'
    },
    {
      id: 'gemini',
      name: 'Google Gemini 2.0 / 1.5 Flash',
      tag: 'Requires API Key',
      desc: 'High-speed generative abstractive summarization & deep reasoning.'
    },
    {
      id: 'openai',
      name: 'OpenAI GPT-4o / GPT-4o-mini',
      tag: 'Requires API Key',
      desc: 'Standard enterprise LLM summarization and question answering.'
    },
    {
      id: 'groq',
      name: 'Groq Llama 3.3 70B',
      tag: 'Requires API Key',
      desc: 'Ultra-low latency LPU inference with state-of-the-art open models.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                AI Engine & Key Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose between local extractive NLP or cloud generative models
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Providers */}
        <div className="p-6 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Select AI Provider
          </label>

          <div className="space-y-2">
            {providers.map((p) => (
              <div
                key={p.id}
                onClick={() => setAiProvider(p.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  aiProvider === p.id
                    ? 'border-violet-500 bg-violet-50/70 dark:bg-violet-950/40 ring-1 ring-violet-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {p.name}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    p.id === 'local' 
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {p.tag}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>

          {/* API Key Input (if not local) */}
          {aiProvider !== 'local' && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {aiProvider.toUpperCase()} API Key:
              </label>
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder={`Enter your ${aiProvider} API key...`}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              />
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Your key stays stored solely in local browser memory and is never logged.</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold gradient-button text-white"
          >
            Save Configuration
          </button>
        </div>

      </div>
    </div>
  );
};
