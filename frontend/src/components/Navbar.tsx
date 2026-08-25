import React from 'react';
import { 
  FileText, 
  Sparkles, 
  Moon, 
  Sun, 
  History, 
  Sliders, 
  KeyRound, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isBackendHealthy: boolean;
  onOpenHistory: () => void;
  onOpenExplainability: () => void;
  onOpenApiKey: () => void;
  onScrollToWorkspace: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  setDarkMode,
  isBackendHealthy,
  onOpenHistory,
  onOpenExplainability,
  onOpenApiKey,
  onScrollToWorkspace,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/75 dark:bg-[#0b0f17]/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div 
          onClick={onScrollToWorkspace}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                DocuMind<span className="text-violet-600 dark:text-violet-400">.AI</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 rounded border border-violet-200 dark:border-violet-800">
                PRO NLP
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5 hidden sm:block">
              Read Less. Understand More.
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Backend Status Indicator */}
          <div 
            title={isBackendHealthy ? "Backend NLP Engine Connected" : "Backend Disconnected (Run python -m uvicorn)"}
            className={`hidden md:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
              isBackendHealthy 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60"
            }`}
          >
            {isBackendHealthy ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Engine Active</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Engine Offline</span>
              </>
            )}
          </div>

          {/* Algorithm Explainability Modal Trigger */}
          <button
            onClick={onOpenExplainability}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <BookOpen className="w-4 h-4 text-violet-500" />
            <span className="hidden sm:inline">How AI Works</span>
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* AI Settings / Keys */}
          <button
            onClick={onOpenApiKey}
            title="Configure AI Models & Keys"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle Dark Mode"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Quick CTA */}
          <button
            onClick={onScrollToWorkspace}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm px-3.5 py-1.5 rounded-lg font-medium gradient-button"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyze Doc</span>
          </button>
        </div>
      </div>
    </header>
  );
};
