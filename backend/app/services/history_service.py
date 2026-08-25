import os
import json
import uuid
from typing import List, Optional
from datetime import datetime

from app.schemas.document import HistoryItem, AnalysisResponse


class HistoryService:
    """
    Manages user document analysis history and persistence.
    """

    _history: List[dict] = []
    MAX_ITEMS = 30

    @classmethod
    def add_entry(cls, response: AnalysisResponse, raw_text: str = "") -> str:
        item_dict = {
            "id": response.id,
            "filename": response.filename,
            "created_at": response.created_at.isoformat(),
            "word_count": response.stats.word_count,
            "category": response.classification.category,
            "summary_preview": response.summary[:140] + ("..." if len(response.summary) > 140 else ""),
            "summary_mode": response.summary_mode.value,
            "time_saved_formatted": response.stats.time_saved_formatted,
            "full_response": response.model_dump(mode="json"),
            "raw_text": raw_text[:50000]
        }

        # Keep latest at top
        cls._history.insert(0, item_dict)
        if len(cls._history) > cls.MAX_ITEMS:
            cls._history = cls._history[:cls.MAX_ITEMS]

        return response.id

    @classmethod
    def get_all(cls) -> List[HistoryItem]:
        return [
            HistoryItem(
                id=h["id"],
                filename=h["filename"],
                created_at=datetime.fromisoformat(h["created_at"]),
                word_count=h["word_count"],
                category=h["category"],
                summary_preview=h["summary_preview"],
                summary_mode=h["summary_mode"],
                time_saved_formatted=h["time_saved_formatted"]
            )
            for h in cls._history
        ]

    @classmethod
    def get_by_id(cls, item_id: str) -> Optional[dict]:
        for h in cls._history:
            if h["id"] == item_id:
                return h
        return None

    @classmethod
    def delete_by_id(cls, item_id: str) -> bool:
        initial_len = len(cls._history)
        cls._history = [h for h in cls._history if h["id"] != item_id]
        return len(cls._history) < initial_len

    @classmethod
    def clear_all(cls):
        cls._history.clear()
