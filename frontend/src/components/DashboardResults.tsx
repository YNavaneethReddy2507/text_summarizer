import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Share2, 
  MessageSquare, 
  ListChecks, 
  Key, 
  Cpu, 
  BookOpen, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  ArrowRight,
  Send,
  Loader2,
  Quote,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { 
  AnalysisResponse, 
  QARequest, 
  QAResponse, 
  ExportRequest 
} from '../types';
import { StatsGrid } from './StatsGrid';
import { AudioPlayer } from './AudioPlayer';
import { api } from '../services/api';

interface DashboardResultsProps {
  analysis: AnalysisResponse;
  rawText: string;
  onExport: (format: 'txt' | 'markdown' | 'pdf' | 'docx') => void;
  isExporting: boolean;
}

export const DashboardResults: React.FC<DashboardResultsProps> = ({
  analysis,
  rawText,
  onExport,
  isExporting
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'keypoints' | 'keywords' | 'sentences' | 'qa'>('summary');
  const [summaryView, setSummaryView] = useState<'standard' | 'simplified'>('standard');
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // RAG Q&A State
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaMessages, setQaMessages] = useState<Array<{
    sender: 'user' | 'assistant';
    text: string;
    sources?: any[];
    confidence?: number;
    is_grounded?: boolean;
  }>>([
    {
      sender: 'assistant',
      text: `Hello! I have indexed **${analysis.filename}** (${analysis.chunks_count} chunks). Ask me any specific question and I will answer with verified source citations.`
    }
  ]);

  const handleCopySummary = () => {
    const textToCopy = summaryView === 'simplified' && analysis.simplified_summary 
      ? analysis.simplified_summary 
      : analysis.summary;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskQuestion = async (qText?: string) => {
    const query = qText || question;
    if (!query.trim() || isAsking) return;

    const userMsg = { sender: 'user' as const, text: query };
    setQaMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setIsAsking(true);

    try {
      const res = await api.askQuestion({
        document_text: rawText,
        question: query,
        document_id: analysis.id
      });

      setQaMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: res.answer,
          sources: res.sources,
          confidence: res.confidence,
          is_grounded: res.is_grounded
        }
      ]);
    } catch (err: any) {
      setQaMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `⚠️ Error getting answer: ${err.message || 'Failed to retrieve answer'}`
        }
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const suggestedQuestions = [
    "What is the main problem and objective discussed?",
    "What are the key numerical and quantitative findings?",
    "What are the final strategic recommendations or conclusions?"
  ];

  return (
    <div id="results" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner Overview */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                {analysis.classification.category}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Mode: {analysis.summary_mode.toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                Engine: {analysis.ai_mode_used}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {analysis.filename}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {analysis.classification.reasoning}
            </p>
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-sm transition"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-violet-500" /> : <Download className="w-4 h-4 text-violet-500" />}
              <span>Export Report</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-30 py-1.5 text-xs font-medium">
                <button
                  onClick={() => { onExport('pdf'); setShowExportMenu(false); }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:text-violet-600 flex items-center gap-2"
                >
                  <span className="font-bold text-red-500">PDF</span> Document (.pdf)
                </button>
                <button
                  onClick={() => { onExport('docx'); setShowExportMenu(false); }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:text-violet-600 flex items-center gap-2"
                >
                  <span className="font-bold text-blue-500">DOCX</span> Word (.docx)
                </button>
                <button
                  onClick={() => { onExport('markdown'); setShowExportMenu(false); }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:text-violet-600 flex items-center gap-2"
                >
                  <span className="font-bold text-emerald-500">MD</span> Markdown (.md)
                </button>
                <button
                  onClick={() => { onExport('txt'); setShowExportMenu(false); }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:text-violet-600 flex items-center gap-2"
                >
                  <span className="font-bold text-slate-500">TXT</span> Text (.txt)
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Stats Grid */}
        <div className="mt-5">
          <StatsGrid stats={analysis.stats} classification={analysis.classification} />
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-900/90 rounded-2xl border border-slate-300/60 dark:border-slate-800 text-xs sm:text-sm font-semibold">
        
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'summary'
              ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-md font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Summary & TTS</span>
        </button>

        <button
          onClick={() => setActiveTab('keypoints')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'keypoints'
              ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-md font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          <span>Key Points ({analysis.key_points.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('keywords')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'keywords'
              ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-md font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Keywords & Topics</span>
        </button>

        <button
          onClick={() => setActiveTab('sentences')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'sentences'
              ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-md font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Sentence Heatmap</span>
        </button>

        <button
          onClick={() => setActiveTab('qa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'qa'
              ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-md font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Grounded RAG Q&A</span>
        </button>

      </div>

      {/* Tab 1: AI Summary & TTS */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          
          {/* TTS Audio Player Bar */}
          <AudioPlayer 
            textToRead={
              summaryView === 'simplified' && analysis.simplified_summary 
                ? analysis.simplified_summary 
                : analysis.summary
            }
            title={analysis.filename}
          />

          <div className="glass-panel rounded-2xl p-6 sm:p-8 border">
            
            {/* Header & Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-500"></div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {summaryView === 'simplified' ? 'Simplified Layman Explanation (ELI5)' : 'Executive Summary'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {analysis.simplified_summary && (
                  <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
                    <button
                      onClick={() => setSummaryView('standard')}
                      className={`px-3 py-1 rounded-md transition ${
                        summaryView === 'standard'
                          ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Executive View
                    </button>
                    <button
                      onClick={() => setSummaryView('simplified')}
                      className={`px-3 py-1 rounded-md transition ${
                        summaryView === 'simplified'
                          ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Explain Simply
                    </button>
                  </div>
                )}

                <button
                  onClick={handleCopySummary}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Summary Text Content */}
            <div className="mt-6 text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed space-y-4 font-normal whitespace-pre-line">
              {summaryView === 'simplified' && analysis.simplified_summary 
                ? analysis.simplified_summary 
                : analysis.summary
              }
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: Key Takeaways */}
      {activeTab === 'keypoints' && (
        <div className="glass-panel rounded-2xl p-6 border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Extracted Key Points & Core Findings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                High-centrality declarative takeaways identified by NLP graph clustering
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 rounded-lg">
              {analysis.key_points.length} Key Takeaways
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {analysis.key_points.map((point) => (
              <div 
                key={point.id}
                className="p-4 rounded-xl glass-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/60">
                      {point.category}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      Score: {(point.importance * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                    {point.text}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: `${Math.round(point.importance * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Keywords & Topics */}
      {activeTab === 'keywords' && (
        <div className="space-y-6">
          
          {/* Topics Card */}
          <div className="glass-panel rounded-2xl p-6 border">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Detected Topics & Themes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Semantic clustering based on token distribution and domain dictionaries
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.topics.map((t, idx) => (
                <div key={idx} className="p-4 rounded-xl glass-card">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {t.name}
                    </h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {(t.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    {t.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {t.keywords.map((kw, kIdx) => (
                      <span key={kIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords Card */}
          <div className="glass-panel rounded-2xl p-6 border">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              TF-IDF Salient Keyphrases & Entities
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Weighted by term frequency, inverse document rarity, and positional heuristics
            </p>

            <div className="flex flex-wrap gap-2.5">
              {analysis.keywords.map((kw, idx) => (
                <div 
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-violet-400 dark:hover:border-violet-600 transition"
                >
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {kw.text}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300">
                    {kw.score.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 4: Sentence Heatmap */}
      {activeTab === 'sentences' && (
        <div className="glass-panel rounded-2xl p-6 border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Sentence Graph Centrality & Importance Heatmap
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                TextRank / LexRank eigenvector centrality scores computed for each candidate sentence
              </p>
            </div>
            <span className="text-xs text-slate-500">
              Top Ranked Excerpts
            </span>
          </div>

          <div className="space-y-2.5 mt-4">
            {analysis.extractive_ranked_sentences.map((sent) => (
              <div 
                key={sent.index}
                className={`p-3.5 rounded-xl border transition-all ${
                  sent.is_in_summary
                    ? 'border-violet-300 dark:border-violet-800/80 bg-violet-50/50 dark:bg-violet-950/30 ring-1 ring-violet-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Sentence #{sent.index + 1}
                    </span>
                    {sent.is_in_summary && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-600 text-white">
                        Selected for Summary
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                    Rank Score: {(sent.rank_score * 100).toFixed(1)}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {sent.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Grounded RAG Q&A */}
      {activeTab === 'qa' && (
        <div className="glass-panel rounded-2xl p-6 border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-violet-500" />
                Grounded Document Q&A Assistant
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Indexed into {analysis.chunks_count} chunks. Answers are strictly bounded to source document facts.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              RAG Guardrails Active
            </span>
          </div>

          {/* Quick Suggested Prompts */}
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleAskQuestion(sq)}
                disabled={isAsking}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-slate-700 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-300 border border-slate-200 dark:border-slate-700 transition"
              >
                💬 {sq}
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div className="space-y-4 min-h-[260px] max-h-[460px] overflow-y-auto p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
            {qaMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-violet-600 text-white rounded-br-none shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line font-normal">{msg.text}</p>

                  {/* Sources & Citations if present */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 block">
                        Verified Source Excerpts:
                      </span>
                      {msg.sources.map((src: any, sIdx: number) => (
                        <div 
                          key={sIdx}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300"
                        >
                          <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 mb-1">
                            <span>Chunk #{src.chunk_id + 1}</span>
                            <span className="text-violet-600 dark:text-violet-400">
                              {(src.relevance_score * 100).toFixed(0)}% Match
                            </span>
                          </div>
                          <p className="italic font-serif leading-tight">"{src.text}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isAsking && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 p-2">
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                <span>Searching document chunks and formulating answer...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAskQuestion();
              }}
              placeholder="Ask a question about this document (e.g. 'What were the latency results?')..."
              className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
            <button
              onClick={() => handleAskQuestion()}
              disabled={isAsking || !question.trim()}
              className="p-3 rounded-xl gradient-button text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
