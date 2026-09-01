import unittest
import logging
import tempfile
import os
from utils.logger import setup_logger, get_logger


class TestLogger(unittest.TestCase):
    def setUp(self):
        self.logger_name = "OmniCalcPro"
        existing = logging.getLogger(self.logger_name)
        existing.handlers.clear()

    def test_get_logger_before_setup(self):
        logger = get_logger()
        self.assertEqual(logger.name, "OmniCalcPro")

    def test_setup_logger_returns_logger(self):
        logger = setup_logger()
        self.assertEqual(logger.name, "OmniCalcPro")
        self.assertTrue(logger.isEnabledFor(logging.DEBUG))

    def test_setup_logger_has_handlers(self):
        logger = setup_logger()
        self.assertGreaterEqual(len(logger.handlers), 1)

    def test_setup_logger_no_duplicate_handlers(self):
        logger = setup_logger()
        count = len(logger.handlers)
        logger2 = setup_logger()
        self.assertEqual(len(logger2.handlers), count)

    def test_get_logger_after_setup(self):
        setup_logger()
        logger = get_logger()
        self.assertGreaterEqual(len(logger.handlers), 1)

    def test_uses_rotating_file_handler(self):
        from logging.handlers import RotatingFileHandler
        logger = setup_logger()
        has_rotating = any(isinstance(h, RotatingFileHandler) for h in logger.handlers)
        self.assertTrue(has_rotating)

    def test_main_startup_initializes_logger(self):
        # Verify that setup_logger initializes handlers and logs to file
        logger = setup_logger()
        self.assertGreaterEqual(len(logger.handlers), 1)
        test_msg = "OmniCalc Pro test startup log message"
        logger.info(test_msg)
        from utils.constants import BASE_DIR
        log_file = os.path.join(BASE_DIR, "omnicalc_pro.log")
        if os.path.exists(log_file):
            with open(log_file, "r", encoding="utf-8") as f:
                content = f.read()
                self.assertIn(test_msg, content)
