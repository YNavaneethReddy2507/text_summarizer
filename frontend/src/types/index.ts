export type SummaryMode = 'quick' | 'standard' | 'detailed' | 'bullets' | 'executive';
export type AIProvider = 'local' | 'gemini' | 'openai' | 'groq';

export interface DocumentStats {
  word_count: number;
  char_count: number;
  sentence_count: number;
  paragraph_count: number;
  avg_word_length: number;
  avg_sentence_length: number;
  reading_time_min: number;
  reading_time_formatted: string;
  summary_word_count: number;
  summary_reading_time_min: number;
  summary_reading_time_formatted: string;
  time_saved_min: number;
  time_saved_formatted: string;
  compression_ratio: number;
  flesch_reading_ease: number;
  flesch_kincaid_grade: number;
  readability_level: string;
}

export interface KeyPoint {
  id: number;
  category: string;
  text: string;
  importance: number;
}

export interface KeywordItem {
  text: string;
  score: number;
  category?: string | null;
}

export interface TopicItem {
  name: string;
  confidence: number;
  description: string;
  keywords: string[];
}

export interface DocumentClassification {
  category: string;
  confidence: number;
  reasoning: string;
  tone: string;
  sentiment: string;
  sentiment_score: number;
  sentiment_applicable: boolean;
}

export interface ExtractiveSentence {
  index: number;
  text: string;
  rank_score: number;
  is_in_summary: boolean;
}

export interface AnalysisResponse {
  id: string;
  filename: string;
  stats: DocumentStats;
  summary: string;
  simplified_summary?: string | null;
  summary_mode: SummaryMode;
  key_points: KeyPoint[];
  keywords: KeywordItem[];
  topics: TopicItem[];
  classification: DocumentClassification;
  extractive_ranked_sentences: ExtractiveSentence[];
  chunks_count: number;
  created_at: string;
  ai_mode_used: string;
}

export interface QASourceChunk {
  chunk_id: number;
  text: string;
  relevance_score: number;
  page_or_section?: string | null;
}

export interface QARequest {
  document_text: string;
  question: string;
  document_id?: string | null;
  api_key?: string | null;
  provider?: AIProvider;
}

export interface QAResponse {
  question: string;
  answer: string;
  sources: QASourceChunk[];
  is_grounded: boolean;
  confidence: number;
  engine_used: string;
}

export interface HistoryItem {
  id: string;
  filename: string;
  created_at: string;
  word_count: number;
  category: string;
  summary_preview: string;
  summary_mode: string;
  time_saved_formatted: string;
}

export interface BuiltinSample {
  id: string;
  title: string;
  category: string;
  filename: string;
  text: string;
}

export interface ExportRequest {
  format: 'txt' | 'markdown' | 'pdf' | 'docx';
  title: string;
  filename: string;
  summary: string;
  simplified_summary?: string | null;
  key_points: string[];
  keywords: string[];
  topics: string[];
  stats?: Record<string, any> | null;
  qa_history?: Array<{ question: string; answer: string }> | null;
}
