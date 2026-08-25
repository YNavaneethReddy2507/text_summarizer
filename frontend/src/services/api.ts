import {
  AnalysisResponse,
  BuiltinSample,
  ExportRequest,
  HistoryItem,
  QARequest,
  QAResponse,
  SummaryMode,
  AIProvider
} from '../types';

const API_BASE = 'http://localhost:8000/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export const api = {
  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getSamples(): Promise<BuiltinSample[]> {
    const res = await fetch(`${API_BASE}/samples`);
    if (!res.ok) {
      throw new ApiError('Failed to fetch sample documents', res.status);
    }
    return res.json();
  },

  async analyzeText(payload: {
    text: string;
    filename?: string;
    mode: SummaryMode;
    reading_speed_wpm: number;
    explain_simply: boolean;
    api_key?: string;
    provider: AIProvider;
  }): Promise<AnalysisResponse> {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Analysis failed' }));
      throw new ApiError(err.detail || 'Analysis failed', res.status);
    }
    return res.json();
  },

  async uploadFile(payload: {
    file: File;
    mode: SummaryMode;
    reading_speed_wpm: number;
    explain_simply: boolean;
    api_key?: string;
    provider: AIProvider;
  }): Promise<AnalysisResponse> {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('mode', payload.mode);
    formData.append('reading_speed_wpm', payload.reading_speed_wpm.toString());
    formData.append('explain_simply', payload.explain_simply.toString());
    formData.append('provider', payload.provider);
    if (payload.api_key) {
      formData.append('api_key', payload.api_key);
    }

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new ApiError(err.detail || 'File analysis failed', res.status);
    }
    return res.json();
  },

  async askQuestion(payload: QARequest): Promise<QAResponse> {
    const res = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Q&A failed' }));
      throw new ApiError(err.detail || 'Q&A query failed', res.status);
    }
    return res.json();
  },

  async getHistory(): Promise<HistoryItem[]> {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) {
      throw new ApiError('Failed to fetch history', res.status);
    }
    return res.json();
  },

  async getHistoryDetail(id: string): Promise<{ analysis: AnalysisResponse; raw_text: string }> {
    const res = await fetch(`${API_BASE}/history/${id}`);
    if (!res.ok) {
      throw new ApiError('History item not found', res.status);
    }
    return res.json();
  },

  async deleteHistoryItem(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new ApiError('Failed to delete history item', res.status);
    }
  },

  async exportAnalysis(payload: ExportRequest): Promise<Blob> {
    const res = await fetch(`${API_BASE}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new ApiError('Export generation failed', res.status);
    }
    return res.blob();
  }
};
