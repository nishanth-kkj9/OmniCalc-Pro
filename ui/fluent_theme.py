"""
Fluent/Windows 11 Theme Engine - Mica/Acrylic background, semantic color tokens, runtime switching.
"""
import os
import sys
import json
from typing import Optional
from pathlib import Path

from PySide6.QtGui import QPalette, QColor, QFont
from PySide6.QtWidgets import QApplication
from PySide6.QtCore import Qt

from utils.constants import ASSETS_DIR
from utils.logger import get_logger

logger = get_logger()

DARK_TOKENS = {
    "bg_primary": "#1e1e24",
    "bg_secondary": "#15151e",
    "bg_surface": "#252535",
    "bg_card": "#1c1c28",
    "bg_input": "#1a1a24",
    "text_primary": "#e0e0e0",
    "text_secondary": "#8892a0",
    "text_accent": "#00ffaa",
    "border": "#2a2a3a",
    "border_focus": "#00ffaa",
    "hover": "#2f2f45",
    "pressed": "#1a1a28",
    "accent": "#00ffaa",
    "accent_hover": "#00cc88",
    "danger": "#e81123",
    "danger_hover": "#ff3333",
    "success": "#00cc66",
    "warning": "#ffaa00",
    "scrollbar_bg": "transparent",
    "scrollbar_handle": "#3a3a4d",
    "shadow": "rgba(0,0,0,0.3)",
    "titlebar_bg_start": "#1a1a24",
    "titlebar_bg_end": "#22222e",
    "sidebar_bg": "#15151e",
    "sidebar_hover": "#1e1e2e",
    "sidebar_active": "#2a2a35",
}

LIGHT_TOKENS = {
    "bg_primary": "#f4f6f9",
    "bg_secondary": "#ffffff",
    "bg_surface": "#ffffff",
    "bg_card": "#ffffff",
    "bg_input": "#ffffff",
    "text_primary": "#2c3e50",
    "text_secondary": "#64748b",
    "text_accent": "#2563eb",
    "border": "#d0d5e0",
    "border_focus": "#3b82f6",
    "hover": "#eef1f5",
    "pressed": "#e0e5ec",
    "accent": "#3b82f6",
    "accent_hover": "#2563eb",
    "danger": "#dc2626",
    "danger_hover": "#b91c1c",
    "success": "#059669",
    "warning": "#d97706",
    "scrollbar_bg": "transparent",
    "scrollbar_handle": "#94a3b8",
    "shadow": "rgba(0,0,0,0.1)",
    "titlebar_bg_start": "#ffffff",
    "titlebar_bg_end": "#f8fafc",
    "sidebar_bg": "#ffffff",
    "sidebar_hover": "#f1f5f9",
    "sidebar_active": "#e2e8f0",
}

BASE_QSS_DARK = """
QWidget#main_bg { background-color: %(bg_primary)s; }
QWidget { color: %(text_primary)s; font-family: "Segoe UI", sans-serif; font-size: 14px; }
QPushButton { background-color: %(bg_surface)s; color: %(text_primary)s; border: none; border-radius: 12px; padding: 8px; font-weight: 600; }
QPushButton:hover { background-color: %(hover)s; }
QPushButton:pressed { background-color: %(pressed)s; }
QPushButton[class="Op"] { background-color: #2b5797; }
QPushButton[class="Op"]:hover { background-color: #3668b0; }
QPushButton[class="Func"] { background-color: #2d3a2d; color: #aaffaa; }
QPushButton[class="DangerBtn"] { background-color: #8b2222; }
QPushButton[class="DangerBtn"]:hover { background-color: #a33333; }
QLineEdit, QComboBox, QTextEdit, QTableWidget { background-color: %(bg_input)s; border: 1px solid %(border)s; border-radius: 10px; color: %(text_primary)s; padding: 8px; }
QComboBox::drop-down { background: %(bg_surface)s; width: 25px; border-radius: 0 10px 10px 0; }
QLabel#Title { color: %(text_primary)s; font-size: 22px; font-weight: bold; }
QLabel#Subtitle { color: %(text_secondary)s; font-size: 14px; }
QScrollBar:vertical { background: transparent; width: 8px; margin: 4px; }
QScrollBar::handle:vertical { background: %(scrollbar_handle)s; border-radius: 4px; min-height: 20px; }
QSplitter::handle { background: %(border)s; }
QToolTip { background: %(bg_surface)s; color: %(text_primary)s; border: 1px solid %(border)s; border-radius: 6px; padding: 4px; }
"""

