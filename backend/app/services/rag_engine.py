import os
import re
import json
import httpx
from typing import List, Tuple, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.schemas.document import (
    QASourceChunk,
    QAResponse,
    AIProvider,
)
from app.services.nlp_engine import NLPEngine, ENGLISH_STOPWORDS


class RAGEngine:
    """
    Modular Retrieval-Augmented Generation (RAG) service for document Q&A:
    - Ingestion & Recursive Chunking
    - TF-IDF / Semantic Similarity Retrieval
    - Grounded Answer Synthesis with Hallucination Guardrails
    - Source Citation Attribution
    """

    CHUNK_SIZE = 600  # characters
    CHUNK_OVERLAP = 120

    @classmethod
    def chunk_document(cls, text: str) -> List[str]:
        """
        Splits document into overlapping semantic chunks respecting paragraph and sentence boundaries.
        """
        if not text:
            return []

        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        chunks = []
        current_chunk = []
        current_len = 0

        for p in paragraphs:
            p_len = len(p)
            if current_len + p_len <= cls.CHUNK_SIZE:
                current_chunk.append(p)
                current_len += p_len + 2
            else:
                # If paragraph itself is too large, split by sentences
                if current_chunk:
                    chunks.append("\n\n".join(current_chunk))
                    current_chunk = []
                    current_len = 0

                if p_len > cls.CHUNK_SIZE:
                    sentences = NLPEngine.segment_sentences(p)
                    for s in sentences:
                        s_len = len(s)
                        if current_len + s_len <= cls.CHUNK_SIZE:
                            current_chunk.append(s)
                            current_len += s_len + 1
                        else:
                            if current_chunk:
                                chunks.append(" ".join(current_chunk))
                            current_chunk = [s]
                            current_len = s_len
                else:
                    current_chunk = [p]
                    current_len = p_len

        if current_chunk:
            chunks.append("\n\n".join(current_chunk))

        return [c.strip() for c in chunks if len(c.strip()) > 20]

    @classmethod
    def retrieve_relevant_chunks(
        cls,
        chunks: List[str],
        query: str,
        top_k: int = 4
    ) -> List[QASourceChunk]:
        """
        Calculates similarity between query and document chunks using TF-IDF + N-gram cosine similarity.
        """
        if not chunks or not query:
            return []

        clean_query = " ".join([w for w in NLPEngine.tokenize_words(query, lower=True) if w not in ENGLISH_STOPWORDS])
        if not clean_query:
            clean_query = query.lower()

        clean_corpus = []
        for c in chunks:
            words = [w for w in NLPEngine.tokenize_words(c, lower=True) if w not in ENGLISH_STOPWORDS]
            clean_corpus.append(" ".join(words) if words else c.lower())

        try:
            vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1, max_features=1000)
            chunk_vectors = vectorizer.fit_transform(clean_corpus)
            query_vector = vectorizer.transform([clean_query])

            similarities = cosine_similarity(query_vector, chunk_vectors).ravel()
            top_indices = similarities.argsort()[::-1]

            results = []
            for rank, idx in enumerate(top_indices[:top_k]):
                score = float(similarities[idx])
                if score > 0.05:  # Minimum relevance floor
                    results.append(QASourceChunk(
                        chunk_id=idx + 1,
                        text=chunks[idx],
                        relevance_score=round(score, 3),
                        page_or_section=f"Section / Chunk #{idx + 1}"
                    ))
            return results

        except Exception:
            # Fallback simple keyword match
            query_terms = set(clean_query.split())
            scored = []
            for i, c in enumerate(chunks):
                c_words = set(NLPEngine.tokenize_words(c, lower=True))
                overlap = len(query_terms & c_words) / max(1, len(query_terms))
                if overlap > 0:
                    scored.append((i, overlap, c))

            scored.sort(key=lambda x: x[1], reverse=True)
            return [
                QASourceChunk(
                    chunk_id=item[0] + 1,
                    text=item[2],
                    relevance_score=round(item[1], 3),
                    page_or_section=f"Section #{item[0] + 1}"
                )
                for item in scored[:top_k]
            ]

    @classmethod
    def answer_question(
        cls,
        document_text: str,
        question: str,
        provider: AIProvider = AIProvider.LOCAL,
        api_key: Optional[str] = None
    ) -> QAResponse:
        """
        Executes grounded retrieval and answers the question with strict adherence to document facts.
        """
        question = question.strip()
        if not question:
            return QAResponse(
                question="",
                answer="Please enter a question to ask about this document.",
                sources=[],
                is_grounded=True,
                confidence=0.0,
                engine_used="Validator"
            )

        chunks = cls.chunk_document(document_text)
        if not chunks:
            return QAResponse(
                question=question,
                answer="The document contains no readable text to answer questions from.",
                sources=[],
                is_grounded=True,
                confidence=0.0,
                engine_used="Validator"
            )

        relevant_chunks = cls.retrieve_relevant_chunks(chunks, question, top_k=4)

        # Check if query is completely unrelated (zero relevance)
        if not relevant_chunks or max(c.relevance_score for c in relevant_chunks) < 0.08:
            return QAResponse(
                question=question,
                answer="The answer could not be determined from the provided document. The document does not contain information relevant to this question.",
                sources=[],
                is_grounded=True,
                confidence=0.10,
                engine_used="Grounded Fallback Guardrail"
            )

        llm_key = api_key or os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("GROQ_API_KEY")

        # Try LLM if configured
        if provider != AIProvider.LOCAL and llm_key:
            try:
                answer = cls._answer_with_llm(question, relevant_chunks, provider, llm_key)
                return QAResponse(
                    question=question,
                    answer=answer,
                    sources=relevant_chunks,
                    is_grounded=True,
                    confidence=0.95,
                    engine_used=f"{provider.value.upper()} Grounded RAG"
                )
            except Exception as e:
                print(f"[RAGEngine] LLM Q&A failed ({str(e)}), using local grounded synthesis.")

        # Local Grounded Synthesis
        answer, confidence = cls._synthesize_local_answer(question, relevant_chunks)
        return QAResponse(
            question=question,
            answer=answer,
            sources=relevant_chunks,
            is_grounded=True,
            confidence=confidence,
            engine_used="Local Grounded Vector/TF-IDF Engine"
        )

    @classmethod
    def _synthesize_local_answer(cls, question: str, chunks: List[QASourceChunk]) -> Tuple[str, float]:
        """
        Extracts and synthesizes the best answering sentences from retrieved chunks.
        """
        q_words = set(NLPEngine.tokenize_words(question, lower=True)) - ENGLISH_STOPWORDS

        all_candidate_sentences = []
        for chunk in chunks:
            sents = NLPEngine.segment_sentences(chunk.text)
            for s in sents:
                s_words = set(NLPEngine.tokenize_words(s, lower=True)) - ENGLISH_STOPWORDS
                overlap = len(q_words & s_words)
                if overlap > 0:
                    score = (overlap / max(1, len(q_words))) * chunk.relevance_score
                    all_candidate_sentences.append((s, score, chunk.chunk_id))

        if not all_candidate_sentences:
            return (
                "Based on the retrieved sections of the document, no direct factual statement answering this specific query was identified.",
                0.35
            )

        # Sort by score descending
        all_candidate_sentences.sort(key=lambda x: x[1], reverse=True)
        top_sentences = []
        seen = set()

        for s, score, c_id in all_candidate_sentences:
            if s not in seen and len(top_sentences) < 3:
                top_sentences.append(s)
                seen.add(s)

        synthesis = " ".join(top_sentences)
        answer_text = f"According to the document:\n\n{synthesis}"
        return answer_text, 0.88

    @classmethod
    def _answer_with_llm(
        cls,
        question: str,
        sources: List[QASourceChunk],
        provider: AIProvider,
        api_key: str
    ) -> str:
        context_str = "\n\n".join([f"--- [Source #{s.chunk_id}] ---\n{s.text}" for s in sources])
        prompt = f"""You are a precise, factual Document Intelligence Assistant.
Answer the user's question STRICTLY based on the provided document excerpts below.
Instructions:
1. Answer directly and concisely based ONLY on the provided context.
2. If the answer cannot be determined from the excerpts, state clearly: "The answer could not be determined from the provided document."
3. Do NOT make up information or speculate beyond the text.
4. Reference [Source #X] where applicable.

Document Context:
{context_str}

User Question: {question}

Answer:"""

        if provider == AIProvider.GEMINI:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            with httpx.Client(timeout=25.0) as client:
                res = client.post(url, json=payload)
                res.raise_for_status()
                data = res.json()
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()

        elif provider in [AIProvider.OPENAI, AIProvider.GROQ]:
            base_url = "https://api.groq.com/openai/v1/chat/completions" if provider == AIProvider.GROQ else "https://api.openai.com/v1/chat/completions"
            model_name = "llama-3.3-70b-versatile" if provider == AIProvider.GROQ else "gpt-4o-mini"
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": "You are a factual document assistant. Rely strictly on provided context."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1
            }
            headers = {"Authorization": f"Bearer {api_key}"}
            with httpx.Client(timeout=25.0) as client:
                res = client.post(base_url, json=payload, headers=headers)
                res.raise_for_status()
                data = res.json()
                return data["choices"][0]["message"]["content"].strip()

        return "Unable to process question."
