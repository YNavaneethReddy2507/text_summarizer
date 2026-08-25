import re
import math
from typing import List, Dict, Tuple, Optional, Set
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.schemas.document import (
    DocumentStats,
    KeywordItem,
    TopicItem,
    DocumentClassification,
    ExtractiveSentence,
)


# Standard English Stopwords list
ENGLISH_STOPWORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't",
    "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down",
    "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't",
    "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself",
    "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's",
    "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off",
    "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same",
    "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that",
    "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they",
    "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up",
    "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's",
    "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with",
    "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself",
    "yourselves", "also", "thus", "therefore", "however", "furthermore", "moreover", "overall", "using",
    "used", "within", "based", "first", "second", "third", "one", "two", "three", "many", "much", "well"
}

POSITIVE_WORDS = {
    "effective", "efficient", "optimal", "superior", "success", "successful", "improve", "improved", "improvement",
    "breakthrough", "advantage", "advantages", "gain", "gains", "benefit", "benefits", "robust", "accurate",
    "accuracy", "promising", "significant", "significantly", "excellent", "innovative", "innovation", "outperform",
    "outperformed", "state-of-the-art", "scalable", "valuable", "positive", "favorable", "enhancement", "reliable",
    "streamlined", "seamless", "exceptional", "solution", "growth", "prosper", "accomplish", "mastery", "thrive"
}

NEGATIVE_WORDS = {
    "defect", "flaw", "error", "errors", "limitation", "limitations", "drawback", "drawbacks", "fail", "failure",
    "failed", "risk", "risks", "decline", "deteriorate", "poor", "vulnerability", "vulnerabilities", "bottleneck",
    "bottlenecks", "inefficient", "inefficiency", "costly", "problem", "problems", "crisis", "threat", "threats",
    "loss", "losses", "severe", "weakness", "weaknesses", "obstacle", "obstacles", "adverse", "negative", "harmful"
}

DOMAIN_PROFILES = {
    "Academic & Research": {
        "keywords": ["abstract", "methodology", "empirical", "hypothesis", "experiment", "findings", "literature",
                     "dataset", "analysis", "citation", "evaluation", "framework", "benchmark", "results", "conclusion"],
        "weight": 1.2
    },
    "Technical & Engineering": {
        "keywords": ["architecture", "algorithm", "software", "system", "infrastructure", "latency", "pipeline",
                     "database", "api", "deployment", "scalability", "network", "performance", "server", "code",
                     "model", "compute", "interface", "hardware", "distributed", "protocol"],
        "weight": 1.2
    },
    "Business & Finance": {
        "keywords": ["revenue", "market", "growth", "margin", "profit", "quarter", "stakeholder", "investment",
                     "cost", "strategy", "customer", "valuation", "fiscal", "ebitda", "capital", "enterprise",
                     "sales", "operations", "roi", "commercial", "shareholders"],
        "weight": 1.2
    },
    "Health & Medicine": {
        "keywords": ["patient", "clinical", "treatment", "therapy", "disease", "diagnosis", "health", "symptoms",
                     "medical", "dosage", "efficacy", "trial", "hospital", "biological", "cognitive", "syndrome",
                     "cellular", "physician", "metabolic"],
        "weight": 1.3
    },
    "News & Media": {
        "keywords": ["reported", "spokesperson", "statement", "government", "minister", "yesterday", "announced",
                     "investigation", "official", "incident", "press", "conference", "witness", "public", "monday",
                     "tuesday", "wednesday", "thursday", "friday"],
        "weight": 1.1
    },
    "Educational & Explanatory": {
        "keywords": ["concept", "understand", "learn", "example", "definition", "lesson", "student", "guide",
                     "principles", "chapter", "exercise", "practice", "fundamentals", "overview", "introduction"],
        "weight": 1.1
    }
}


