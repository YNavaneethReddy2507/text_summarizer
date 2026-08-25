import React from 'react';
import { 
  BookOpen, 
  X, 
  BrainCircuit, 
  Key, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  CheckCircle,
  HelpCircle,
  Activity
} from 'lucide-react';

interface ExplainabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                How DocuMind AI Works: Architecture & Algorithms
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transparent breakdown of our NLP pipeline, graph centrality, and grounded RAG models
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
          
          {/* Section 1: Extractive Graph Summarization */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-sm">
              <Cpu className="w-4 h-4" />
              <h4>1. TextRank / LexRank Graph Centrality</h4>
            </div>
            <p className="leading-relaxed">
              Unlike simplistic truncation, DocuMind constructs a <strong>fully connected graph</strong> where each sentence is a node. Edges represent semantic cosine similarity weighted by TF-IDF token overlap.
            </p>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 font-mono text-[11px] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
              PR(S_i) = (1 - d) + d * Σ [ Sim(S_i, S_j) / Σ Sim(S_j, S_k) * PR(S_j) ]
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              This eigenvector calculation preserves high-information thesis sentences, numerical data, and structural conclusions while filtering redundancy.
            </p>
          </div>

          {/* Section 2: TF-IDF & Topic Modeling */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              <Key className="w-4 h-4" />
              <h4>2. TF-IDF & Semantic Topic Clustering</h4>
            </div>
            <p className="leading-relaxed">
              Keywords are extracted using multi-word n-gram TF-IDF combined with positional decay weighting. Topic modeling classifies the document into domains (Academic, Engineering, Financial, Medical, News, General) with confidence scoring.
            </p>
          </div>

          {/* Section 3: Readability Formulas */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
              <Activity className="w-4 h-4" />
              <h4>3. Flesch-Kincaid & Reading Time Analytics</h4>
            </div>
            <p className="leading-relaxed">
              Computes syllable distribution, word lengths, and sentence complexity using empirical formulas:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                Reading Ease: 206.835 - 1.015(ASL) - 84.6(ASW)
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                Grade Level: 0.39(ASL) + 11.8(ASW) - 15.59
              </div>
            </div>
          </div>

          {/* Section 4: Grounded RAG & Anti-Hallucination */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <h4>4. Grounded RAG (Retrieval-Augmented Generation)</h4>
            </div>
            <p className="leading-relaxed">
              Documents are indexed into overlapping chunks (500 characters with 100 character overlap). When you ask a question:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 text-xs">
              <li>Relevant chunks are retrieved via TF-IDF / Dense cosine similarity.</li>
              <li>Answers are synthesized strictly using retrieved evidence.</li>
              <li>Every answer includes clickable source chunk citations for verification.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold gradient-button text-white"
          >
            Got it, thanks!
          </button>
        </div>

      </div>
    </div>
  );
};
