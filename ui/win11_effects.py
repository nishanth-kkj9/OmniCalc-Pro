"""
Windows 11 Mica/Acrylic backdrop integration using DWM API.
Provides native Windows 11 backdrop effects for frameless windows.
"""
import sys
import platform
from typing import Optional
from ctypes import windll, c_int, c_void_p, byref, sizeof, Structure, POINTER
from ctypes.wintypes import HWND, DWORD, BOOL, RECT

from PySide6.QtCore import QObject, QTimer
from PySide6.QtWidgets import QWidget
from PySide6.QtGui import QGuiApplication

from utils.logger import get_logger

logger = get_logger()

if sys.platform == "win32":
    try:
        from ctypes import WinDLL
        dwmapi = WinDLL("dwmapi")
    except Exception:
        dwmapi = None
else:
    dwmapi = None


DWMWA_USE_IMMERSIVE_DARK_MODE = 20
DWMWA_MICA_EFFECT = 1029
DWMWA_SYSTEMBACKDROP_TYPE = 38
DWMWA_WINDOW_CORNER_PREFERENCE = 33

DWMSBT_AUTO = 0
DWMSBT_NONE = 1
DWMSBT_MAINWINDOW = 2
DWMSBT_TRANSIENTWINDOW = 3
DWMSBT_TABBEDWINDOW = 4

DWMWCP_DEFAULT = 0
DWMWCP_DONOTROUND = 1
DWMWCP_ROUND = 2
DWMWCP_ROUNDSMALL = 3


class MARGINS(Structure):
    _fields_ = [
        ("cxLeftWidth", c_int),
        ("cxRightWidth", c_int),
        ("cyTopHeight", c_int),
        ("cyBottomHeight", c_int),
    ]


class Windows11Effects(QObject):
    """Manages Windows 11 Mica/Acrylic backdrop effects for Qt windows."""

    def __init__(self, widget: QWidget):
        super().__init__(widget)
        self.widget = widget
        self._hwnd: Optional[int] = None
        self._effect_enabled = False
        self._current_backdrop = DWMSBT_AUTO
        self._dark_mode = True
        self._corner_preference = DWMWCP_ROUND

        QTimer.singleShot(0, self._init_hwnd)

    def _init_hwnd(self):
        """Get the native window handle after the widget is shown."""
        if self.widget.isVisible():
            self._hwnd = int(self.widget.winId())
            self._apply_effects()
        else:
            self.widget.installEventFilter(self)

    def eventFilter(self, obj, event):
        if obj is self.widget and event.type() == event.Type.Show:
            self._hwnd = int(self.widget.winId())
            self._apply_effects()
            self.widget.removeEventFilter(self)
        return super().eventFilter(obj, event)

    def _apply_effects(self):
        """Apply all Windows 11 effects."""
        if not self._hwnd or not dwmapi or not self._is_windows_11_or_newer():
            logger.debug("Windows 11 effects not available")
            return

        try:
            self._set_dark_mode()
            self._set_mica_effect()
            self._set_corner_preference()
            self._extend_frame_into_client_area()
            self._effect_enabled = True
            logger.info("Windows 11 Mica/Acrylic effects applied successfully")
        except Exception as e:
            logger.warning(f"Failed to apply Windows 11 effects: {e}")

    def _is_windows_11_or_newer(self) -> bool:
        """Check if running on Windows 11 (build 22000+) or newer."""
        try:
            build = int(platform.version().split('.')[-1])
            return build >= 22000
        except Exception:
            return False

    def _set_dark_mode(self):
        """Enable dark mode for title bar and window frame."""
        value = c_int(1 if self._dark_mode else 0)
        dwmapi.DwmSetWindowAttribute(
            HWND(self._hwnd),
            DWORD(DWMWA_USE_IMMERSIVE_DARK_MODE),
            byref(value),
            sizeof(value)
        )

    def _set_mica_effect(self):
        """Set Mica or Acrylic backdrop type."""
        value = c_int(self._current_backdrop)
        dwmapi.DwmSetWindowAttribute(
            HWND(self._hwnd),
            DWORD(DWMWA_SYSTEMBACKDROP_TYPE),
            byref(value),
            sizeof(value)
        )

    def _set_corner_preference(self):
        """Set rounded corner preference."""
        value = c_int(self._corner_preference)
        dwmapi.DwmSetWindowAttribute(
            HWND(self._hwnd),
            DWORD(DWMWA_WINDOW_CORNER_PREFERENCE),
            byref(value),
            sizeof(value)
        )

    def _extend_frame_into_client_area(self):
        """Extend frame into client area for custom title bar."""
        margins = MARGINS(-1, -1, -1, -1)
        dwmapi.DwmExtendFrameIntoClientArea(
            HWND(self._hwnd),
            byref(margins)
        )

    def set_backdrop_type(self, backdrop_type: int):
        """Set backdrop type: DWMSBT_AUTO, DWMSBT_MAINWINDOW (Mica), DWMSBT_TRANSIENTWINDOW (Acrylic)."""
        if backdrop_type in (DWMSBT_AUTO, DWMSBT_NONE, DWMSBT_MAINWINDOW, DWMSBT_TRANSIENTWINDOW, DWMSBT_TABBEDWINDOW):
            self._current_backdrop = backdrop_type
            if self._effect_enabled:
                self._set_mica_effect()

    def set_dark_mode(self, enabled: bool):
        """Enable/disable dark mode for window frame."""
        self._dark_mode = enabled
        if self._effect_enabled:
            self._set_dark_mode()

    def set_corner_preference(self, preference: int):
        """Set corner rounding: DWMWCP_DEFAULT, DWMWCP_DONOTROUND, DWMWCP_ROUND, DWMWCP_ROUNDSMALL."""
        if preference in (DWMWCP_DEFAULT, DWMWCP_DONOTROUND, DWMWCP_ROUND, DWMWCP_ROUNDSMALL):
            self._corner_preference = preference
            if self._effect_enabled:
                self._set_corner_preference()

    def enable_mica(self):
        """Enable Mica backdrop (main window style)."""
        self.set_backdrop_type(DWMSBT_MAINWINDOW)

    def enable_acrylic(self):
        """Enable Acrylic backdrop (transient window style)."""
        self.set_backdrop_type(DWMSBT_TRANSIENTWINDOW)

    def disable_effects(self):
        """Disable all backdrop effects."""
        self.set_backdrop_type(DWMSBT_NONE)
        self._effect_enabled = False


def apply_windows11_effects(widget: QWidget, backdrop: str = "mica", dark_mode: bool = True, rounded_corners: bool = True):
    """
    Apply Windows 11 effects to a widget.
    
    Args:
        widget: The QWidget to apply effects to
        backdrop: "mica", "acrylic", "auto", or "none"
        dark_mode: Enable dark mode title bar
        rounded_corners: Enable rounded window corners
    """
    if sys.platform != "win32":
        logger.debug("Windows 11 effects only available on Windows")
        return None

    backdrop_map = {
        "mica": DWMSBT_MAINWINDOW,
        "acrylic": DWMSBT_TRANSIENTWINDOW,
        "auto": DWMSBT_AUTO,
        "none": DWMSBT_NONE,
    }

    effects = Windows11Effects(widget)
    effects._dark_mode = dark_mode
    effects._current_backdrop = backdrop_map.get(backdrop, DWMSBT_AUTO)
    effects._corner_preference = DWMWCP_ROUND if rounded_corners else DWMWCP_DONOTROUND

    if widget.isVisible():
        effects._apply_effects()

    return effects