from PySide6.QtWidgets import QApplication
from ui.fluent_theme import apply_theme as fluent_apply_theme


def apply_theme(app: QApplication, theme_name: str = "dark"):
    fluent_apply_theme(app, theme_name)