from PySide6.QtWidgets import QPushButton, QLineEdit, QMenu, QWidget, QLabel, QHBoxLayout, QGraphicsOpacityEffect
from PySide6.QtCore import Qt, QTimer, QPropertyAnimation, QEasingCurve, QRect, QParallelAnimationGroup
from PySide6.QtGui import QPainter, QColor, QBrush, QPen, QFont
from utils.constants import (
    BUTTON_MIN_WIDTH, BUTTON_MIN_HEIGHT, BUTTON_PRESS_OFFSET,
    BUTTON_SCALE_ANIM_DURATION, BUTTON_OPACITY_ANIM_DURATION, BUTTON_PRESS_OPACITY,
    DISPLAY_FONT_SIZE, DISPLAY_MIN_HEIGHT, DISPLAY_PADDING_H, DISPLAY_PADDING_V,
    DISPLAY_BORDER_RADIUS, DISPLAY_FLASH_DURATION, DISPLAY_BORDER_WIDTH,
)
from utils.helpers import copy_to_clipboard, paste_from_clipboard

BUTTON_STYLES = {
    "": """
        QPushButton {
            border-radius: 10px;
            padding: 8px;
            font-weight: 600;
            background-color: #252535;
            color: #fff;
            border: none;
        }
        QPushButton:hover { background-color: #2f2f45; }
        QPushButton:pressed { background-color: #1a1a28; }
    """,
    "Op": """
        QPushButton {
            border-radius: 10px;
            padding: 8px;
            font-weight: 700;
            background-color: #2b5797;
            color: white;
            border: none;
        }
        QPushButton:hover { background-color: #3668b0; }
        QPushButton:pressed { background-color: #1e3d6b; }
    """,
    "Func": """
        QPushButton {
            border-radius: 10px;
            padding: 8px;
            font-weight: 600;
            background-color: #2d3a2d;
            color: #aaffaa;
            border: none;
        }
        QPushButton:hover { background-color: #3a4a3a; }
        QPushButton:pressed { background-color: #1d2a1d; }
    """,
    "DangerBtn": """
        QPushButton {
            border-radius: 10px;
            padding: 8px;
            font-weight: 600;
            background-color: #8b2222;
            color: #fff;
            border: none;
        }
        QPushButton:hover { background-color: #a33333; }
        QPushButton:pressed { background-color: #6b1a1a; }
    """,
}


class CalcButton(QPushButton):
    def __init__(self, text, style_class=""):
        super().__init__(text)
        self.setProperty("class", style_class)
        self.setMinimumSize(BUTTON_MIN_WIDTH, BUTTON_MIN_HEIGHT)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setStyleSheet(BUTTON_STYLES.get(style_class, BUTTON_STYLES[""]))
        self._press_animation = None
        self._setup_animations()

    def _setup_animations(self):
        self._scale_anim = QPropertyAnimation(self, b"geometry")
        self._scale_anim.setDuration(BUTTON_SCALE_ANIM_DURATION)
        self._scale_anim.setEasingCurve(QEasingCurve.Type.OutQuad)

        self._opacity_effect = QGraphicsOpacityEffect(self)
        self.setGraphicsEffect(self._opacity_effect)
        self._opacity_anim = QPropertyAnimation(self._opacity_effect, b"opacity")
        self._opacity_anim.setDuration(BUTTON_OPACITY_ANIM_DURATION)
        self._opacity_anim.setEasingCurve(QEasingCurve.Type.OutQuad)

        self.pressed.connect(self._on_pressed)
        self.released.connect(self._on_released)

    def _on_pressed(self):
        self._scale_anim.stop()
        rect = self.geometry()
        offset = BUTTON_PRESS_OFFSET
        scaled_rect = QRect(
            rect.x() + offset, rect.y() + offset,
            rect.width() - 2 * offset, rect.height() - 2 * offset
        )
        self._scale_anim.setStartValue(rect)
        self._scale_anim.setEndValue(scaled_rect)
        self._scale_anim.start()

        self._opacity_anim.stop()
        self._opacity_anim.setStartValue(1.0)
        self._opacity_anim.setEndValue(BUTTON_PRESS_OPACITY)
        self._opacity_anim.start()

    def _on_released(self):
        self._scale_anim.stop()
        rect = self.geometry()
        offset = BUTTON_PRESS_OFFSET
        original_rect = QRect(
            rect.x() - offset, rect.y() - offset,
            rect.width() + 2 * offset, rect.height() + 2 * offset
        )
        self._scale_anim.setStartValue(rect)
        self._scale_anim.setEndValue(original_rect)
        self._scale_anim.start()

        self._opacity_anim.stop()
        self._opacity_anim.setStartValue(BUTTON_PRESS_OPACITY)
        self._opacity_anim.setEndValue(1.0)
        self._opacity_anim.start()


