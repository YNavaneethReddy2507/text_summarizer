import React from 'react';
import { Shield, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 mt-16 bg-white/50 dark:bg-[#0b0f17]/50 backdrop-blur-md py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
            CA
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            ContextAI
          </span>
          <span>— Intelligent Document Summarization & NLP Suite</span>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-violet-500" />
            <span>FastAPI + React 19 + TypeScript</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Local NLP Privacy</span>
          </span>
        </div>

      </div>
    </footer>
  );
};
