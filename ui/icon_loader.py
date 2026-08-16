"""
SVG Icon loader with theme-aware color support.
"""
import os
from typing import Optional
from PySide6.QtGui import QIcon, QPixmap, QPainter, QColor
from PySide6.QtCore import QSize
from PySide6.QtSvg import QSvgRenderer
from utils.constants import ICONS_DIR, ICON_SIZE
from utils.logger import get_logger

logger = get_logger()

_icon_cache = {}


def load_svg_icon(icon_name: str, color: Optional[str] = None, size: int = ICON_SIZE) -> QIcon:
    """
    Load an SVG icon with optional color override.
    
    Args:
        icon_name: Name of the icon file (without .svg extension)
        color: Optional color to tint the icon (e.g., "#00ffaa", "#888")
        size: Icon size in pixels
    """
    cache_key = f"{icon_name}_{color}_{size}"
    if cache_key in _icon_cache:
        return _icon_cache[cache_key]

    svg_path = os.path.join(ICONS_DIR, f"{icon_name}.svg")
    if not os.path.exists(svg_path):
        logger.warning(f"Icon not found: {svg_path}")
        return QIcon()

    try:
        renderer = QSvgRenderer(svg_path)
        pixmap = QPixmap(size, size)
        pixmap.fill(Qt.GlobalColor.transparent)

        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        painter.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform)

        if color:
            # Create a colored version by painting with composition mode
            original_pixmap = QPixmap(size, size)
            original_pixmap.fill(Qt.GlobalColor.transparent)
            orig_painter = QPainter(original_pixmap)
            orig_painter.setRenderHint(QPainter.RenderHint.Antialiasing)
            renderer.render(orig_painter)
            orig_painter.end()

            painter.setCompositionMode(QPainter.CompositionMode.CompositionMode_SourceOver)
            painter.drawPixmap(0, 0, original_pixmap)
            painter.setCompositionMode(QPainter.CompositionMode.CompositionMode_SourceIn)
            painter.fillRect(0, 0, size, size, QColor(color))
        else:
            renderer.render(painter)

        painter.end()
        icon = QIcon(pixmap)
        _icon_cache[cache_key] = icon
        return icon

    except Exception as e:
        logger.error(f"Failed to load SVG icon {icon_name}: {e}")
        return QIcon()


def get_sidebar_icons():
    """Return mapping of page names to icon names for sidebar."""
    return {
        "Dashboard": "dashboard",
        "Basic": "basic",
        "Scientific": "scientific",
        "Graph": "graph",
        "Converter": "converter",
        "Programmer": "programmer",
        "Matrix": "matrix",
        "Statistics": "statistics",
        "Finance": "finance",
        "History": "history",
        "Settings": "settings",
    }


def get_toolbar_icons():
    """Return mapping of toolbar actions to icon names."""
    return {
        "minimize": "minimize",
        "maximize": "maximize",
        "close": "close",
        "pin": "pin",
        "unpin": "unpin",
    }


def clear_icon_cache():
    """Clear the icon cache (useful on theme change)."""
    global _icon_cache
    _icon_cache.clear()

from PySide6.QtCore import Qt