import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response, status
from fastapi.responses import StreamingResponse
import io

from app.schemas.document import (
    AnalysisRequest,
    AnalysisResponse,
    SummaryMode,
    AIProvider,
    QARequest,
    QAResponse,
    HistoryItem,
    ExportRequest,
)
from app.services.document_processor import DocumentProcessor, DocumentProcessingError
from app.services.nlp_engine import NLPEngine
from app.services.summarizer import SummarizerService
from app.services.rag_engine import RAGEngine
from app.services.history_service import HistoryService
from app.services.export_service import ExportService


router = APIRouter()

# Built-in High-Impact Sample Documents for Showcase
BUILTIN_SAMPLES = [
    {
        "id": "academic-ai-transformers",
        "title": "Academic Research: Attention Mechanisms & Foundation Models",
        "category": "Academic & Research",
        "filename": "transformer_attention_paper.txt",
        "text": """Title: Attention Mechanisms and the Architectural Evolution of Foundation Models in Natural Language Processing

Abstract:
The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The introduction of self-attention mechanisms revolutionized sequence modeling by dispensing with recurrence and convolutions entirely. In this study, we empirically evaluate multi-head self-attention architectures across various benchmark datasets. Our experimental methodology evaluates latency, representation fidelity, and gradient propagation efficiency across transformer depths ranging from 12 to 96 layers.

1. Introduction and Background
Recurrent neural networks (RNNs) and Long Short-Term Memory networks (LSTMs) inherently perform sequential computation, aligning token representations along sequence positions. This fundamental constraint precludes parallelization during training, posing computational bottlenecks on modern graphics processing units (GPUs). Furthermore, long-range dependency modeling suffers from vanishing gradient effects across temporal steps. Attention mechanisms circumvent these constraints by establishing direct connectivity between all pairs of input and output tokens, regardless of sequential distance.

2. Empirical Methodology and Benchmark Results
We evaluated transformer scaling laws across multi-billion parameter regimes. Transformer layers utilizing scaled dot-product attention computed attention weights as softmax((Q K^T) / sqrt(d_k)) V. In our evaluation across 10,000 document benchmarks, multi-head attention yielded a 4.2 BLEU score improvement over bidirectional LSTM baselines while decreasing training wall-clock time by 68.4%. Layer normalization combined with residual connections ensured stable convergence even under fp16 mixed-precision floating-point arithmetic.

3. Key Findings and Quantitative Metrics
Our findings demonstrate three primary insights:
First, cross-attention entropy decreases logarithmically with parameter scale, indicating that larger models specialize attention heads towards distinct syntactic and semantic relations.
Second, positional embeddings based on rotary position embeddings (RoPE) exhibited superior generalization across extended context windows up to 32,768 tokens, achieving a perplexity reduction of 14.8%.
Third, compute-optimal training tokens scale linearly with model parameters, corroborating Chinchilla scaling law formulations.

4. Conclusion and Future Directions
Self-attention architectures establish a robust mathematical foundation for generative AI and reasoning systems. Future research will explore sparse attention approximations, linear state-space models (SSMs), and quantized inference kernels to democratize access to multi-modal foundation models."""
    },
    {
        "id": "tech-microservices-arch",
        "title": "Engineering Whitepaper: Distributed Microservices vs Modular Monolith",
        "category": "Technical & Engineering",
        "filename": "microservices_architecture_brief.txt",
        "text": """Engineering Brief: Evaluating Distributed Microservices vs Modular Monolith for High-Throughput Cloud Platforms

Executive Summary:
Engineering organizations frequently encounter structural scalability challenges as codebase complexity and developer headcounts expand. While distributed microservices have emerged as the standard paradigm for hyper-scale cloud applications, recent production data demonstrates significant operational overhead, network latency penalties, and distributed transaction complexity. This architectural assessment provides quantitative benchmarks comparing modular monoliths and microservices across latency, infrastructure cost, and developer velocity.

1. System Performance and Network Latency Overhead
In our benchmarking of an enterprise financial transaction pipeline processing 45,000 requests per second, a microservice architecture spanning 18 discrete services incurred an average inter-service network latency overhead of 84 milliseconds per transaction. Serialized JSON RPC and gRPC calls contributed 42% of total compute latency. Conversely, an in-process modular monolith executing transactions via memory pointers and domain boundaries completed identical operations in 11 milliseconds, representing an 86.9% latency reduction.

2. Operational Infrastructure and Compute Costs
Managing distributed deployments across Kubernetes clusters required dedicated service meshes, distributed tracing collectors (OpenTelemetry), and asynchronous messaging queues (Kafka). Cloud infrastructure expenditures totaled $142,000 monthly for the microservice cluster, compared to $38,500 monthly for horizontally scaled modular monolith pods on Amazon Web Services (AWS) Graviton instances—a 72.8% infrastructure cost savings.

3. Failure Modes and Distributed Consistency
Distributed transactions relying on Saga patterns or two-phase commit protocols experienced a 0.14% reconciliation failure rate during network partitions. In contrast, relational ACID transactions inside the modular database eliminated eventual consistency anomalies and simplified disaster recovery runbooks.

4. Strategic Architectural Recommendations
Teams should default to a well-structured Modular Monolith with strictly enforced domain boundaries, dependency injection, and isolated database schemas. Migration to distributed microservices should only occur when independent scalability, discrete organizational autonomy, or disparate technology stacks strictly mandate service decomposition."""
    },
    {
        "id": "business-saas-economics",
        "title": "Financial Report: Enterprise SaaS Growth & Cloud Unit Economics",
        "category": "Business & Finance",
        "filename": "q3_enterprise_saas_financial_report.txt",
        "text": """Q3 Financial and Strategic Operations Report: Enterprise SaaS Growth and Cloud Unit Economics

Overview and Financial Highlights:
In the third quarter of fiscal year 2026, the company delivered strong financial performance, exceeding revenue targets while expanding operating margins across all major operating segments. Total Annual Recurring Revenue (ARR) reached $184.5 million, representing a 34.2% year-over-year expansion. Non-GAAP operating income improved to $28.4 million, achieving an operating margin of 18.6% compared to 11.2% in the prior year period.

1. Revenue Breakdown and Net Revenue Retention (NRR)
Subscription revenue constituted 92.4% of total revenue, driven by enterprise tier expansions and automated AI module add-on adoption. Net Revenue Retention (NRR) climbed to 124%, underscoring robust customer retention and strong upsell dynamics within Global 2000 strategic accounts. Customer acquisition cost (CAC) payback period compressed from 16.4 months to 11.8 months due to refined product-led growth initiatives.

2. Cloud Infrastructure and Gross Margin Expansion
Gross margin expanded 280 basis points year-over-year to 78.4%. Strategic renegotiations with cloud service providers and inference optimization for our proprietary NLP pipelines reduced per-query compute costs by 41.5%. Free cash flow generation reached $32.1 million for the quarter, bringing trailing twelve-month free cash flow to $89.7 million.

3. Strategic Capital Allocation and Research & Development
R&D investments remained disciplined at 19.5% of total revenue ($36.0 million), focusing primarily on autonomous workflow agents, SOC2 Type II compliance tooling, and enterprise data connector security. The company concluded the quarter with $412.0 million in cash, cash equivalents, and short-term marketable securities with zero outstanding long-term debt.

4. Forward Guidance and Conclusion
Management increases full-year ARR guidance to between $205 million and $210 million, reflecting strong pipeline velocity and sustained enterprise demand. Continued focus on operating leverage and gross margin preservation will sustain long-term shareholder value creation."""
    },
    {
        "id": "health-sleep-cognition",
        "title": "Clinical Study: Impact of Sleep Architecture on Neuroplasticity & Memory",
        "category": "Health & Medicine",
        "filename": "sleep_neurobiology_study.txt",
        "text": """Clinical Research Report: The Role of Slow-Wave Sleep and REM Cycles in Synaptic Neuroplasticity and Memory Consolidation

Background and Clinical Objectives:
Sleep is an essential biological process required for cognitive homeostasis, metabolic clearance, and synaptic plasticity. While acute sleep deprivation is known to impair working memory and attention, the specific neural mechanisms governing memory consolidation during discrete sleep stages remain actively investigated. This randomized clinical trial examined the physiological role of Slow-Wave Sleep (SWS) and Rapid Eye Movement (REM) sleep in hippocampal-to-neocortical memory transfer among 240 healthy adult participants.

1. Methodology and Polysomnographic Monitoring
Participants underwent comprehensive high-density 64-channel electroencephalography (EEG), polysomnography (PSG), and functional magnetic resonance imaging (fMRI) across a 14-day controlled laboratory protocol. Subjects were administered paired-associate declarative memory tests and motor-sequence procedural tasks prior to and following targeted sleep interventions, including selective slow-wave disruption and total REM deprivation.

2. Quantitative Findings and Neurological Observations
The clinical data demonstrated three critical findings:
First, slow-wave sleep disruption resulted in a 43.8% reduction in declarative memory retention (p < 0.001), correlated with attenuated slow-wave activity (0.5–4.0 Hz) and impaired thalamocortical sleep spindle coupling.
Second, fMRI functional connectivity analysis revealed that post-SWS memory retrieval transitioned from hippocampal dependence to distributed bilateral prefrontal and parietal neocortical networks, confirming structural consolidation.
Third, REM sleep deprivation selectively degraded procedural motor skill consolidation by 31.4%, without statistically impacting semantic memory recall.

3. Glymphatic Clearance and Neurodegenerative Risk
Continuous biological monitoring demonstrated that SWS was accompanied by a 60% increase in interstitial space volume within brain parenchyma, facilitating rapid cerebrospinal fluid-interstitial fluid exchange and enhanced beta-amyloid clearance. Chronic slow-wave attenuation was correlated with elevated plasma biomarkers of neuroinflammation.

4. Clinical Conclusions and Practical Applications
These results establish that slow-wave sleep and REM sleep perform distinct, non-redundant neurocomputational roles in synaptic pruning and long-term memory stabilization. Clinical interventions targeting sleep architecture optimization offer promising therapeutic avenues for mitigating age-related cognitive decline and neurodegenerative pathologies."""
    }
]


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_document(request: AnalysisRequest):
    """
    Primary unified NLP document analysis endpoint:
    - Text statistics & readability (Flesch-Kincaid)
    - Multi-mode summarization (Extractive TextRank / Abstractive LLM)
    - Key Points extraction
    - TF-IDF Keyword extraction
    - Topic modeling & semantic classification
    - TextRank sentence centrality ranking
    - Persists analysis to History
    """
    raw_text = request.text.strip()
    if not raw_text or len(raw_text) < 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document text is too short or empty. Please provide at least 15 characters of meaningful text."
        )

    # Normalize text
    clean_text = DocumentProcessor.clean_and_normalize_text(raw_text)

    # 1. Keywords
    keywords = NLPEngine.extract_keywords(clean_text, top_n=14)

    # 2. Topics
    topics = NLPEngine.detect_topics(clean_text, keywords)

    # 3. Document Classification
    classification = NLPEngine.classify_document(clean_text, topics)

    # 4. Summarization & Key Points
    summary_text, simplified_text, key_points, ranked_sentences, ai_mode = SummarizerService.generate_summary(
        text=clean_text,
        mode=request.mode,
        provider=request.provider,
        api_key=request.api_key,
        explain_simply=request.explain_simply
    )

    # 5. Statistics & Readability
    stats = NLPEngine.calculate_stats(
        text=clean_text,
        summary_text=summary_text,
        reading_speed_wpm=request.reading_speed_wpm
    )

    # Chunk count for RAG
    chunks = RAGEngine.chunk_document(clean_text)

    response = AnalysisResponse(
        id=str(uuid.uuid4()),
        filename=request.filename or "Document",
        stats=stats,
        summary=summary_text,
        simplified_summary=simplified_text,
        summary_mode=request.mode,
        key_points=key_points,
        keywords=keywords,
        topics=topics,
        classification=classification,
        extractive_ranked_sentences=ranked_sentences[:20],  # Top 20 ranked sentences
        chunks_count=len(chunks),
        created_at=datetime.now(timezone.utc),
        ai_mode_used=ai_mode
    )

    # Save to history
    HistoryService.add_entry(response, raw_text=clean_text)

    return response


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    mode: SummaryMode = Form(SummaryMode.STANDARD),
    reading_speed_wpm: int = Form(220),
    explain_simply: bool = Form(False),
    api_key: Optional[str] = Form(None),
    provider: AIProvider = Form(AIProvider.LOCAL)
):
    """
    Accepts PDF, DOCX, TXT, MD files, extracts text, cleans formatting, and executes full analysis.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file missing filename.")

    file_bytes = await file.read()
    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        extracted_text, metadata = DocumentProcessor.extract_from_bytes(file_bytes, file.filename)
    except DocumentProcessingError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected extraction error: {str(e)}")

    req = AnalysisRequest(
        text=extracted_text,
        filename=file.filename,
        mode=mode,
        reading_speed_wpm=reading_speed_wpm,
        explain_simply=explain_simply,
        api_key=api_key,
        provider=provider
    )

    return await analyze_document(req)


@router.post("/ask", response_model=QAResponse)
async def ask_question(request: QARequest):
    """
    Interactive grounded RAG Q&A endpoint. Answers questions strictly from document excerpts.
    """
    return RAGEngine.answer_question(
        document_text=request.document_text,
        question=request.question,
        provider=request.provider,
        api_key=request.api_key
    )


@router.get("/samples")
async def get_samples():
    """
    Returns built-in sample documents for instant demonstration.
    """
    return BUILTIN_SAMPLES


@router.get("/history", response_model=List[HistoryItem])
async def get_history():
    """
    Returns list of recently analyzed documents.
    """
    return HistoryService.get_all()


@router.get("/history/{item_id}")
async def get_history_detail(item_id: str):
    """
    Retrieves full analysis result of a previously analyzed document.
    """
    item = HistoryService.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="History entry not found.")
    return item


@router.delete("/history/{item_id}")
async def delete_history_item(item_id: str):
    """
    Deletes an entry from history.
    """
    success = HistoryService.delete_by_id(item_id)
    if not success:
        raise HTTPException(status_code=404, detail="History entry not found.")
    return {"status": "deleted", "id": item_id}


@router.post("/export")
async def export_analysis(req: ExportRequest):
    """
    Exports summary and analytics to downloadable TXT, Markdown, PDF, or DOCX.
    """
    file_bytes, media_type, filename = ExportService.generate_export_bytes(req)
    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "DocuMind AI Backend",
        "version": "1.0.0",
        "nlp_engine": "TextRank / LexRank / TF-IDF / RAG",
        "providers_supported": ["local", "gemini", "openai", "groq"]
    }
