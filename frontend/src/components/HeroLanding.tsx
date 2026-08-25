import React from 'react';
import { 
  Sparkles, 
  Clock, 
  BrainCircuit, 
  FileCheck2, 
  ShieldCheck, 
  Layers, 
  ArrowRight,
  Zap,
  Volume2,
  MessageSquareCode
} from 'lucide-react';
import { BuiltinSample } from '../types';

interface HeroLandingProps {
  samples: BuiltinSample[];
  onSelectSample: (sample: BuiltinSample) => void;
  onScrollToWorkspace: () => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({
  samples,
  onSelectSample,
  onScrollToWorkspace
}) => {
  return (
    <section className="relative overflow-hidden pt-10 pb-12 sm:pt-14 sm:pb-16">
      {/* Background glowing gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-violet-600/15 via-indigo-500/15 to-purple-500/10 blur-3xl pointer-events-none rounded-full" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100/80 dark:bg-violet-950/60 border border-violet-200/80 dark:border-violet-800/60 text-xs font-semibold text-violet-700 dark:text-violet-300 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Next-Generation AI Document Intelligence & NLP Suite</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.15]">
          Read Less. <span className="gradient-text">Understand More.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Transform long PDFs, DOCX files, reports, and articles into executive summaries, key takeaways, readability metrics, and interactive grounded Q&A in seconds.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <button
            onClick={onScrollToWorkspace}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold gradient-button shadow-lg shadow-violet-500/25 group"
          >
            <span>Start Document Analysis</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Quick Sample Selector Bar */}
        {samples.length > 0 && (
          <div className="mt-10 max-w-3xl mx-auto">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-center gap-1.5 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Or try an instant sample benchmark:</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {samples.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => onSelectSample(sample)}
                  className="text-xs px-3.5 py-2 rounded-lg bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:border-violet-400 dark:hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/30 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                  <span className="font-medium truncate max-w-[220px]">{sample.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feature Spotlight Badges */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-left">
          
          <div className="p-4 rounded-xl glass-card">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-300 flex items-center justify-center mb-2.5">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">80%+ Time Saved</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Calculates exact reading efficiency & time compression.</p>
          </div>

          <div className="p-4 rounded-xl glass-card">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 flex items-center justify-center mb-2.5">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">TextRank Graph NLP</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Mathematical sentence centrality & TF-IDF topic modeling.</p>
          </div>

          <div className="p-4 rounded-xl glass-card">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 flex items-center justify-center mb-2.5">
              <MessageSquareCode className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Grounded RAG Q&A</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ask anything with chunk-level source citations.</p>
          </div>

          <div className="p-4 rounded-xl glass-card">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-2.5">
              <Volume2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Text-to-Speech</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Listen on the go with adjustable audio speeds.</p>
          </div>

        </div>

      </div>
    </section>
  );
};
