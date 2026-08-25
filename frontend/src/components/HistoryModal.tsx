import React, { useState, useEffect } from 'react';
import { 
  History, 
  X, 
  Trash2, 
  ArrowRight, 
  FileText, 
  Clock, 
  Search, 
  Calendar,
  Layers,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { HistoryItem, AnalysisResponse } from '../types';
import { api } from '../services/api';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHistoryItem: (item: { analysis: AnalysisResponse; raw_text: string }) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectHistoryItem
}) => {
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const items = await api.getHistory();
      setHistoryList(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (id: string) => {
    setLoadingItemId(id);
    try {
      const detail = await api.getHistoryDetail(id);
      onSelectHistoryItem(detail);
      onClose();
    } catch (err) {
      alert('Failed to load history document details.');
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this analysis history record?')) return;
    try {
      await api.deleteHistoryItem(id);
      setHistoryList(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert('Failed to delete history record.');
    }
  };

  if (!isOpen) return null;

  const filtered = historyList.filter(item => 
    item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.summary_preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Analysis History
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Previously processed documents and executive summaries
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

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past analyses by title, category, or summary keywords..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-violet-500 mb-2" />
              <span className="text-xs">Loading history entries...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-semibold">No analyses found</p>
              <p className="text-xs mt-1">Processed documents will automatically appear here.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-600 bg-white/80 dark:bg-slate-800/80 hover:bg-violet-50/30 dark:hover:bg-violet-950/20 cursor-pointer transition flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-violet-500" />
                        Saved {item.time_saved_formatted}
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="p-1 hover:text-red-500 rounded transition opacity-60 hover:opacity-100"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition truncate">
                    {item.filename}
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.summary_preview}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{item.word_count} words • Mode: {item.summary_mode}</span>
                  <div className="flex items-center gap-1 font-semibold text-violet-600 dark:text-violet-400">
                    {loadingItemId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Load Report</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