class NLPEngine:
    """
    Production-grade NLP processor providing tokenization, readability metrics,
    TF-IDF keyword extraction, Topic Modeling, Graph Centrality scoring, and Document Classification.
    """

    @staticmethod
    def segment_sentences(text: str) -> List[str]:
        """
        Splits text into sentences using boundary rules that preserve abbreviations,
        acronyms, numbers, decimals, and bullet notations.
        """
        if not text:
            return []

        # Replace carriage returns
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        # Split on paragraph boundaries first
        raw_paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        all_sentences = []

        # Abbreviations regex pattern
        abbrev_pattern = r"\b(?:e\.g\.|i\.e\.|etc\.|dr\.|mr\.|mrs\.|ms\.|prof\.|vs\.|fig\.|et\sal\.|vol\.|no\.|dept\.|approx\.|inc\.|ltd\.|corp\.|co\.|gen\.|rep\.|sen\.|gov\.|st\.|jr\.|sr\.)"

        for para in raw_paragraphs:
            # Mask abbreviations temporarily to avoid splitting
            temp_para = para
            masks = {}
            for i, match in enumerate(re.finditer(abbrev_pattern, temp_para, flags=re.IGNORECASE)):
                mask_key = f"__ABBREV_{i}__"
                masks[mask_key] = match.group(0)
                temp_para = temp_para.replace(match.group(0), mask_key, 1)

            # Mask numbers like 3.14 or 1.5M
            num_masks = {}
            for j, match in enumerate(re.finditer(r"\b\d+\.\d+\b", temp_para)):
                num_key = f"__NUM_{j}__"
                num_masks[num_key] = match.group(0)
                temp_para = temp_para.replace(match.group(0), num_key, 1)

            # Split on sentence boundaries: ., !, ? followed by whitespace or end of string
            split_candidates = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'(\[])", temp_para)

            for candidate in split_candidates:
                candidate = candidate.strip()
                if not candidate:
                    continue

                # Unmask
                for num_key, original_num in num_masks.items():
                    candidate = candidate.replace(num_key, original_num)
                for mask_key, original_abbrev in masks.items():
                    candidate = candidate.replace(mask_key, original_abbrev)

                # Clean bullet markers at sentence start if solitary
                candidate = re.sub(r"^[\*\-\•\–\—\d+\.]+\s+", "", candidate).strip()

                if len(candidate) > 10:
                    all_sentences.append(candidate)

        return all_sentences

    @staticmethod
    def tokenize_words(text: str, lower: bool = True) -> List[str]:
        """Tokenize text into alphanumeric words."""
        if lower:
            text = text.lower()
        return re.findall(r"\b[a-zA-Z0-9_-]{2,}\b", text)

    @staticmethod
    def count_syllables(word: str) -> int:
        """Heuristic syllable counter for Flesch-Kincaid calculations."""
        word = word.lower().strip()
        if len(word) <= 3:
            return 1
        # Remove common trailing non-syllabic endings
        word = re.sub(r"(?:[^laeiouy]|ed|es|e)$", "", word)
        word = re.sub(r"^y", "", word)
        matches = re.findall(r"[aeiouy]{1,2}", word)
        return max(1, min(7, len(matches)))

    @classmethod
    def calculate_stats(
        cls,
        text: str,
        summary_text: str = "",
        reading_speed_wpm: int = 220
    ) -> DocumentStats:
        """
        Calculates comprehensive document statistics, readability scores, and time saved.
        """
        words = cls.tokenize_words(text, lower=False)
        sentences = cls.segment_sentences(text)
        paragraphs = [p for p in text.split("\n\n") if p.strip()]

        word_count = len(words)
        char_count = len(text)
        sentence_count = max(1, len(sentences))
        paragraph_count = max(1, len(paragraphs))

        avg_word_length = round(sum(len(w) for w in words) / max(1, word_count), 2)
        avg_sentence_length = round(word_count / sentence_count, 1)

        # Reading Time (minutes)
        reading_time_min = word_count / reading_speed_wpm
        reading_time_formatted = cls._format_time(reading_time_min)

        # Summary Metrics
        summary_words = cls.tokenize_words(summary_text, lower=False)
        summary_word_count = len(summary_words)
        summary_reading_time_min = summary_word_count / reading_speed_wpm if summary_word_count > 0 else 0.0
        summary_reading_time_formatted = cls._format_time(summary_reading_time_min)

        time_saved_min = max(0.0, reading_time_min - summary_reading_time_min)
        time_saved_formatted = cls._format_time(time_saved_min)

        compression_ratio = 0.0
        if word_count > 0 and summary_word_count > 0:
            compression_ratio = round(max(0.0, 1.0 - (summary_word_count / word_count)), 3)

        # Readability Metrics
        total_syllables = sum(cls.count_syllables(w) for w in words)
        words_per_sent = word_count / sentence_count
        syllables_per_word = total_syllables / max(1, word_count)

        flesch_reading_ease = 206.835 - (1.015 * words_per_sent) - (84.6 * syllables_per_word)
        flesch_reading_ease = max(0.0, min(100.0, round(flesch_reading_ease, 1)))

        flesch_kincaid_grade = (0.39 * words_per_sent) + (11.8 * syllables_per_word) - 15.59
        flesch_kincaid_grade = max(1.0, min(20.0, round(flesch_kincaid_grade, 1)))

        readability_level = cls._classify_readability(flesch_reading_ease, flesch_kincaid_grade)

        return DocumentStats(
            word_count=word_count,
            char_count=char_count,
            sentence_count=sentence_count,
            paragraph_count=paragraph_count,
            avg_word_length=avg_word_length,
            avg_sentence_length=avg_sentence_length,
            reading_time_min=round(reading_time_min, 2),
            reading_time_formatted=reading_time_formatted,
            summary_word_count=summary_word_count,
            summary_reading_time_min=round(summary_reading_time_min, 2),
            summary_reading_time_formatted=summary_reading_time_formatted,
            time_saved_min=round(time_saved_min, 2),
            time_saved_formatted=time_saved_formatted,
            compression_ratio=compression_ratio,
            flesch_reading_ease=flesch_reading_ease,
            flesch_kincaid_grade=flesch_kincaid_grade,
            readability_level=readability_level,
        )

    @staticmethod
    def _format_time(minutes: float) -> str:
        if minutes <= 0:
            return "0 sec"
        total_seconds = int(round(minutes * 60))
        mins = total_seconds // 60
        secs = total_seconds % 60
        if mins == 0:
            return f"{secs} sec"
        elif secs == 0:
            return f"{mins} min"
        else:
            return f"{mins} min {secs} sec"

    @staticmethod
    def _classify_readability(flesch_score: float, grade: float) -> str:
        if flesch_score >= 80:
            return f"Very Easy (Grade {grade:.0f})"
        elif flesch_score >= 70:
            return f"Easy (Grade {grade:.0f})"
        elif flesch_score >= 60:
            return f"Standard (Grade {grade:.0f})"
        elif flesch_score >= 50:
            return f"Fairly Difficult (High School / Grade {grade:.0f})"
        elif flesch_score >= 30:
            return f"Difficult (College Level / Grade {grade:.0f})"
        else:
            return f"Very Difficult (Academic / Graduate Grade {grade:.0f})"

    @classmethod
    def extract_keywords(
        cls,
        text: str,
        top_n: int = 15
    ) -> List[KeywordItem]:
        """
        Extracts salient keywords and keyphrases using TF-IDF with unigrams, bigrams,
        and trigrams, filtered by English stopwords and boosted by position relevance.
        """
        sentences = cls.segment_sentences(text)
        if not sentences:
            return []

        # Preprocess sentences for TF-IDF
        clean_corpus = []
        for s in sentences:
            words = [w for w in cls.tokenize_words(s, lower=True) if w not in ENGLISH_STOPWORDS and not w.isdigit()]
            if words:
                clean_corpus.append(" ".join(words))

        if not clean_corpus:
            return []

        try:
            vectorizer = TfidfVectorizer(
                ngram_range=(1, 3),
                max_df=0.90,
                min_df=1,
                stop_words=list(ENGLISH_STOPWORDS),
                max_features=200
            )
            tfidf_matrix = vectorizer.fit_transform(clean_corpus)
            feature_names = vectorizer.get_feature_names_out()

            # Aggregate mean TF-IDF score across all sentences
            mean_scores = np.asarray(tfidf_matrix.mean(axis=0)).ravel()
            top_indices = mean_scores.argsort()[::-1]

            keywords_dict: Dict[str, float] = {}
            for idx in top_indices:
                phrase = feature_names[idx].strip()
                score = float(mean_scores[idx])

                # Skip single characters or purely numeric
                if len(phrase) < 3 or phrase.isdigit():
                    continue

                # Boost multi-word phrases slightly for better semantic quality
                num_tokens = len(phrase.split())
                if num_tokens > 1:
                    score *= 1.25

                # Check if phrase is substring of an already added higher-scoring phrase
                is_sub = False
                for existing in keywords_dict:
                    if phrase in existing and score <= keywords_dict[existing]:
                        is_sub = True
                        break
                if not is_sub:
                    keywords_dict[phrase] = score

                if len(keywords_dict) >= top_n * 2:
                    break

            # Normalize scores between 0.50 and 0.99
            if keywords_dict:
                max_val = max(keywords_dict.values())
                min_val = min(keywords_dict.values())
                rng = max_val - min_val if max_val != min_val else 1.0

                result = []
                for phrase, raw_score in list(keywords_dict.items())[:top_n]:
                    norm_score = round(0.50 + 0.49 * ((raw_score - min_val) / rng), 2)
                    
                    # Capitalize nicely
                    cap_phrase = " ".join(w.capitalize() for w in phrase.split())
                    
                    category = "Key Term" if len(phrase.split()) == 1 else "Keyphrase"
                    result.append(KeywordItem(
                        text=cap_phrase,
                        score=norm_score,
                        category=category
                    ))
                return result

        except Exception:
            pass

        # Fallback frequency-based extraction
        all_words = [w for w in cls.tokenize_words(text, lower=True) if w not in ENGLISH_STOPWORDS and len(w) > 3]
        freq_map: Dict[str, int] = {}
        for w in all_words:
            freq_map[w] = freq_map.get(w, 0) + 1

        sorted_words = sorted(freq_map.items(), key=lambda x: x[1], reverse=True)[:top_n]
        max_freq = sorted_words[0][1] if sorted_words else 1

        return [
            KeywordItem(
                text=w.capitalize(),
                score=round(0.50 + 0.45 * (cnt / max_freq), 2),
                category="Frequent Term"
            )
            for w, cnt in sorted_words
        ]

    @classmethod
    def detect_topics(cls, text: str, keywords: List[KeywordItem]) -> List[TopicItem]:
        """
        Detects primary topics and sub-themes using semantic keyword clustering and domain heuristics.
        """
        text_lower = text.lower()
        topics_found: List[TopicItem] = []

        # Evaluate against known domain profiles
        for domain, info in DOMAIN_PROFILES.items():
            matches = [k for k in info["keywords"] if re.search(r"\b" + re.escape(k) + r"\b", text_lower)]
            if matches:
                confidence = min(0.98, (len(matches) / 5.0) * info["weight"])
                if confidence >= 0.35:
                    top_kw = [k.capitalize() for k in matches[:4]]
                    topics_found.append(TopicItem(
                        name=domain,
                        confidence=round(confidence, 2),
                        description=f"Identified strong terminology matching {domain.lower()} domain patterns.",
                        keywords=top_kw
                    ))

        # Also extract contextual topic clusters from top multi-word keyphrases
        multi_word_kw = [k.text for k in keywords if len(k.text.split()) > 1]
        for phrase in multi_word_kw[:3]:
            # Avoid duplicate topic names
            if not any(phrase.lower() in t.name.lower() for t in topics_found):
                topics_found.append(TopicItem(
                    name=phrase,
                    confidence=0.85,
                    description=f"Key technical subject referenced throughout the document.",
                    keywords=[phrase]
                ))

        if not topics_found:
            topics_found.append(TopicItem(
                name="General Document Content",
                confidence=0.70,
                description="General narrative / informative text without a specialized domain concentration.",
                keywords=[k.text for k in keywords[:3]]
            ))

        # Sort by confidence
        topics_found.sort(key=lambda t: t.confidence, reverse=True)
        return topics_found[:5]

    @classmethod
    def classify_document(cls, text: str, topics: List[TopicItem]) -> DocumentClassification:
        """
        Classifies document into major genres, determines analytical tone, and calculates sentiment with guardrails.
        """
        # Primary category from top topic
        primary_category = topics[0].name if topics else "General"
        if primary_category not in DOMAIN_PROFILES and len(topics) > 1:
            for t in topics:
                if t.name in DOMAIN_PROFILES:
                    primary_category = t.name
                    break

        confidence = topics[0].confidence if topics else 0.75

        # Tone analysis
        text_lower = text.lower()
        words = cls.tokenize_words(text_lower)
        word_count = len(words)

        pos_count = sum(1 for w in words if w in POSITIVE_WORDS)
        neg_count = sum(1 for w in words if w in NEGATIVE_WORDS)

        # Tone classification
        if primary_category in ["Academic & Research", "Technical & Engineering"]:
            tone = "Analytical & Objective"
            sentiment_applicable = False
            sentiment = "Neutral"
            sentiment_score = 0.0
            reasoning = f"Document exhibits rigorous technical/academic structure with dense domain terminology."
        elif primary_category == "Business & Finance":
            tone = "Strategic & Analytical"
            sentiment_applicable = True
            if pos_count > neg_count * 1.5:
                sentiment = "Positive / Growth-Oriented"
                sentiment_score = min(1.0, round((pos_count - neg_count) / max(1, pos_count + neg_count), 2))
            elif neg_count > pos_count * 1.5:
                sentiment = "Cautious / Risk-Aware"
                sentiment_score = max(-1.0, round((pos_count - neg_count) / max(1, pos_count + neg_count), 2))
            else:
                sentiment = "Neutral / Balanced"
                sentiment_score = 0.0
            reasoning = f"Business report focusing on operations, performance indicators, and strategic objectives."
        elif primary_category == "News & Media":
            tone = "Informative & Journalistic"
            sentiment_applicable = True
            sentiment = "Neutral / Reporting" if abs(pos_count - neg_count) <= 3 else ("Positive" if pos_count > neg_count else "Critical")
            sentiment_score = round((pos_count - neg_count) / max(1, pos_count + neg_count), 2)
            reasoning = "Journalistic article summarizing current events, statements, and timeline."
        else:
            tone = "Informational"
            sentiment_applicable = True
            sentiment = "Neutral" if abs(pos_count - neg_count) <= 2 else ("Positive" if pos_count > neg_count else "Negative")
            sentiment_score = round((pos_count - neg_count) / max(1, pos_count + neg_count), 2)
            reasoning = "Informational or educational prose covering core principles."

        return DocumentClassification(
            category=primary_category,
            confidence=round(confidence, 2),
            reasoning=reasoning,
            tone=tone,
            sentiment=sentiment,
            sentiment_score=sentiment_score,
            sentiment_applicable=sentiment_applicable
        )

    @classmethod
    def rank_sentences_graph(cls, text: str) -> List[ExtractiveSentence]:
        """
        Graph-based sentence ranking (TextRank / LexRank implementation):
        1. Segments sentences and builds TF-IDF vector representations.
        2. Computes sentence-sentence cosine similarity matrix.
        3. Applies PageRank power iteration with damping factor (d=0.85).
        4. Applies position weight (lead sentences in paragraphs get a bonus) and numerical entity boost.
        """
        sentences = cls.segment_sentences(text)
        if not sentences:
            return []

        if len(sentences) == 1:
            return [ExtractiveSentence(index=0, text=sentences[0], rank_score=1.0, is_in_summary=True)]

        # Prepare TF-IDF matrix of sentences
        clean_sentences = []
        for s in sentences:
            cleaned = " ".join([w for w in cls.tokenize_words(s, lower=True) if w not in ENGLISH_STOPWORDS])
            clean_sentences.append(cleaned if cleaned else "document content")

        try:
            vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=500)
            tfidf_mat = vectorizer.fit_transform(clean_sentences)
            sim_matrix = cosine_similarity(tfidf_mat, tfidf_mat)

            # Zero out diagonal
            np.fill_diagonal(sim_matrix, 0)

            # Normalize rows to form transition probability matrix
            row_sums = sim_matrix.sum(axis=1)
            row_sums[row_sums == 0] = 1.0
            norm_matrix = sim_matrix / row_sums[:, np.newaxis]

            # PageRank Power Iteration
            d = 0.85
            n = len(sentences)
            scores = np.ones(n) / n

            for _ in range(25):
                scores = (1 - d) / n + d * norm_matrix.T.dot(scores)

        except Exception:
            # Fallback simple length & term frequency score
            scores = np.array([len(s.split()) for s in sentences], dtype=float)
            scores = scores / scores.sum()

        # Combine with position bias & numeric fact density
        ranked_items: List[ExtractiveSentence] = []
        for i, s in enumerate(sentences):
            score = float(scores[i])

            # Position bias: early sentences in the document carry higher summary value
            pos_factor = 1.0 + (0.35 * (1.0 - (i / len(sentences))))
            if i == 0:
                pos_factor += 0.20  # First sentence bonus

            # Numerical / metric fact boost (dates, percentages, statistics)
            has_numbers = bool(re.search(r"\b\d+(?:\.\d+)?%?|\$\d+", s))
            num_factor = 1.15 if has_numbers else 1.0

            # Length penalty for extremely short or overly verbose sentences
            w_count = len(s.split())
            len_factor = 1.0
            if w_count < 8:
                len_factor = 0.65
            elif w_count > 60:
                len_factor = 0.85

            final_score = score * pos_factor * num_factor * len_factor
            ranked_items.append(ExtractiveSentence(
                index=i,
                text=s,
                rank_score=final_score,
                is_in_summary=False
            ))

        # Normalize rank scores 0.0 - 1.0
        max_s = max(r.rank_score for r in ranked_items)
        min_s = min(r.rank_score for r in ranked_items)
        rng = max_s - min_s if max_s != min_s else 1.0

        for item in ranked_items:
            item.rank_score = round((item.rank_score - min_s) / rng, 3)

        return ranked_items
