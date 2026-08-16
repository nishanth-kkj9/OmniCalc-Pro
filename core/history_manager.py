import sqlite3
import os
import threading
from datetime import datetime
from utils.constants import DB_DIR, DB_PATH
from utils.logger import get_logger

logger = get_logger()

_instance = None
_lock = threading.Lock()


def get_history_manager() -> "HistoryManager":
    global _instance
    if _instance is None:
        with _lock:
            if _instance is None:
                _instance = HistoryManager()
    return _instance


class HistoryManager:
    def __init__(self):
        os.makedirs(DB_DIR, exist_ok=True)
        self.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._init_db()
        logger.debug(f"HistoryManager initialized. DB: {DB_PATH}")

    def _init_db(self):
        with self.conn:
            self.conn.execute("PRAGMA journal_mode=WAL")
            self.conn.execute("PRAGMA synchronous=NORMAL")
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    expression TEXT,
                    result TEXT,
                    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """)
            self.conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_history_timestamp
                ON history(timestamp DESC)
            """)

    def add_entry(self, expression, result):
        try:
            with self.conn:
                self.conn.execute(
                    "INSERT INTO history (expression, result) VALUES (?, ?)",
                    (expression, str(result))
                )
            logger.debug(f"History added: {expression} = {result}")
        except Exception as e:
            logger.error(f"Failed to add history: {e}")

    def get_all(self, limit=500):
        logger.debug(f"Fetching last {limit} history entries")
        return self.conn.execute(
            "SELECT * FROM history ORDER BY timestamp DESC LIMIT ?", (limit,)
        ).fetchall()

    def search(self, query):
        logger.debug(f"Searching history for: '{query}'")
        return self.conn.execute(
            "SELECT * FROM history WHERE expression LIKE ? OR result LIKE ? ORDER BY timestamp DESC",
            (f"%{query}%", f"%{query}%")
        ).fetchall()

    def delete_entry(self, entry_id):
        try:
            with self.conn:
                self.conn.execute("DELETE FROM history WHERE id = ?", (entry_id,))
            logger.debug(f"Deleted history entry ID: {entry_id}")
        except Exception as e:
            logger.error(f"Failed to delete history: {e}")

    def clear_all(self):
        try:
            with self.conn:
                self.conn.execute("DELETE FROM history")
                self.conn.execute("DELETE FROM sqlite_sequence WHERE name='history'")
            logger.info("All history cleared.")
        except Exception as e:
            logger.error(f"Failed to clear history: {e}")

    def close(self):
        try:
            self.conn.close()
            logger.debug("History database connection closed.")
        except Exception:
            pass

    def __del__(self):
        self.close()