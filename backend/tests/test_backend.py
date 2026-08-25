import pytest
import io
from fastapi.testclient import TestClient

from app.main import app
from app.services.document_processor import DocumentProcessor, DocumentProcessingError
from app.services.nlp_engine import NLPEngine
from app.services.summarizer import SummarizerService
from app.services.rag_engine import RAGEngine
from app.schemas.document import SummaryMode, AIProvider, AnalysisRequest, QARequest, ExportRequest


client = TestClient(app)

SAMPLE_ARTICLE = """
Artificial Intelligence and machine learning technologies have experienced exponential development in recent years.
Deep neural networks have achieved state-of-the-art results across natural language processing, computer vision, and speech synthesis.
In particular, self-attention architectures and large language models have enabled systems to understand complex context.
However, deploying large models introduces significant compute costs and high latency overhead.
Researchers are actively developing quantized inference kernels, sparse attention patterns, and distillation techniques.
These innovations allow organizations to reduce cloud infrastructure costs by up to 65% while maintaining model fidelity.
Ultimately, efficient model architectures will accelerate the adoption of generative AI across healthcare, finance, and education.
"""


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "DocuMind AI" in data["service"]


def test_samples_endpoint():
    response = client.get("/api/samples")
    assert response.status_code == 200
    samples = response.json()
    assert len(samples) >= 3
    assert any("Academic" in s["title"] for s in samples)


def test_document_processor_clean():
    dirty_text = "  Hello   world! \r\n\r\n\r\n This is a “test” with ‘fancy’ quotes and – dashes.  \n"
    cleaned = DocumentProcessor.clean_and_normalize_text(dirty_text)
    assert 'This is a "test"' in cleaned
    assert "Hello world!" in cleaned
    assert "\r" not in cleaned


def test_document_processor_txt():
    content = b"Sample document text for testing extraction pipeline."
    text, meta = DocumentProcessor.extract_from_bytes(content, "test.txt")
    assert "Sample document text" in text
    assert meta["extension"] == ".txt"


def test_nlp_engine_segmentation_and_stats():
    sentences = NLPEngine.segment_sentences(SAMPLE_ARTICLE)
    assert len(sentences) >= 5

    words = NLPEngine.tokenize_words(SAMPLE_ARTICLE)
    assert len(words) > 50

    stats = NLPEngine.calculate_stats(SAMPLE_ARTICLE, summary_text="AI and machine learning have advanced rapidly.", reading_speed_wpm=200)
    assert stats.word_count > 50
    assert stats.sentence_count >= 5
    assert stats.flesch_reading_ease >= 0.0
    assert stats.flesch_kincaid_grade > 0
    assert stats.time_saved_min >= 0


def test_nlp_engine_keywords_and_topics():
    keywords = NLPEngine.extract_keywords(SAMPLE_ARTICLE, top_n=8)
    assert len(keywords) > 0
    kw_texts = [k.text.lower() for k in keywords]
    assert any("intelligence" in k or "learning" in k or "models" in k or "attention" in k for k in kw_texts)

    topics = NLPEngine.detect_topics(SAMPLE_ARTICLE, keywords)
    assert len(topics) > 0
    assert any("Academic" in t.name or "Technical" in t.name or "Artificial" in t.name or "Intelligence" in t.name for t in topics)


def test_nlp_engine_sentence_ranking():
    ranked = NLPEngine.rank_sentences_graph(SAMPLE_ARTICLE)
    assert len(ranked) >= 5
    assert ranked[0].rank_score >= 0.0
    assert max(r.rank_score for r in ranked) == 1.0


def test_summarizer_modes():
    for mode in [SummaryMode.QUICK, SummaryMode.STANDARD, SummaryMode.DETAILED, SummaryMode.BULLETS, SummaryMode.EXECUTIVE]:
        summary, simplified, key_points, ranked, ai_mode = SummarizerService.generate_summary(
            text=SAMPLE_ARTICLE,
            mode=mode,
            provider=AIProvider.LOCAL,
            explain_simply=True
        )
        assert len(summary) > 20
        assert len(key_points) > 0
        assert simplified is not None

        if mode == SummaryMode.BULLETS:
            assert "•" in summary
        elif mode == SummaryMode.EXECUTIVE:
            assert "###" in summary


def test_rag_engine_retrieval_and_qa():
    chunks = RAGEngine.chunk_document(SAMPLE_ARTICLE)
    assert len(chunks) >= 1

    # Factual question directly in text
    qa_res = RAGEngine.answer_question(
        document_text=SAMPLE_ARTICLE,
        question="How much can organizations reduce cloud infrastructure costs?",
        provider=AIProvider.LOCAL
    )
    assert qa_res.is_grounded is True
    assert len(qa_res.sources) > 0
    assert "65%" in qa_res.answer or "infrastructure costs" in qa_res.answer

    # Completely unrelated question
    unrelated_res = RAGEngine.answer_question(
        document_text=SAMPLE_ARTICLE,
        question="What is the capital city of France?",
        provider=AIProvider.LOCAL
    )
    assert "could not be determined" in unrelated_res.answer.lower()


def test_api_analyze_endpoint():
    payload = {
        "text": SAMPLE_ARTICLE,
        "filename": "test_article.txt",
        "mode": "standard",
        "reading_speed_wpm": 220,
        "explain_simply": True,
        "provider": "local"
    }
    res = client.post("/api/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["stats"]["word_count"] > 50
    assert len(data["summary"]) > 0
    assert len(data["key_points"]) > 0
    assert len(data["keywords"]) > 0
    assert len(data["topics"]) > 0


def test_api_export_endpoint():
    payload = {
        "format": "markdown",
        "title": "Test Report",
        "filename": "test_export",
        "summary": "This is a summary test.",
        "key_points": ["Point 1", "Point 2"],
        "keywords": ["AI", "NLP"],
        "topics": ["Artificial Intelligence"],
        "stats": {"word_count": 100, "reading_time_min": 0.5}
    }
    res = client.post("/api/export", json=payload)
    assert res.status_code == 200
    assert "Test Report" in res.text
