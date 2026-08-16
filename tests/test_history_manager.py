import unittest
import os
import tempfile
from unittest.mock import patch

from core.history_manager import HistoryManager


class TestHistoryManager(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.temp_dir, "test_history.db")

    def _make_manager(self):
        with patch("core.history_manager.DB_DIR", self.temp_dir), \
             patch("core.history_manager.DB_PATH", self.db_path):
            return HistoryManager()

    def test_add_and_get_entries(self):
        hm = self._make_manager()
        hm.add_entry("2+2", "4")
        hm.add_entry("3*3", "9")
        entries = hm.get_all()
        self.assertEqual(len(entries), 2)
        results = {(e["expression"], e["result"]) for e in entries}
        self.assertIn(("2+2", "4"), results)
        self.assertIn(("3*3", "9"), results)
        hm.close()

    def test_get_all_limit(self):
        hm = self._make_manager()
        for i in range(10):
            hm.add_entry(str(i), str(i))
        entries = hm.get_all(limit=3)
        self.assertEqual(len(entries), 3)
        hm.close()

    def test_search(self):
        hm = self._make_manager()
        hm.add_entry("2+2", "4")
        hm.add_entry("3*3", "9")
        hm.add_entry("sin(30)", "0.5")
        results = hm.search("sin")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["expression"], "sin(30)")
        hm.close()

    def test_delete_entry(self):
        hm = self._make_manager()
        hm.add_entry("2+2", "4")
        entries = hm.get_all()
        self.assertEqual(len(entries), 1)
        hm.delete_entry(entries[0]["id"])
        self.assertEqual(len(hm.get_all()), 0)
        hm.close()

    def test_clear_all(self):
        hm = self._make_manager()
        hm.add_entry("2+2", "4")
        hm.add_entry("3*3", "9")
        hm.clear_all()
        self.assertEqual(len(hm.get_all()), 0)
        hm.close()
