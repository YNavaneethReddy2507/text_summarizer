import os
import json
import re
import httpx
from typing import List, Tuple, Optional, Dict, Any

from app.schemas.document import (
    SummaryMode,
    AIProvider,
    KeyPoint,
    ExtractiveSentence,
)
from app.services.nlp_engine import NLPEngine, ENGLISH_STOPWORDS


class SummarizerService:
    """
    Intelligent Multi-Mode Summarizer offering both High-Precision Extractive Graph Centrality (TextRank)
    and Abstractive LLM generation (Google Gemini, OpenAI, Groq) with seamless local fallback.
    """

    @classmethod
    def generate_summary(
        cls,
        text: str,
        mode: SummaryMode = SummaryMode.STANDARD,
        provider: AIProvider = AIProvider.LOCAL,
        api_key: Optional[str] = None,
        explain_simply: bool = False
    ) -> Tuple[str, Optional[str], List[KeyPoint], List[ExtractiveSentence], str]:
        """
        Executes document summarization, key points extraction, and optional simplification.
        Returns:
            (summary_text, simplified_summary, key_points, ranked_sentences, ai_mode_used)
        """
        sentences = NLPEngine.segment_sentences(text)
        if not sentences:
            return "No readable content to summarize.", None, [], [], "None"

        # Edge case: Very short text
        if len(sentences) <= 3:
            summary = text.strip()
            ranked = [ExtractiveSentence(index=i, text=s, rank_score=1.0, is_in_summary=True) for i, s in enumerate(sentences)]
            key_points = [
                KeyPoint(id=i + 1, category="Key Point", text=s, importance=1.0)
                for i, s in enumerate(sentences)
            ]
            simplified = cls._simplify_locally(summary) if explain_simply else None
            return summary, simplified, key_points, ranked, "Short Text Pass-through"

        # Rank all sentences with Graph Centrality (TextRank)
        ranked_sentences = NLPEngine.rank_sentences_graph(text)

        # Check if LLM API is requested and key is provided (or environment variable present)
        llm_key = api_key or os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("GROQ_API_KEY")
        
        # If external provider specified and key available, use LLM
        if provider != AIProvider.LOCAL and llm_key:
            try:
                summary, key_points, simplified, ai_mode = cls._generate_with_llm(
                    text=text,
                    mode=mode,
                    provider=provider,
                    api_key=llm_key,
                    explain_simply=explain_simply
                )
                # Mark extractive sentences that appear in summary
                cls._mark_selected_sentences(ranked_sentences, summary)
                return summary, simplified, key_points, ranked_sentences, ai_mode
            except Exception as e:
                # Log and gracefully fallback to local NLP engine
                print(f"[SummarizerService] LLM request failed ({str(e)}), falling back to Local NLP Engine.")

        # Local Extractive + Hybrid NLP Engine
        summary, key_points = cls._generate_local_summary(
            sentences=sentences,
            ranked_sentences=ranked_sentences,
            mode=mode
        )

        simplified = cls._simplify_locally(summary) if explain_simply else None
        ai_mode = f"Extractive Graph Engine (TextRank / LexRank - {mode.value.capitalize()} Mode)"

        return summary, simplified, key_points, ranked_sentences, ai_mode

    @classmethod
    def _generate_local_summary(
        cls,
        sentences: List[str],
        ranked_sentences: List[ExtractiveSentence],
        mode: SummaryMode
    ) -> Tuple[str, List[KeyPoint]]:
        """
        Builds high-quality extractive and structured summaries locally based on sentence graph ranking.
        """
        total_sentences = len(sentences)

        # Determine target sentence count based on mode
        if mode == SummaryMode.QUICK:
            target_count = min(4, max(2, total_sentences // 4))
        elif mode == SummaryMode.STANDARD:
            target_count = min(8, max(3, int(total_sentences * 0.20)))
        elif mode == SummaryMode.DETAILED:
            target_count = min(14, max(5, int(total_sentences * 0.35)))
        elif mode == SummaryMode.BULLETS:
            target_count = min(6, max(3, int(total_sentences * 0.18)))
        elif mode == SummaryMode.EXECUTIVE:
            target_count = min(8, max(4, int(total_sentences * 0.25)))
        else:
            target_count = min(5, max(3, total_sentences // 4))

        # Sort ranked sentences by rank_score descending
        sorted_by_score = sorted(ranked_sentences, key=lambda x: x.rank_score, reverse=True)

        # Select top non-redundant sentences
        selected_indices = set()
        selected_texts = []

        for candidate in sorted_by_score:
            if len(selected_indices) >= target_count:
                break

            # Avoid adding sentence if lexical overlap with already selected is > 65%
            cand_words = set(NLPEngine.tokenize_words(candidate.text, lower=True)) - ENGLISH_STOPWORDS
            is_redundant = False
            for sel_text in selected_texts:
                sel_words = set(NLPEngine.tokenize_words(sel_text, lower=True)) - ENGLISH_STOPWORDS
                overlap = len(cand_words & sel_words) / max(1, len(cand_words))
                if overlap > 0.65:
                    is_redundant = True
                    break

            if not is_redundant:
                selected_indices.add(candidate.index)
                selected_texts.append(candidate.text)

        # Always ensure the very first sentence (lead statement) is considered if appropriate
        if 0 not in selected_indices and target_count >= 3 and ranked_sentences[0].rank_score > 0.4:
            # Replace the lowest ranked sentence with index 0
            lowest_idx = min(selected_indices, key=lambda idx: ranked_sentences[idx].rank_score)
            selected_indices.remove(lowest_idx)
            selected_indices.add(0)

        # Mark in ranked_sentences
        for r in ranked_sentences:
            r.is_in_summary = r.index in selected_indices

        # Order selected sentences chronologically by their original document index
        ordered_indices = sorted(list(selected_indices))
        ordered_sentences = [sentences[i] for i in ordered_indices]

        # Extract Key Points from top-scored sentences
        key_points = cls._extract_key_points_local(ranked_sentences)

        # Format based on mode
        if mode == SummaryMode.BULLETS:
            formatted_bullets = "\n\n".join(f"• {s}" for s in ordered_sentences)
            return formatted_bullets, key_points

        elif mode == SummaryMode.EXECUTIVE:
            # Form 4 structured executive sections
            exec_summary = cls._format_executive_summary(ordered_sentences)
            return exec_summary, key_points

        else:
            # Quick / Standard / Detailed: Group sentences into coherent paragraphs (max 3-4 sentences per paragraph)
            paragraphs = []
            current_p = []
            for s in ordered_sentences:
                current_p.append(s)
                if len(current_p) >= 3:
                    paragraphs.append(" ".join(current_p))
                    current_p = []
            if current_p:
                paragraphs.append(" ".join(current_p))

            summary_text = "\n\n".join(paragraphs)
            return summary_text, key_points

    @staticmethod
    def _format_executive_summary(sentences: List[str]) -> str:
        """
        Structures executive summary into 4 distinct business/research components:
        1. Purpose & Background
        2. Core Findings & Observations
        3. Strategic Implications & Data
        4. Conclusion & Key Takeaway
        """
        if len(sentences) == 1:
            return f"### Executive Overview\n{sentences[0]}"

        sec1 = sentences[0]
        sec2 = sentences[1:min(3, len(sentences))]
        sec3 = sentences[3:min(5, len(sentences))] if len(sentences) > 3 else []
        sec4 = sentences[-1] if len(sentences) > 2 else ""

        result = [
            f"### 1. Executive Overview & Purpose\n{sec1}"
        ]

        if sec2:
            findings_bullets = "\n".join(f"- {s}" for s in sec2)
            result.append(f"### 2. Key Findings & Core Evidence\n{findings_bullets}")

        if sec3:
            implications_bullets = "\n".join(f"- {s}" for s in sec3)
            result.append(f"### 3. Critical Observations & Metrics\n{implications_bullets}")

        if sec4 and sec4 not in sec2 and sec4 not in sec3 and sec4 != sec1:
            result.append(f"### 4. Strategic Conclusion & Recommendations\n{sec4}")

        return "\n\n".join(result)

    @classmethod
    def _extract_key_points_local(cls, ranked_sentences: List[ExtractiveSentence]) -> List[KeyPoint]:
        """
        Identifies top 4-5 key takeaways categorized by analytical role.
        """
        sorted_sentences = sorted(ranked_sentences, key=lambda x: x.rank_score, reverse=True)
        key_points: List[KeyPoint] = []

        categories = [
            "Primary Thesis",
            "Major Finding",
            "Key Empirical Evidence",
            "Critical Insight",
            "Core Conclusion"
        ]

        for i, item in enumerate(sorted_sentences[:5]):
            cat = categories[i] if i < len(categories) else "Key Point"
            key_points.append(KeyPoint(
                id=i + 1,
                category=cat,
                text=item.text,
                importance=round(item.rank_score, 2)
            ))

        return key_points

    @staticmethod
    def _simplify_locally(text: str) -> str:
        """
        Converts complex sentence constructions into direct, easy-to-read phrasing.
        """
        replacements = {
            r"\butilize\b": "use",
            r"\butilizes\b": "uses",
            r"\butilizing\b": "using",
            r"\bdemonstrates\b": "shows",
            r"\bdemonstrate\b": "show",
            r"\bfacilitates?\b": "helps",
            r"\bcommence\b": "start",
            r"\bterminates?\b": "ends",
            r"\bsubstantial\b": "large",
            r"\bsubstantially\b": "greatly",
            r"\bapproximately\b": "about",
            r"\bconsequently\b": "as a result",
            r"\bfurthermore\b": "also",
            r"\bnevertheless\b": "even so",
            r"\bin order to\b": "to",
            r"\bdue to the fact that\b": "because",
            r"\bexhibits\b": "shows",
            r"\bpredominantly\b": "mostly",
            r"\bimperative\b": "essential",
            r"\bparamount\b": "very important",
            r"\belucidate\b": "explain",
            r"\bparadigm\b": "model",
            r"\bdisseminate\b": "share",
        }

        simplified = text
        for pat, repl in replacements.items():
            simplified = re.sub(pat, repl, simplified, flags=re.IGNORECASE)

        # Break overly long sentences connected by semicolons
        simplified = re.sub(r";\s*", ". ", simplified)
        return simplified

    @staticmethod
    def _mark_selected_sentences(ranked_sentences: List[ExtractiveSentence], summary: str):
        summary_lower = summary.lower()
        for r in ranked_sentences:
            s_lead = " ".join(r.text.lower().split()[:6])
            if s_lead in summary_lower:
                r.is_in_summary = True

    @classmethod
    def _generate_with_llm(
        cls,
        text: str,
        mode: SummaryMode,
        provider: AIProvider,
        api_key: str,
        explain_simply: bool
    ) -> Tuple[str, List[KeyPoint], Optional[str], str]:
        """
        Connects to external LLM (Gemini, OpenAI, Groq) using a unified prompt architecture.
        """
        prompt = f"""You are a senior document intelligence NLP engine. Analyze and summarize the following document accurately.
Requirements:
1. Summarization Mode: {mode.value.upper()}
   - QUICK: 3-5 concise sentences capturing the core idea.
   - STANDARD: Balanced summary (~15-20% length of source).
   - DETAILED: In-depth synthesis covering all key sections.
   - BULLETS: High-impact bullet points with leading bold concepts.
   - EXECUTIVE: Structured into 4 parts: 1. Overview, 2. Key Findings, 3. Critical Metrics, 4. Conclusion.
2. Preserve all facts, dates, names, and statistics accurately without hallucination.
3. Extract 4-5 distinct Key Points with categories (e.g. Primary Thesis, Major Finding, Critical Metric, Conclusion).
{f'4. Provide a simplified explanation for high school students.' if explain_simply else ''}

Return valid JSON with the following schema:
{{
  "summary": "...",
  "key_points": [
    {{"id": 1, "category": "Major Finding", "text": "...", "importance": 0.95}}
  ],
  "simplified_summary": "..."
}}

Document Content:
\"\"\"{text[:20000]}\"\"\"
"""
        if provider == AIProvider.GEMINI:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2}
            }
            with httpx.Client(timeout=30.0) as client:
                res = client.post(url, json=payload)
                res.raise_for_status()
                data = res.json()
                content_text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(content_text)
                key_pts = [KeyPoint(**kp) for kp in parsed.get("key_points", [])]
                return parsed.get("summary", ""), key_pts, parsed.get("simplified_summary"), "Google Gemini 1.5 Flash"

        elif provider in [AIProvider.OPENAI, AIProvider.GROQ]:
            base_url = "https://api.groq.com/openai/v1/chat/completions" if provider == AIProvider.GROQ else "https://api.openai.com/v1/chat/completions"
            model_name = "llama-3.3-70b-versatile" if provider == AIProvider.GROQ else "gpt-4o-mini"
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": "You are a professional document intelligence engine. Return JSON only."},
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2
            }
            headers = {"Authorization": f"Bearer {api_key}"}
            with httpx.Client(timeout=30.0) as client:
                res = client.post(base_url, json=payload, headers=headers)
                res.raise_for_status()
                data = res.json()
                content_text = data["choices"][0]["message"]["content"]
                parsed = json.loads(content_text)
                key_pts = [KeyPoint(**kp) for kp in parsed.get("key_points", [])]
                return parsed.get("summary", ""), key_pts, parsed.get("simplified_summary"), f"{provider.value.upper()} ({model_name})"

        raise ValueError(f"Unsupported provider: {provider}")
