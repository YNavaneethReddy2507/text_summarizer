import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  Sliders, 
  HelpCircle, 
  Clock, 
  Layers, 
  X, 
  Check, 
  ArrowRight, 
  Cpu, 
  FileCode,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { SummaryMode, AIProvider, BuiltinSample } from '../types';

interface InputWorkspaceProps {
  inputText: string;
  setInputText: (text: string) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  filename: string;
  setFilename: (name: string) => void;
  summaryMode: SummaryMode;
  setSummaryMode: (mode: SummaryMode) => void;
  explainSimply: boolean;
  setExplainSimply: (val: boolean) => void;
  readingSpeedWpm: number;
  setReadingSpeedWpm: (speed: number) => void;
  aiProvider: AIProvider;
  setAiProvider: (provider: AIProvider) => void;
  apiKey: string;
  isAnalyzing: boolean;
  analysisStage: string;
  onAnalyze: () => void;
  samples: BuiltinSample[];
  onSelectSample: (sample: BuiltinSample) => void;
}

export const InputWorkspace: React.FC<InputWorkspaceProps> = ({
  inputText,
  setInputText,
  selectedFile,
  setSelectedFile,
  filename,
  setFilename,
  summaryMode,
  setSummaryMode,
  explainSimply,
  setExplainSimply,
  readingSpeedWpm,
  setReadingSpeedWpm,
  aiProvider,
  setAiProvider,
  apiKey,
  isAnalyzing,
  analysisStage,
  onAnalyze,
  samples,
  onSelectSample
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'upload'>('text');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick word & reading time estimate for input
  const words = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const chars = inputText.length;
  const estimatedReadMin = Math.max(0.1, +(words / readingSpeedWpm).toFixed(1));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilename(file.name);
      setActiveTab('upload');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setFilename(file.name);
      setActiveTab('upload');
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilename('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePasteDemo = () => {
    if (samples.length > 0) {
      onSelectSample(samples[0]);
    }
  };

  const modes: { id: SummaryMode; label: string; desc: string }[] = [
    { id: 'quick', label: 'Quick Snapshot', desc: '3-4 core punchy sentences' },
    { id: 'standard', label: 'Standard', desc: '~15-20% length with balanced context' },
    { id: 'detailed', label: 'In-Depth', desc: '~35% length preserving technical metrics' },
    { id: 'bullets', label: 'Key Bullets', desc: 'Scannable bullet takeaways' },
    { id: 'executive', label: 'Executive Brief', desc: 'Background, Findings & Recommendations' },
  ];

  return (
    <div id="workspace" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="glass-panel rounded-2xl p-5 sm:p-7 border transition-all">
        
        {/* Header & Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              Document Ingestion & Configuration
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Paste text directly or upload PDF, DOCX, TXT, or Markdown documents.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm font-medium">
            <button
              onClick={() => setActiveTab('text')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'text'
                  ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Direct Text</span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
              {selectedFile && (
                <span className="w-2 h-2 rounded-full bg-violet-500"></span>
              )}
            </button>
          </div>
        </div>

        {/* Ingestion Section */}
        <div className="mt-5">
          {activeTab === 'text' ? (
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (selectedFile) setSelectedFile(null);
                }}
                placeholder="Paste your document content, research paper, article, or meeting notes here (minimum 15 characters)..."
                rows={8}
                className="w-full p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition text-sm sm:text-base leading-relaxed resize-y font-normal"
              />

              {/* Text Area Toolbar & Badges */}
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    <span className="text-slate-900 dark:text-slate-200 font-semibold">{words}</span> words
                  </span>
                  <span>•</span>
                  <span>
                    <span className="text-slate-900 dark:text-slate-200 font-semibold">{chars}</span> characters
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-violet-500" />
                    <span>~{estimatedReadMin} min read</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {inputText && (
                    <button
                      onClick={() => setInputText('')}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={handlePasteDemo}
                    className="px-2.5 py-1 text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded border border-violet-200 dark:border-violet-800/80 transition"
                  >
                    Load Sample Document
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/30 scale-[0.99]'
                    : selectedFile
                    ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-600 bg-slate-50/40 dark:bg-slate-900/40'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-3 shadow-inner">
                      <FileText className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedFile.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                        Selected
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFile();
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-300 flex items-center justify-center mb-3 shadow-inner">
                      <UploadCloud className="w-7 h-7 animate-bounce" style={{ animationDuration: '3s' }} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Drop your document here, or <span className="text-violet-600 dark:text-violet-400 underline">browse</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Supports PDF, DOCX, TXT, and Markdown files up to 25 MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Analysis Configuration Controls */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Summary Mode Selector */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              Summary Mode & Length
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSummaryMode(m.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    summaryMode === m.id
                      ? 'border-violet-500 bg-violet-50/80 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200 ring-2 ring-violet-500/20'
                      : 'border-slate-200 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="text-xs font-bold leading-tight">{m.label}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Engine & Simplify Options */}
          <div className="flex flex-col justify-between gap-3 bg-slate-50/80 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            
            {/* Explain Simply Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Explain Simply (ELI5)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Plain layman language transformation
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExplainSimply(!explainSimply)}
                className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  explainSimply ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    explainSimply ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Reading Speed Slider */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Reading Speed:</span>
                <span className="font-semibold text-violet-600 dark:text-violet-400">{readingSpeedWpm} WPM</span>
              </div>
              <input
                type="range"
                min="120"
                max="400"
                step="10"
                value={readingSpeedWpm}
                onChange={(e) => setReadingSpeedWpm(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>120 (Casual)</span>
                <span>220 (Avg)</span>
                <span>400 (Speed)</span>
              </div>
            </div>

          </div>

        </div>

        {/* Action Button & Progress Indicator */}
        <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Cpu className="w-4 h-4 text-violet-500" />
            <span>AI Engine: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{aiProvider === 'local' ? 'Local TextRank Graph NLP' : aiProvider.toUpperCase()}</strong></span>
          </div>

          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || (!inputText.trim() && !selectedFile)}
            className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white transition-all shadow-lg ${
              isAnalyzing || (!inputText.trim() && !selectedFile)
                ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-70 shadow-none'
                : 'gradient-button'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>{analysisStage || 'Analyzing Document...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Intelligence & Summary</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
};
