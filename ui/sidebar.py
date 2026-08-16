from PySide6.QtWidgets import QWidget, QVBoxLayout, QToolButton, QLabel, QPushButton, QFrame
from PySide6.QtCore import Qt, Signal, QPropertyAnimation, QEasingCurve, QParallelAnimationGroup, QRect
from PySide6.QtGui import QFont
from utils.constants import (
    COLLAPSED_WIDTH, EXPANDED_WIDTH, SIDEBAR_ANIM_DURATION,
    SIDEBAR_BUTTON_MIN_HEIGHT, SIDEBAR_FONT_SIZE,
    SIDEBAR_MARGIN, SIDEBAR_SPACING,
)

PAGE_NAMES = ["Dashboard", "Basic", "Scientific", "Graph", "Converter", "Programmer", "Matrix", "Statistics", "Finance", "History", "Settings"]

SIDE_ICONS = ["\U0001f3e0", "\U0001f522", "\U0001f52c", "\U0001f4c8", "\U0001f504", "\U0001f4bb", "\U0001f532", "\U0001f4ca", "\U0001f4b0", "\U0001f552", "\u2699"]


class Sidebar(QWidget):
    page_changed = Signal(int)

    def __init__(self):
        super().__init__()
        self._expanded = True
        self.btn_list = []
        self.setup_ui()

    def setup_ui(self):
        self.setFixedWidth(EXPANDED_WIDTH)
        self.setStyleSheet("""
            Sidebar {
                background-color: #15151e;
                border-right: 1px solid #252535;
            }
        """)

        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(0, SIDEBAR_MARGIN, 0, SIDEBAR_MARGIN)
        self.layout.setSpacing(SIDEBAR_SPACING)
        self.layout.setAlignment(Qt.AlignmentFlag.AlignTop)

        header = QLabel("\U0001f4ca  OmniCalc")
        header.setStyleSheet("color: #00ffaa; font-size: 16px; font-weight: bold; padding: 8px 12px;")
        self.layout.addWidget(header)

        separator = QFrame()
        separator.setFrameShape(QFrame.Shape.HLine)
        separator.setStyleSheet("color: #252535; margin: 4px 8px;")
        self.layout.addWidget(separator)

        for i, name in enumerate(PAGE_NAMES):
            btn = QToolButton()
            btn.setToolTip(name)
            btn.setText(f"  {SIDE_ICONS[i]}  {name}")
            btn.setMinimumHeight(SIDEBAR_BUTTON_MIN_HEIGHT)
            btn.setMaximumWidth(EXPANDED_WIDTH)

            f = btn.font()
            f.setPointSize(SIDEBAR_FONT_SIZE)
            btn.setFont(f)

            btn.setStyleSheet("""
                QToolButton {
                    border-radius: 10px;
                    background: transparent;
                    color: #888;
                    text-align: left;
                    padding: 0 10px;
                }
                QToolButton:hover {
                    background: #1e1e2e;
                    color: #fff;
                }
            """)
            btn.clicked.connect(lambda _, idx=i: self.page_changed.emit(idx))
            self.btn_list.append(btn)
            self.layout.addWidget(btn)

        self.layout.addStretch()

        self.collapse_btn = QPushButton("\u25c0")
        self.collapse_btn.setFixedSize(36, 36)
        self.collapse_btn.setToolTip("Collapse sidebar")
        self.collapse_btn.setStyleSheet("""
            QPushButton {
                border-radius: 10px;
                background: transparent;
                color: #666;
                font-size: 12px;
            }
            QPushButton:hover {
                background: #1e1e2e;
                color: #fff;
            }
        """)
        self.collapse_btn.clicked.connect(self.toggle_expand)
        self.layout.addWidget(self.collapse_btn, 0, Qt.AlignmentFlag.AlignCenter)

        self.animation_group = QParallelAnimationGroup()

    def toggle_expand(self):
        self._expanded = not self._expanded
        target_width = EXPANDED_WIDTH if self._expanded else COLLAPSED_WIDTH

        self.animation_group.stop()
        self.animation_group.clear()

        anim = QPropertyAnimation(self, b"fixedWidth", self)
        anim.setDuration(SIDEBAR_ANIM_DURATION)
        anim.setStartValue(self.width())
        anim.setEndValue(target_width)
        anim.setEasingCurve(QEasingCurve.Type.OutCubic)
        anim.finished.connect(self._on_animation_done)
        self.animation_group.addAnimation(anim)
        self.animation_group.start()

        for btn in self.btn_list:
            if self._expanded:
                idx = self.btn_list.index(btn)
                btn.setText(f"  {SIDE_ICONS[idx]}  {PAGE_NAMES[idx]}")
            else:
                idx = self.btn_list.index(btn)
                btn.setText(f"  {SIDE_ICONS[idx]}")

        self.collapse_btn.setText("\u25b6" if not self._expanded else "\u25c0")
        self.collapse_btn.setToolTip("Expand sidebar" if not self._expanded else "Collapse sidebar")

    def _on_animation_done(self):
        pass