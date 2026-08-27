import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  SummaryMode, 
  AIProvider, 
  BuiltinSample, 
  AnalysisResponse 
} from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { HeroLanding } from './components/HeroLanding';
import { InputWorkspace } from './components/InputWorkspace';
import { DashboardResults } from './components/DashboardResults';
import { HistoryModal } from './components/HistoryModal';
import { ExplainabilityModal } from './components/ExplainabilityModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Footer } from './components/Footer';

export function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('contextai_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Backend Health & Samples
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(true);
  const [samples, setSamples] = useState<BuiltinSample[]>([]);

  // Input & Configuration state
  const [inputText, setInputText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filename, setFilename] = useState<string>('Document');
  const [summaryMode, setSummaryMode] = useState<SummaryMode>('standard');
  const [explainSimply, setExplainSimply] = useState<boolean>(false);
  const [readingSpeedWpm, setReadingSpeedWpm] = useState<number>(220);
  const [aiProvider, setAiProvider] = useState<AIProvider>('local');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('contextai_apikey') || '');

  // Analysis Lifecycle state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStage, setAnalysisStage] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [activeRawText, setActiveRawText] = useState<string>('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Modals
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isExplainabilityOpen, setIsExplainabilityOpen] = useState<boolean>(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState<boolean>(false);

  // Sync theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('contextai_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('contextai_theme', 'light');
    }
  }, [darkMode]);

  // Sync API Key
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('contextai_apikey', apiKey);
    } else {
      localStorage.removeItem('contextai_apikey');
    }
  }, [apiKey]);

  // Initial Load: Health check & samples
  useEffect(() => {
    const init = async () => {
      const healthy = await api.healthCheck();
      setIsBackendHealthy(healthy);
      if (healthy) {
        try {
          const sampleList = await api.getSamples();
          setSamples(sampleList);
        } catch (err) {
          console.warn('Could not load samples:', err);
        }
      }
    };
    init();
  }, []);

  const handleSelectSample = (sample: BuiltinSample) => {
    setInputText(sample.text);
    setSelectedFile(null);
    setFilename(sample.filename);
    scrollToWorkspace();
  };

  const scrollToWorkspace = () => {
    const el = document.getElementById('workspace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToResults = () => {
    setTimeout(() => {
      const el = document.getElementById('results');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && !selectedFile) {
      setErrorBanner('Please provide text or upload a document before analyzing.');
      return;
    }

    setErrorBanner(null);
    setIsAnalyzing(true);
    setAnalysisStage('Parsing document...');

    // Progress animation stages
    const timer1 = setTimeout(() => setAnalysisStage('Extracting TextRank sentence graph...'), 600);
    const timer2 = setTimeout(() => setAnalysisStage('Clustering topics & TF-IDF keywords...'), 1200);
    const timer3 = setTimeout(() => setAnalysisStage('Synthesizing executive summary...'), 1800);

    try {
      let result: AnalysisResponse;
      let rawContent = inputText;

      if (selectedFile) {
        result = await api.uploadFile({
          file: selectedFile,
          mode: summaryMode,
          reading_speed_wpm: readingSpeedWpm,
          explain_simply: explainSimply,
          api_key: apiKey || undefined,
          provider: aiProvider
        });
        rawContent = `[Extracted from ${selectedFile.name}]\n\n${result.summary}`;
      } else {
        result = await api.analyzeText({
          text: inputText,
          filename: filename || 'Document',
          mode: summaryMode,
          reading_speed_wpm: readingSpeedWpm,
          explain_simply: explainSimply,
          api_key: apiKey || undefined,
          provider: aiProvider
        });
      }

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      setAnalysisResult(result);
      setActiveRawText(rawContent);

      // Trigger Confetti celebratory celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.85 }
        });
      } catch (e) {
        // ignore confetti errors if any
      }

      scrollToResults();
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setErrorBanner(err.message || 'An error occurred while analyzing the document.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStage('');
    }
  };

  const handleExport = async (format: 'txt' | 'markdown' | 'pdf' | 'docx') => {
    if (!analysisResult) return;
    setIsExporting(true);

    try {
      const blob = await api.exportAnalysis({
        format,
        title: `ContextAI Analysis: ${analysisResult.filename}`,
        filename: analysisResult.filename.replace(/\.[^/.]+$/, ''),
        summary: analysisResult.summary,
        simplified_summary: analysisResult.simplified_summary,
        key_points: analysisResult.key_points.map(kp => `${kp.category}: ${kp.text}`),
        keywords: analysisResult.keywords.map(kw => kw.text),
        topics: analysisResult.topics.map(t => `${t.name} (${(t.confidence * 100).toFixed(0)}%)`),
        stats: analysisResult.stats as any
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ContextAI_Summary_${analysisResult.filename.replace(/\.[^/.]+$/, '')}.${format === 'markdown' ? 'md' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Export failed: ${err.message || 'Error generating export file'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectHistoryItem = (item: { analysis: AnalysisResponse; raw_text: string }) => {
    setAnalysisResult(item.analysis);
    setActiveRawText(item.raw_text);
    setInputText(item.raw_text);
    setFilename(item.analysis.filename);
    scrollToResults();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Navigation Header */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isBackendHealthy={isBackendHealthy}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenExplainability={() => setIsExplainabilityOpen(true)}
        onOpenApiKey={() => setIsApiKeyOpen(true)}
        onScrollToWorkspace={scrollToWorkspace}
      />

      {/* Main Container */}
      <main className="flex-1">
        
        {/* Error Alert Banner */}
        {errorBanner && (
          <div className="max-w-4xl mx-auto px-4 mt-4">
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center justify-between">
              <span>{errorBanner}</span>
              <button 
                onClick={() => setErrorBanner(null)}
                className="font-bold text-red-500 hover:text-red-700 ml-4"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <HeroLanding
          samples={samples}
          onSelectSample={handleSelectSample}
          onScrollToWorkspace={scrollToWorkspace}
        />

        {/* Ingestion & Configuration Workspace */}
        <InputWorkspace
          inputText={inputText}
          setInputText={setInputText}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          filename={filename}
          setFilename={setFilename}
          summaryMode={summaryMode}
          setSummaryMode={setSummaryMode}
          explainSimply={explainSimply}
          setExplainSimply={setExplainSimply}
          readingSpeedWpm={readingSpeedWpm}
          setReadingSpeedWpm={setReadingSpeedWpm}
          aiProvider={aiProvider}
          setAiProvider={setAiProvider}
          apiKey={apiKey}
          isAnalyzing={isAnalyzing}
          analysisStage={analysisStage}
          onAnalyze={handleAnalyze}
          samples={samples}
          onSelectSample={handleSelectSample}
        />

        {/* Comprehensive Analysis Dashboard Results */}
        {analysisResult && (
          <DashboardResults
            analysis={analysisResult}
            rawText={activeRawText || inputText}
            onExport={handleExport}
            isExporting={isExporting}
          />
        )}

      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectHistoryItem={handleSelectHistoryItem}
      />

      <ExplainabilityModal
        isOpen={isExplainabilityOpen}
        onClose={() => setIsExplainabilityOpen(false)}
      />

      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        aiProvider={aiProvider}
        setAiProvider={setAiProvider}
      />

    </div>
  );
}

export default App;
