"""
Toast notification system for OmniCalc Pro.
Provides non-intrusive, animated notifications with multiple types.
"""
from enum import Enum
from typing import Optional
from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel, QHBoxLayout, QPushButton
from PySide6.QtWidgets import QGraphicsOpacityEffect
from PySide6.QtCore import Qt, QTimer, QPropertyAnimation, QEasingCurve, QRect, QPoint, Signal
from PySide6.QtGui import QFont, QColor, QPainter, QBrush, QPen, QPixmap, QIcon
from utils.logger import get_logger
from utils.constants import (
    TOAST_WIDTH, TOAST_FADE_DURATION, TOAST_SLIDE_IN_DURATION,
    TOAST_SLIDE_OUT_DURATION, TOAST_MARGIN, TOAST_SPACING,
    TOAST_DEFAULT_DURATION, TOAST_ICON_SIZE, TOAST_CLOSE_SIZE,
)

logger = get_logger()


class ToastType(Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"


TOAST_COLORS = {
    ToastType.INFO: {
        "bg": "#2d3a4f",
        "border": "#3b82f6",
        "icon_color": "#3b82f6",
        "text": "#e0e0e0",
    },
    ToastType.SUCCESS: {
        "bg": "#1e3a2e",
        "border": "#00cc66",
        "icon_color": "#00cc66",
        "text": "#e0e0e0",
    },
    ToastType.WARNING: {
        "bg": "#3a3a1e",
        "border": "#ffaa00",
        "icon_color": "#ffaa00",
        "text": "#e0e0e0",
    },
    ToastType.ERROR: {
        "bg": "#3a1e1e",
        "border": "#e81123",
        "icon_color": "#e81123",
        "text": "#e0e0e0",
    },
}

TOAST_ICONS = {
    ToastType.INFO: "info",
    ToastType.SUCCESS: "check-circle",
    ToastType.WARNING: "alert-triangle",
    ToastType.ERROR: "x-circle",
}


class Toast(QWidget):
    """Individual toast notification widget."""

    closed = Signal()

    def __init__(self, message: str, toast_type: ToastType = ToastType.INFO, duration: int = TOAST_DEFAULT_DURATION, parent=None):
        super().__init__(parent)
        self.message = message
        self.toast_type = toast_type
        self.duration = duration
        self._setup_ui()
        self._setup_animations()

    def _setup_ui(self):
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint |
            Qt.WindowType.Tool |
            Qt.WindowType.WindowStaysOnTopHint |
            Qt.WindowType.NoDropShadowWindowHint
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setAttribute(Qt.WidgetAttribute.WA_ShowWithoutActivating)
        self.setFixedWidth(TOAST_WIDTH)

        colors = TOAST_COLORS[self.toast_type]

        self.container = QWidget()
        self.container.setStyleSheet(f"""
            QWidget {{
                background-color: {colors['bg']};
                border: 1px solid {colors['border']};
                border-radius: 10px;
            }}
        """)

        layout = QHBoxLayout(self.container)
        layout.setContentsMargins(14, 12, 14, 12)
        layout.setSpacing(12)

        # Icon
        self.icon_label = QLabel()
        self.icon_label.setFixedSize(TOAST_ICON_SIZE, TOAST_ICON_SIZE)
        self.icon_label.setStyleSheet(f"color: {colors['icon_color']};")
        layout.addWidget(self.icon_label)

        # Message
        self.message_label = QLabel(self.message)
        self.message_label.setWordWrap(True)
        self.message_label.setStyleSheet(f"color: {colors['text']}; font-size: 13px; font-weight: 500;")
        layout.addWidget(self.message_label, 1)

        # Close button
        self.close_btn = QPushButton("✕")
        self.close_btn.setFixedSize(TOAST_CLOSE_SIZE, TOAST_CLOSE_SIZE)
        self.close_btn.setStyleSheet(f"""
            QPushButton {{
                border: none;
                background: transparent;
                color: {colors['text']};
                font-size: 12px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                color: {colors['border']};
            }}
        """)
        self.close_btn.clicked.connect(self._close)
        layout.addWidget(self.close_btn)

        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.addWidget(self.container)

        self.opacity_effect = QGraphicsOpacityEffect(self)
        self.setGraphicsEffect(self.opacity_effect)

    def _setup_animations(self):
        self.fade_in = QPropertyAnimation(self.opacity_effect, b"opacity")
        self.fade_in.setDuration(TOAST_FADE_DURATION)
        self.fade_in.setStartValue(0.0)
        self.fade_in.setEndValue(1.0)
        self.fade_in.setEasingCurve(QEasingCurve.Type.OutCubic)

        self.fade_out = QPropertyAnimation(self.opacity_effect, b"opacity")
        self.fade_out.setDuration(TOAST_FADE_DURATION)
        self.fade_out.setStartValue(1.0)
        self.fade_out.setEndValue(0.0)
        self.fade_out.setEasingCurve(QEasingCurve.Type.InCubic)
        self.fade_out.finished.connect(self._on_fade_out_finished)

        self.slide_in = QPropertyAnimation(self, b"pos")
        self.slide_in.setDuration(TOAST_SLIDE_IN_DURATION)
        self.slide_in.setEasingCurve(QEasingCurve.Type.OutCubic)

        self.slide_out = QPropertyAnimation(self, b"pos")
        self.slide_out.setDuration(TOAST_SLIDE_OUT_DURATION)
        self.slide_out.setEasingCurve(QEasingCurve.Type.InCubic)

    def show_at(self, pos: QPoint):
        self.move(pos)
        self.show()
        self.fade_in.start()

        if self.duration > 0:
            QTimer.singleShot(self.duration, self.close)

    def close(self):
        self.fade_out.start()
        self.slide_out.setStartValue(self.pos())
        self.slide_out.setEndValue(QPoint(self.pos().x() + 50, self.pos().y()))
        self.slide_out.start()

    def _on_fade_out_finished(self):
        self.hide()
        self.closed.emit()
        self.deleteLater()

    def _close(self):
        self.close()


class ToastManager(QWidget):
    """Manages toast notifications, positioning and stacking."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.toasts = []
        self.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint)

    def show_toast(self, message: str, toast_type: ToastType = ToastType.INFO, duration: int = TOAST_DEFAULT_DURATION):
        toast = Toast(message, toast_type, duration, self)
        toast.closed.connect(lambda t=toast: self._on_toast_closed(t))
        self.toasts.append(toast)
        self._reposition_toasts()
        return toast

    def _on_toast_closed(self, toast: Toast):
        if toast in self.toasts:
            self.toasts.remove(toast)
        self._reposition_toasts()

    def _reposition_toasts(self):
        if not self.parent():
            return

        parent_rect = self.parent().rect()
        margin = TOAST_MARGIN
        spacing = TOAST_SPACING
        y = parent_rect.height() - margin

        for toast in reversed(self.toasts):
            toast.adjustSize()
            x = parent_rect.width() - toast.width() - margin
            y -= toast.height()
            toast.show_at(QPoint(x, y))
            y -= spacing

    def resizeEvent(self, event):
        super().resizeEvent(event)
        self._reposition_toasts()


def get_toast_manager(parent=None) -> ToastManager:
    """Get or create a toast manager for the parent widget."""
    if not hasattr(parent, '_toast_manager'):
        parent._toast_manager = ToastManager(parent)
    return parent._toast_manager


def show_toast(parent, message: str, toast_type: ToastType = ToastType.INFO, duration: int = TOAST_DEFAULT_DURATION):
    """Convenience function to show a toast notification."""
    manager = get_toast_manager(parent)
    return manager.show_toast(message, toast_type, duration)