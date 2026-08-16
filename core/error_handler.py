"""
Global Error Handling & Crash Recovery.

Provides: sys.excepthook, QApplication.notify override, crash dialog, structured logging.
"""
import sys
import traceback
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from PySide6.QtWidgets import QApplication, QMessageBox, QDialog, QVBoxLayout, QTextEdit, QPushButton, QHBoxLayout
from PySide6.QtCore import Qt, QObject, QEvent

from utils.logger import get_logger
from utils.constants import BASE_DIR

logger = get_logger()

LOG_DIR = Path(BASE_DIR) / "logs"
LOG_DIR.mkdir(exist_ok=True)
CRASH_LOG = LOG_DIR / "crash.log"
ERROR_LOG = LOG_DIR / "error.log"


class StructuredFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        data = {
            "timestamp": datetime.now().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        if record.exc_info:
            data["exception"] = self.formatException(record.exc_info)
        return json.dumps(data)


def setup_structured_logging() -> None:
    """Configure structured JSON logging to files."""
    crash_handler = logging.FileHandler(CRASH_LOG)
    crash_handler.setLevel(logging.ERROR)
    crash_handler.setFormatter(StructuredFormatter())

    error_handler = logging.FileHandler(ERROR_LOG)
    error_handler.setLevel(logging.WARNING)
    error_handler.setFormatter(StructuredFormatter())

    root = logging.getLogger()
    root.addHandler(crash_handler)
    root.addHandler(error_handler)


class CrashDialog(QDialog):
    """User-friendly crash dialog with report/restart/close options."""

    def __init__(self, error_msg: str, traceback_str: str, parent=None):
        super().__init__(parent)
        self.setWindowTitle("OmniCalc Pro - Unexpected Error")
        self.setModal(True)
        self.resize(600, 400)
        self.setWindowFlags(self.windowFlags() & ~Qt.WindowContextHelpButtonHint)

        layout = QVBoxLayout(self)

        layout.addWidget(QMessageBox(self))
        msg = QLabel("OmniCalc Pro encountered an unexpected error and needs to close.")
        msg.setWordWrap(True)
        msg.setStyleSheet("font-size: 14px; padding: 10px;")
        layout.addWidget(msg)

        details = QTextEdit()
        details.setReadOnly(True)
        details.setPlainText(f"Error: {error_msg}\n\nTraceback:\n{traceback_str}")
        details.setStyleSheet("font-family: monospace; font-size: 11px;")
        layout.addWidget(details)

        btn_layout = QHBoxLayout()
        btn_layout.addStretch()

        copy_btn = QPushButton("Copy Details")
        copy_btn.clicked.connect(lambda: QApplication.clipboard().setText(details.toPlainText()))
        btn_layout.addWidget(copy_btn)

        restart_btn = QPushButton("Restart App")
        restart_btn.setDefault(True)
        restart_btn.clicked.connect(self._restart)
        btn_layout.addWidget(restart_btn)

        close_btn = QPushButton("Close")
        close_btn.clicked.connect(self._close)
        btn_layout.addWidget(close_btn)

        layout.addLayout(btn_layout)

    def _restart(self) -> None:
        self.done(1)

    def _close(self) -> None:
        self.done(0)


class GlobalErrorHandler(QObject):
    """Global exception handler with Qt integration."""

    def __init__(self, app: QApplication):
        super().__init__()
        self.app = app
        self._original_hook = sys.excepthook
        self._original_notify = app.notify
        self._handling = False

    def install(self) -> None:
        sys.excepthook = self._excepthook
        self.app.notify = self._notify

    def uninstall(self) -> None:
        sys.excepthook = self._original_hook
        self.app.notify = self._original_notify

    def _excepthook(self, exc_type, exc_value, exc_tb) -> None:
        if self._handling:
            self._original_hook(exc_type, exc_value, exc_tb)
            return

        self._handling = True
        try:
            tb_str = "".join(traceback.format_exception(exc_type, exc_value, exc_tb))
            msg = f"{exc_type.__name__}: {exc_value}"

            logger.critical(f"Uncaught exception: {msg}\n{tb_str}")
            self._log_crash(msg, tb_str)

            if QApplication.instance():
                self._show_crash_dialog(msg, tb_str)
            else:
                print(f"FATAL: {msg}\n{tb_str}", file=sys.stderr)
        finally:
            self._handling = False

    def _notify(self, receiver: QObject, event: QEvent) -> bool:
        try:
            return self._original_notify(receiver, event)
        except Exception as e:
            tb_str = "".join(traceback.format_exc())
            msg = f"{type(e).__name__}: {e}"
            logger.error(f"Qt event exception: {msg}\n{tb_str}")
            self._log_crash(msg, tb_str)
            self._show_crash_dialog(msg, tb_str)
            return False

    def _log_crash(self, msg: str, tb: str) -> None:
        try:
            with open(CRASH_LOG, "a", encoding="utf-8") as f:
                f.write(f"\n{'='*60}\n")
                f.write(f"CRASH: {datetime.now().isoformat()}\n")
                f.write(f"{msg}\n{tb}\n")
        except Exception:
            pass

    def _show_crash_dialog(self, msg: str, tb: str) -> None:
        try:
            dialog = CrashDialog(msg, tb)
            result = dialog.exec()
            if result == 1:
                self._restart_app()
            else:
                self.app.quit()
        except Exception:
            self.app.quit()

    def _restart_app(self) -> None:
        import subprocess
        import os
        try:
            python = sys.executable
            script = os.path.abspath(sys.argv[0])
            subprocess.Popen([python, script])
        except Exception:
            pass
        finally:
            self.app.quit()


def install_global_handler(app: QApplication) -> GlobalErrorHandler:
    handler = GlobalErrorHandler(app)
    handler.install()
    setup_structured_logging()
    return handler