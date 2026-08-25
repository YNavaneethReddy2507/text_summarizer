import React from 'react';
import { 
  FileText, 
  Clock, 
  Percent, 
  BookOpen, 
  BarChart3, 
  Zap, 
  CheckCircle,
  TrendingDown,
  Activity
} from 'lucide-react';
import { DocumentStats, DocumentClassification } from '../types';

interface StatsGridProps {
  stats: DocumentStats;
  classification: DocumentClassification;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, classification }) => {
  const compressionPercent = Math.round(stats.compression_ratio * 100);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      
      {/* 1. Time Saved */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-200/80 dark:border-violet-800/60 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
            Time Saved
          </span>
          <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.time_saved_formatted}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {stats.summary_reading_time_formatted} vs {stats.reading_time_formatted}
          </div>
        </div>
      </div>

      {/* 2. Compression Ratio */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            Compression
          </span>
          <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {compressionPercent}%
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {stats.summary_word_count} / {stats.word_count} words
          </div>
        </div>
      </div>

      {/* 3. Readability Level */}
      <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Readability
          </span>
          <BookOpen className="w-4 h-4 text-blue-500" />
        </div>
        <div className="mt-2">
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate" title={stats.readability_level}>
            {stats.readability_level.split('(')[0]}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Flesch Ease: {stats.flesch_reading_ease.toFixed(1)} (Gr. {stats.flesch_kincaid_grade.toFixed(1)})
          </div>
        </div>
      </div>

      {/* 4. Sentences & Paragraphs */}
      <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Sentences
          </span>
          <BarChart3 className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.sentence_count}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {stats.paragraph_count} paragraphs ({stats.avg_sentence_length.toFixed(1)} w/s)
          </div>
        </div>
      </div>

      {/* 5. Classification Tone */}
      <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tone & Style
          </span>
          <Activity className="w-4 h-4 text-purple-500" />
        </div>
        <div className="mt-2">
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
            {classification.tone}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Sentiment: {classification.sentiment}
          </div>
        </div>
      </div>

      {/* 6. Document Domain */}
      <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Category
          </span>
          <CheckCircle className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="mt-2">
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate" title={classification.category}>
            {classification.category}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {(classification.confidence * 100).toFixed(0)}% confidence
          </div>
        </div>
      </div>

    </div>
  );
};