class DisplayPanel(QLineEdit):
    def __init__(self):
        super().__init__()
        self.setReadOnly(True)
        self.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        self.setStyleSheet(f"""
            QLineEdit {{
                background-color: #1a1a24;
                color: #00ffaa;
                font-family: "Consolas", "Courier New", monospace;
                font-size: {DISPLAY_FONT_SIZE}px;
                border: {DISPLAY_BORDER_WIDTH}px solid #2a2a35;
                padding: {DISPLAY_PADDING_V}px {DISPLAY_PADDING_H}px;
                border-radius: {DISPLAY_BORDER_RADIUS}px;
                selection-background-color: #3a3a55;
                selection-color: #ffffff;
            }}
        """)
        self.setMinimumHeight(DISPLAY_MIN_HEIGHT)
        self.setContextMenuPolicy(Qt.ContextMenuPolicy.NoContextMenu)
        self._flash_animation = None
        self._original_style = self.styleSheet()

    def flash_result(self, success=True):
        """Flash the display with success/error color."""
        if self._flash_animation:
            self._flash_animation.stop()

        flash_color = "#00cc66" if success else "#e81123"
        original_border = f"{DISPLAY_BORDER_WIDTH}px solid #2a2a35"
        flash_border = f"{DISPLAY_BORDER_WIDTH}px solid {flash_color}"

        self._flash_animation = QPropertyAnimation(self, b"styleSheet")
        self._flash_animation.setDuration(DISPLAY_FLASH_DURATION)
        self._flash_animation.setStartValue(self._original_style.replace(original_border, flash_border))
        self._flash_animation.setEndValue(self._original_style)
        self._flash_animation.setEasingCurve(QEasingCurve.Type.OutQuad)
        self._flash_animation.start()

        # Also animate text color
        self._color_effect = QGraphicsOpacityEffect(self)
        self.setGraphicsEffect(self._color_effect)
        self._color_anim = QPropertyAnimation(self._color_effect, b"opacity")
        self._color_anim.setDuration(100)
        self._color_anim.setStartValue(1.0)
        self._color_anim.setEndValue(0.5)
        self._color_anim.setEasingCurve(QEasingCurve.Type.OutQuad)
        self._color_anim.finished.connect(lambda: self._color_anim.setDirection(QPropertyAnimation.Direction.Backward) or self._color_anim.start())
        self._color_anim.start()


class AnimatedButton(QPushButton):
    def __init__(self, text, style_class=""):
        super().__init__(text)
        self.setProperty("class", style_class)
        self.setMinimumSize(BUTTON_MIN_WIDTH, BUTTON_MIN_HEIGHT)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setStyleSheet(BUTTON_STYLES.get(style_class, BUTTON_STYLES[""]))
        self._anim_value = 0.0
        self._animation = QPropertyAnimation(self, b"opacity")
        self._animation.setDuration(BUTTON_OPACITY_ANIM_DURATION)
        self._animation.setStartValue(1.0)
        self._animation.setEndValue(0.7)
        self._animation.setEasingCurve(QEasingCurve.Type.OutQuad)
        self.clicked.connect(self._animate_press)

    def _animate_press(self):
        self._animation.stop()
        self._animation.setDirection(QPropertyAnimation.Direction.Forward)
        self._animation.finished.connect(lambda: self._animation.setDirection(QPropertyAnimation.Direction.Backward) or self._animation.start())
        self._animation.start()