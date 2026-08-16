import unittest
import sys
import io
import os
import json
import tempfile
from unittest.mock import MagicMock, patch, PropertyMock
from pathlib import Path


class TestStructuredFormatter(unittest.TestCase):
    def test_format_basic(self):
        from core.error_handler import StructuredFormatter
        import logging
        fmt = StructuredFormatter()
        record = logging.LogRecord(
            name="test", level=logging.INFO, pathname=__file__,
            lineno=10, msg="hello %s", args=("world",), exc_info=None
        )
        output = fmt.format(record)
        data = json.loads(output)
        self.assertEqual(data["level"], "INFO")
        self.assertEqual(data["message"], "hello world")
        self.assertEqual(data["module"], "test_error_handler")

    def test_format_with_exception(self):
        from core.error_handler import StructuredFormatter
        import logging
        fmt = StructuredFormatter()
        try:
            1 / 0
        except ZeroDivisionError:
            import traceback
            record = logging.LogRecord(
                name="test", level=logging.ERROR, pathname=__file__,
                lineno=10, msg="error", args=(), exc_info=sys.exc_info()
            )
        output = fmt.format(record)
        data = json.loads(output)
        self.assertIn("exception", data)
        self.assertIn("ZeroDivisionError", data["exception"])


class TestCrashDialog(unittest.TestCase):
    def test_class_attributes(self):
        from core.error_handler import CrashDialog
        self.assertTrue(hasattr(CrashDialog, '_restart'))
        self.assertTrue(hasattr(CrashDialog, '_close'))


class TestGlobalErrorHandler(unittest.TestCase):
    def setUp(self):
        self.qt_app_available = QApplication.instance() is not None or "pytest" in sys.modules

    @patch("core.error_handler.logger")
    def test_excepthook_logs_critical(self, mock_logger):
        app = MagicMock()
        handler = GlobalErrorHandler(app)
        handler._log_crash = MagicMock()
        handler._show_crash_dialog = MagicMock()

        try:
            1 / 0
        except ZeroDivisionError:
            import sys as _sys
            handler._excepthook(*_sys.exc_info())

        mock_logger.critical.assert_called_once()

    def test_install_uninstall(self):
        app = MagicMock()
        handler = GlobalErrorHandler(app)
        original_hook = sys.excepthook
        handler.install()
        self.assertIsNot(sys.excepthook, original_hook)
        handler.uninstall()
        self.assertIs(sys.excepthook, original_hook)

    def test_log_crash_writes_file(self):
        app = MagicMock()
        handler = GlobalErrorHandler(app)
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "crash.log"
            with patch("core.error_handler.CRASH_LOG", path):
                handler._log_crash("test msg", "test tb")
                content = path.read_text(encoding="utf-8")
                self.assertIn("test msg", content)
                self.assertIn("test tb", content)

    def test_restart_app(self):
        app = MagicMock()
        handler = GlobalErrorHandler(app)
        handler._restart_app()
        app.quit.assert_called_once()

    @patch("core.error_handler.GlobalErrorHandler")
    def test_install_global_handler(self, MockHandler):
        from core.error_handler import install_global_handler
        app = MagicMock()
        install_global_handler(app)
        MockHandler.return_value.install.assert_called_once()


from PySide6.QtWidgets import QApplication
from core.error_handler import GlobalErrorHandler
