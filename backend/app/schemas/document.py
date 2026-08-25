from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class SummaryMode(str, Enum):
    QUICK = "quick"
    STANDARD = "standard"
    DETAILED = "detailed"
    BULLETS = "bullets"
    EXECUTIVE = "executive"


class AIProvider(str, Enum):
    LOCAL = "local"
    GEMINI = "gemini"
    OPENAI = "openai"
    GROQ = "groq"


class AnalysisRequest(BaseModel):
    text: str = Field(..., description="Document raw or extracted text")
    filename: Optional[str] = Field("pasted_text.txt", description="Document filename")
    mode: SummaryMode = Field(SummaryMode.STANDARD, description="Summarization mode")
    reading_speed_wpm: int = Field(220, ge=100, le=500, description="Average reading speed in words per minute")
    explain_simply: bool = Field(False, description="Whether to also generate simplified layman explanation")
    api_key: Optional[str] = Field(None, description="Optional LLM API Key (Gemini, OpenAI, Groq)")
    provider: AIProvider = Field(AIProvider.LOCAL, description="AI Provider to use")


class DocumentStats(BaseModel):
    word_count: int
    char_count: int
    sentence_count: int
    paragraph_count: int
    avg_word_length: float
    avg_sentence_length: float
    reading_time_min: float
    reading_time_formatted: str
    summary_word_count: int
    summary_reading_time_min: float
    summary_reading_time_formatted: str
    time_saved_min: float
    time_saved_formatted: str
    compression_ratio: float  # e.g., 0.82 for 82% reduction
    flesch_reading_ease: float
    flesch_kincaid_grade: float
    readability_level: str  # e.g., "Standard (High School)", "Fairly Difficult (College)"


class KeyPoint(BaseModel):
    id: int
    category: str  # "Core Theme", "Major Finding", "Key Argument", "Conclusion", "Insight"
    text: str
    importance: float  # 0.0 to 1.0


class KeywordItem(BaseModel):
    text: str
    score: float
    category: Optional[str] = None


class TopicItem(BaseModel):
    name: str
    confidence: float  # 0.0 to 1.0
    description: str
    keywords: List[str] = []


class DocumentClassification(BaseModel):
    category: str  # "Academic & Research", "Technical & Engineering", "Business & Finance", "News & Media", "Educational", "General"
    confidence: float
    reasoning: str
    tone: str  # "Analytical", "Objective", "Persuasive", "Informative", "Formal"
    sentiment: str  # "Neutral", "Positive", "Negative"
    sentiment_score: float
    sentiment_applicable: bool


class ExtractiveSentence(BaseModel):
    index: int
    text: str
    rank_score: float
    is_in_summary: bool


class AnalysisResponse(BaseModel):
    id: str
    filename: str
    stats: DocumentStats
    summary: str
    simplified_summary: Optional[str] = None
    summary_mode: SummaryMode
    key_points: List[KeyPoint]
    keywords: List[KeywordItem]
    topics: List[TopicItem]
    classification: DocumentClassification
    extractive_ranked_sentences: List[ExtractiveSentence]
    chunks_count: int
    created_at: datetime
    ai_mode_used: str  # "Extractive Graph Engine (TextRank/LexRank)", "Gemini 1.5/2.0 Flash", "OpenAI GPT", etc.


class QASourceChunk(BaseModel):
    chunk_id: int
    text: str
    relevance_score: float
    page_or_section: Optional[str] = None


class QARequest(BaseModel):
    document_text: str = Field(..., description="Document source text")
    question: str = Field(..., description="Question to answer")
    document_id: Optional[str] = None
    api_key: Optional[str] = None
    provider: AIProvider = AIProvider.LOCAL


class QAResponse(BaseModel):
    question: str
    answer: str
    sources: List[QASourceChunk]
    is_grounded: bool
    confidence: float
    engine_used: str


class HistoryItem(BaseModel):
    id: str
    filename: str
    created_at: datetime
    word_count: int
    category: str
    summary_preview: str
    summary_mode: str
    time_saved_formatted: str


class ExportRequest(BaseModel):
    format: str = Field("txt", description="txt | markdown | pdf | docx")
    title: str = "Document Analysis Report"
    filename: str = "analysis_report"
    summary: str
    simplified_summary: Optional[str] = None
    key_points: List[str] = []
    keywords: List[str] = []
    topics: List[str] = []
    stats: Optional[Dict[str, Any]] = None
    qa_history: Optional[List[Dict[str, str]]] = None