BASE_QSS_LIGHT = """
QWidget#main_bg { background-color: %(bg_primary)s; }
QWidget { color: %(text_primary)s; font-family: "Segoe UI", sans-serif; font-size: 14px; }
QPushButton { background-color: %(bg_surface)s; color: %(text_primary)s; border: 1px solid %(border)s; border-radius: 12px; padding: 8px; font-weight: 600; }
QPushButton:hover { background-color: %(hover)s; border-color: %(accent)s; }
QPushButton:pressed { background-color: %(pressed)s; }
QPushButton[class="Op"] { background-color: %(accent)s; color: white; border: 1px solid %(accent_hover)s; }
QPushButton[class="Op"]:hover { background-color: %(accent_hover)s; }
QPushButton[class="Func"] { background-color: #d1fae5; color: #059669; border: 1px solid #a7f3d0; }
QPushButton[class="DangerBtn"] { background-color: #fee2e2; color: %(danger)s; border: 1px solid #fca5a5; }
QPushButton[class="DangerBtn"]:hover { background-color: #fecaca; }
QLineEdit, QComboBox, QTextEdit, QTableWidget { background-color: %(bg_input)s; border: 1px solid %(border)s; border-radius: 10px; color: %(text_primary)s; padding: 8px; }
QComboBox::drop-down { background: %(bg_secondary)s; width: 25px; border-radius: 0 10px 10px 0; }
QLabel#Title { color: %(text_primary)s; font-size: 22px; font-weight: bold; }
QLabel#Subtitle { color: %(text_secondary)s; font-size: 14px; }
QScrollBar:vertical { background: transparent; width: 8px; margin: 4px; }
QScrollBar::handle:vertical { background: %(scrollbar_handle)s; border-radius: 4px; min-height: 20px; }
QSplitter::handle { background: %(border)s; }
QToolTip { background: %(bg_surface)s; color: %(text_primary)s; border: 1px solid %(border)s; border-radius: 6px; padding: 4px; }
"""


class FluentTheme:
    """Theme manager with semantic color tokens and runtime switching."""

    def __init__(self, app: QApplication):
        self.app = app
        self._theme_name = "dark"
        self._tokens = dict(DARK_TOKENS)
        self._qss_cache = ""

    @property
    def theme_name(self) -> str:
        return self._theme_name

    def get(self, key: str, default: str = "") -> str:
        return self._tokens.get(key, default)

    def apply(self, theme_name: str = "dark") -> None:
        self._theme_name = theme_name
        tokens = DARK_TOKENS if theme_name == "dark" else LIGHT_TOKENS
        self._tokens = dict(tokens)

        qss_template = BASE_QSS_DARK if theme_name == "dark" else BASE_QSS_LIGHT
        self._qss_cache = qss_template % self._tokens

        self.app.setStyleSheet(self._qss_cache)

        palette = QPalette()
        if theme_name == "dark":
            palette.setColor(QPalette.ColorRole.Window, QColor(tokens["bg_primary"]))
            palette.setColor(QPalette.ColorRole.WindowText, QColor(tokens["text_primary"]))
            palette.setColor(QPalette.ColorRole.Base, QColor(tokens["bg_input"]))
            palette.setColor(QPalette.ColorRole.AlternateBase, QColor(tokens["bg_card"]))
            palette.setColor(QPalette.ColorRole.ToolTipBase, QColor(tokens["bg_surface"]))
            palette.setColor(QPalette.ColorRole.ToolTipText, QColor(tokens["text_primary"]))
            palette.setColor(QPalette.ColorRole.Text, QColor(tokens["text_primary"]))
            palette.setColor(QPalette.ColorRole.Button, QColor(tokens["bg_surface"]))
            palette.setColor(QPalette.ColorRole.ButtonText, QColor(tokens["text_primary"]))
            palette.setColor(QPalette.ColorRole.BrightText, Qt.GlobalColor.red)
            palette.setColor(QPalette.ColorRole.Link, QColor(tokens["accent"]))
            palette.setColor(QPalette.ColorRole.Highlight, QColor(tokens["accent"]))
            palette.setColor(QPalette.ColorRole.HighlightedText, Qt.GlobalColor.black)
        else:
            palette.setColor(QPalette.ColorRole.Window, QColor(tokens["bg_primary"]))
            palette.setColor(QPalette.ColorRole.WindowText, QColor(tokens["text_primary"]))
            palette.setColor(QPalette.ColorRole.Base, QColor(tokens["bg_input"]))
            palette.setColor(QPalette.ColorRole.AlternateBase, QColor(tokens["bg_card"]))
            palette.setColor(QPalette.ColorRole.ToolTipBase, QColor(tokens["bg_surface"]))
            palette.setColor(QPalette.ColorRole.ToolTipText, QColor(tokens["text_primary"]))
            palette.setColor(QPalette.ColorRole.Text, QColor(tokens["text_primary"]))
            palette.setColor(QPalette.ColorRole.Button, QColor(tokens["bg_surface"]))
            palette.setColor(QPalette.ColorRole.ButtonText, QColor(tokens["text_primary"]))
            palette.setColor(QPalette.ColorRole.BrightText, Qt.GlobalColor.red)
            palette.setColor(QPalette.ColorRole.Link, QColor(tokens["accent"]))
            palette.setColor(QPalette.ColorRole.Highlight, QColor(tokens["accent"]))
            palette.setColor(QPalette.ColorRole.HighlightedText, Qt.GlobalColor.white)

        self.app.setPalette(palette)
        logger.info(f"FluentTheme applied: {theme_name}")


_theme_instance: Optional[FluentTheme] = None


def get_theme(app: Optional[QApplication] = None) -> FluentTheme:
    global _theme_instance
    if _theme_instance is None and app is not None:
        _theme_instance = FluentTheme(app)
    return _theme_instance


def apply_theme(app: QApplication, theme_name: str = "dark") -> None:
    theme = get_theme(app)
    theme.apply(theme_name)