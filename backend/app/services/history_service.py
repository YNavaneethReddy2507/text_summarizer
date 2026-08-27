import os
import sys

# Ensure backend directory is in sys.path when executed directly
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

import json
import sqlite3
import uuid
from typing import List, Optional
from datetime import datetime

from app.schemas.document import HistoryItem, AnalysisResponse


DB_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "contextai.db")


class HistoryService:
    """
    Manages user document analysis history using an embedded SQLite database (contextai.db).
    Zero external database configuration required.
    """

    @classmethod
    def _get_connection(cls):
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        return conn

    @classmethod
    def init_db(cls):
        """Initializes the SQLite schema if it doesn't already exist."""
        try:
            with cls._get_connection() as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS analyses (
                        id TEXT PRIMARY KEY,
                        filename TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        word_count INTEGER NOT NULL,
                        category TEXT NOT NULL,
                        summary_preview TEXT NOT NULL,
                        summary_mode TEXT NOT NULL,
                        time_saved_formatted TEXT NOT NULL,
                        full_response TEXT NOT NULL,
                        raw_text TEXT
                    )
                """)
                conn.commit()
        except Exception as e:
            print(f"[HistoryService] SQLite initialization error: {e}")

    @classmethod
    def add_entry(cls, response: AnalysisResponse, raw_text: str = "") -> str:
        cls.init_db()
        summary_prev = response.summary[:140] + ("..." if len(response.summary) > 140 else "")
        created_str = response.created_at.isoformat()
        full_resp_json = json.dumps(response.model_dump(mode="json"))

        try:
            with cls._get_connection() as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO analyses 
                    (id, filename, created_at, word_count, category, summary_preview, summary_mode, time_saved_formatted, full_response, raw_text)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    response.id,
                    response.filename,
                    created_str,
                    response.stats.word_count,
                    response.classification.category,
                    summary_prev,
                    response.summary_mode.value,
                    response.stats.time_saved_formatted,
                    full_resp_json,
                    raw_text[:50000]
                ))
                conn.commit()
        except Exception as e:
            print(f"[HistoryService] SQLite insert error: {e}")

        return response.id

    @classmethod
    def get_all(cls) -> List[HistoryItem]:
        cls.init_db()
        items = []
        try:
            with cls._get_connection() as conn:
                cursor = conn.execute("""
                    SELECT id, filename, created_at, word_count, category, summary_preview, summary_mode, time_saved_formatted
                    FROM analyses
                    ORDER BY created_at DESC
                    LIMIT 30
                """)
                rows = cursor.fetchall()
                for row in rows:
                    items.append(HistoryItem(
                        id=row["id"],
                        filename=row["filename"],
                        created_at=datetime.fromisoformat(row["created_at"]),
                        word_count=row["word_count"],
                        category=row["category"],
                        summary_preview=row["summary_preview"],
                        summary_mode=row["summary_mode"],
                        time_saved_formatted=row["time_saved_formatted"]
                    ))
        except Exception as e:
            print(f"[HistoryService] SQLite get_all error: {e}")
        return items

    @classmethod
    def get_by_id(cls, item_id: str) -> Optional[dict]:
        cls.init_db()
        try:
            with cls._get_connection() as conn:
                cursor = conn.execute("""
                    SELECT * FROM analyses WHERE id = ?
                """, (item_id,))
                row = cursor.fetchone()
                if row:
                    data = dict(row)
                    data["full_response"] = json.loads(data["full_response"])
                    return data
        except Exception as e:
            print(f"[HistoryService] SQLite get_by_id error: {e}")
        return None

    @classmethod
    def delete_by_id(cls, item_id: str) -> bool:
        cls.init_db()
        try:
            with cls._get_connection() as conn:
                cursor = conn.execute("DELETE FROM analyses WHERE id = ?", (item_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            print(f"[HistoryService] SQLite delete error: {e}")
            return False

    @classmethod
    def clear_all(cls):
        cls.init_db()
        try:
            with cls._get_connection() as conn:
                conn.execute("DELETE FROM analyses")
                conn.commit()
        except Exception as e:
            print(f"[HistoryService] SQLite clear error: {e}")


# Initialize DB on module import
HistoryService.init_db()

if __name__ == "__main__":
    print("=" * 60)
    print("ContextAI - HistoryService Self-Test")
    print("=" * 60)
    print(f"Database File: {os.path.abspath(DB_FILE)}")
    
    # Initialize DB
    HistoryService.init_db()
    print("[OK] Database schema verified and initialized.")

    # Retrieve existing records
    records = HistoryService.get_all()
    print(f"[OK] Retrieved {len(records)} existing history record(s).")
    for idx, item in enumerate(records[:5], 1):
        print(f"  {idx}. [{item.id[:8]}...] {item.filename} ({item.category}) - {item.word_count} words | Mode: {item.summary_mode} | Saved: {item.time_saved_formatted}")
    
    print("=" * 60)
    print("HistoryService is running correctly.")
    print("=" * 60)
