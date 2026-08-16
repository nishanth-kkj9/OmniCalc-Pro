from PySide6.QtWidgets import QMainWindow, QWidget, QVBoxLayout, QStackedWidget, QLabel, QPushButton, QHBoxLayout, QApplication, QSystemTrayIcon, QMenu
from PySide6.QtCore import Qt, QPoint, QTimer, QPropertyAnimation, QEasingCurve, QParallelAnimationGroup, QRect
from PySide6.QtGui import QFont, QIcon, QPixmap, QPainter, QColor, QAction, QKeySequence, QShortcut
from ui.sidebar import Sidebar
from ui.widgets import CalcButton, DisplayPanel
from ui.fluent_theme import get_theme
from ui.win11_effects import apply_windows11_effects
from ui.toast import show_toast, ToastType
from utils.helpers import load_config, save_config
from utils.logger import get_logger
from core.history_manager import get_history_manager
import atexit

logger = get_logger()

_history_db = None


def _cleanup():
    global _history_db
    if _history_db:
        _history_db.close()
        logger.debug("Database connection closed on app exit.")


class CustomTitleBar(QWidget):
    def __init__(self, parent):
        super().__init__(parent)
        self.setFixedHeight(40)
        self.setStyleSheet("""
            background: qlineargradient(x1:0, y1:0, x2:1, y2:0, stop:0 #1a1a24, stop:1 #22222e);
            border-top-left-radius: 12px; border-top-right-radius: 12px;
        """)
        layout = QHBoxLayout(self)
        layout.setContentsMargins(15, 0, 5, 0)

        self.app_icon = QLabel("\U0001f4ca")
        self.app_icon.setStyleSheet("font-size: 18px;")
        layout.addWidget(self.app_icon)

        self.status_lbl = QLabel("OmniCalc Pro", styleSheet="color: #e0e0e0; font-weight: bold;")
        layout.addWidget(self.status_lbl)
        layout.addStretch()

        self.pin_btn = None
        for txt, tooltip in [("\u2500", "Minimize"), ("\u25a1", "Maximize"), ("\U0001f513", "Pin on Top"), ("\u2715", "Close")]:
            btn = QPushButton(txt)
            btn.setFixedSize(36, 30)
            btn.setToolTip(tooltip)
            if txt == "\u2715":
                btn.setStyleSheet("""
                    QPushButton { border: none; background: transparent; color: #aaa;
                                 border-radius: 4px; font-size: 14px; }
                    QPushButton:hover { background: #e81123; color: white; }
                """)
            elif txt == "\u2500":
                btn.setStyleSheet("""
                    QPushButton { border: none; background: transparent; color: #aaa;
                                 border-radius: 4px; font-size: 14px; }
                    QPushButton:hover { background: #3a3a45; color: #fff; }
                """)
            elif txt == "\u25a1":
                btn.setStyleSheet("""
                    QPushButton { border: none; background: transparent; color: #aaa;
                                 border-radius: 4px; font-size: 14px; }
                    QPushButton:hover { background: #3a3a45; color: #fff; }
                """)
            else:
                btn.setStyleSheet("""
                    QPushButton { border: none; background: transparent; color: #aaa;
                                 border-radius: 4px; font-size: 12px; }
                    QPushButton:hover { background: #3a3a45; color: #fff; }
                """)
                self.pin_btn = btn
            btn.clicked.connect(self._bind_window_btn(txt, parent, btn))
            layout.addWidget(btn)

        self.parent_win = parent
        self.dragging = False
        self.offset = QPoint()

    def _bind_window_btn(self, txt, win, btn_ref):
        if txt == "\u2500": return win.showMinimized
        if txt == "\u25a1": return lambda: win.showMaximized() if not win.isMaximized() else win.showNormal()
        if txt == "\U0001f513":
            def toggle_top():
                current = win.windowFlags()
                if current & Qt.WindowType.WindowStaysOnTopHint:
                    win.setWindowFlags(Qt.WindowType.FramelessWindowHint)
                    btn_ref.setText("\U0001f513")
                    btn_ref.setToolTip("Pin on Top")
                else:
                    win.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint)
                    btn_ref.setText("\U0001f4cc")
                    btn_ref.setToolTip("Unpin")
                win.show()
            return toggle_top
        return win.close

    def mousePressEvent(self, e):
        if e.button() == Qt.MouseButton.LeftButton:
            self.dragging = True
            self.offset = e.pos()

    def mouseMoveEvent(self, e):
        if self.dragging:
            self.parent_win.move(e.globalPos() - self.offset)

    def mouseReleaseEvent(self, e):
        self.dragging = False


class FadeStackedWidget(QStackedWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._fade_anim = QPropertyAnimation(self, b"windowOpacity", self)
        self._fade_anim.setDuration(120)
        self._fade_anim.setEasingCurve(QEasingCurve.Type.OutCubic)
        self._fade_anim.finished.connect(self._on_fade_done)
        self._pending_idx = -1

    def fade_to(self, idx: int):
        if idx == self.currentIndex():
            return
        self._pending_idx = idx
        self._fade_anim.setStartValue(1.0)
        self._fade_anim.setEndValue(0.0)
        self._fade_anim.start()

    def _on_fade_done(self):
        if self._pending_idx >= 0:
            self.setCurrentIndex(self._pending_idx)
            self._fade_anim.setStartValue(0.0)
            self._fade_anim.setEndValue(1.0)
            self._fade_anim.start()
            self._pending_idx = -1


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.config = load_config()
        self.setWindowTitle("OmniCalc Pro")
        self.resize(1150, 800)
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)

        self._win11_effects = apply_windows11_effects(self, backdrop="mica", dark_mode=True, rounded_corners=True)

        main_widget = QWidget()
        main_widget.setObjectName("main_bg")
        self.setCentralWidget(main_widget)
        v_layout = QVBoxLayout(main_widget)
        v_layout.setSpacing(0)
        v_layout.setContentsMargins(0, 0, 0, 0)

        self.title_bar = CustomTitleBar(self)
        v_layout.addWidget(self.title_bar)

        content = QWidget()
        c_layout = QHBoxLayout(content)
        c_layout.setSpacing(0)
        c_layout.setContentsMargins(0, 0, 0, 0)

        self.sidebar = Sidebar()
        self.sidebar.page_changed.connect(self.switch_page)
        c_layout.addWidget(self.sidebar)

        self.stack = FadeStackedWidget()
        c_layout.addWidget(self.stack, 1)
        v_layout.addWidget(content)

        self.page_factories = [
            ("Dashboard", lambda: __import__("ui.dashboard", fromlist=["DashboardPage"]).DashboardPage()),
            ("Basic", lambda: __import__("ui.basic_page", fromlist=["BasicPage"]).BasicPage(self.config)),
            ("Scientific", lambda: __import__("ui.scientific_page", fromlist=["ScientificPage"]).ScientificPage(self.config)),
            ("Graph", lambda: __import__("ui.graph_page", fromlist=["GraphPage"]).GraphPage()),
            ("Converter", lambda: __import__("ui.converter_page", fromlist=["ConverterPage"]).ConverterPage()),
            ("Programmer", lambda: __import__("ui.programmer_page", fromlist=["ProgrammerPage"]).ProgrammerPage()),
            ("Matrix", lambda: __import__("ui.matrix_page", fromlist=["MatrixPage"]).MatrixPage()),
            ("Statistics", lambda: __import__("ui.statistics_page", fromlist=["StatisticsPage"]).StatisticsPage()),
            ("Finance", lambda: __import__("ui.finance_page", fromlist=["FinancePage"]).FinancePage()),
            ("History", lambda: __import__("ui.history_page", fromlist=["HistoryPage"]).HistoryPage()),
            ("Settings", lambda: __import__("ui.settings_page", fromlist=["SettingsPage"]).SettingsPage())
        ]
        self.pages_created = [False] * len(self.page_factories)
        self.current_idx = -1
        self._create_page(0)
        self._update_sidebar_active(0)
        self.title_bar.status_lbl.setText("  OmniCalc Pro | Ready")
        logger.info("MainWindow initialization complete.")

        global _history_db
        _history_db = get_history_manager()
        atexit.register(_cleanup)
        logger.debug("Registered database cleanup on exit.")

        self._setup_tray()
        self._register_shortcuts()

    def _register_shortcuts(self):
        # Page navigation shortcuts (Ctrl+1 through Ctrl+0)
        for i in range(min(10, len(self.page_factories))):
            key = f"Ctrl+{i+1}" if i < 9 else "Ctrl+0"
            shortcut = QShortcut(QKeySequence(key), self)
            shortcut.activated.connect(lambda idx=i: self.switch_page(idx))

        # Theme toggle
        theme_shortcut = QShortcut(QKeySequence("Ctrl+T"), self)
        theme_shortcut.activated.connect(self._toggle_theme)

        # Copy result
        copy_shortcut = QShortcut(QKeySequence("Ctrl+C"), self)
        copy_shortcut.activated.connect(self._copy_result)

        # Paste result
        paste_shortcut = QShortcut(QKeySequence("Ctrl+V"), self)
        paste_shortcut.activated.connect(self._paste_input)

        # Clear/Escape
        clear_shortcut = QShortcut(QKeySequence("Escape"), self)
        clear_shortcut.activated.connect(self._clear_current_page)

        # Fullscreen
        fullscreen_shortcut = QShortcut(QKeySequence("F11"), self)
        fullscreen_shortcut.activated.connect(self._toggle_fullscreen)

    def _toggle_theme(self):
        app = QApplication.instance()
        if app:
            theme = get_theme(app)
            new_theme = "light" if theme.theme_name == "dark" else "dark"
            theme.apply(new_theme)
            self.config["theme"] = new_theme
            save_config(self.config)
            show_toast(self, f"Theme switched to {new_theme}", ToastType.INFO, 2000)

    def _copy_result(self):
        current_page = self.stack.currentWidget()
        if hasattr(current_page, 'copy_result'):
            current_page.copy_result()
            show_toast(self, "Result copied to clipboard", ToastType.SUCCESS, 1500)
        elif hasattr(current_page, 'display'):
            text = current_page.display.text()
            if text:
                from utils.helpers import copy_to_clipboard
                copy_to_clipboard(text)
                show_toast(self, "Copied to clipboard", ToastType.SUCCESS, 1500)

    def _paste_input(self):
        current_page = self.stack.currentWidget()
        if hasattr(current_page, 'paste_input'):
            current_page.paste_input()
        elif hasattr(current_page, 'display'):
            from utils.helpers import paste_from_clipboard
            text = paste_from_clipboard()
            if text:
                current_page.display.setText(text)
                show_toast(self, "Pasted from clipboard", ToastType.INFO, 1500)

    def _clear_current_page(self):
        current_page = self.stack.currentWidget()
        if hasattr(current_page, 'clear_expression'):
            current_page.clear_expression()
        elif hasattr(current_page, 'display'):
            current_page.display.clear()

    def _toggle_fullscreen(self):
        if self.isFullScreen():
            self.showNormal()
        else:
            self.showFullScreen()

    def _setup_tray(self):
        self.tray = QSystemTrayIcon(self)
        pixmap = QPixmap(32, 32)
        pixmap.fill(QColor(0, 255, 170))
        self.tray.setIcon(QIcon(pixmap))
        tray_menu = QMenu()
        show_action = QAction("Show OmniCalc", self)
        show_action.triggered.connect(self.show)
        tray_menu.addAction(show_action)
        self.pin_action = QAction("Pin on Top", self)
        self.pin_action.triggered.connect(self._toggle_pin)
        tray_menu.addAction(self.pin_action)
        tray_menu.addSeparator()
        quit_action = QAction("Quit", self)
        quit_action.triggered.connect(self._quit_app)
        tray_menu.addAction(quit_action)
        self.tray.setContextMenu(tray_menu)
        self.tray.setToolTip("OmniCalc Pro")
        self.tray.show()
        self.tray.activated.connect(self._trayActivated)

    def _toggle_pin(self):
        if self.windowFlags() & Qt.WindowType.WindowStaysOnTopHint:
            self.setWindowFlags(Qt.WindowType.FramelessWindowHint)
            self.pin_action.setText("Pin on Top")
        else:
            self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint)
            self.pin_action.setText("Unpin")
        self.show()
        logger.info(f"Always on top: {bool(self.windowFlags() & Qt.WindowType.WindowStaysOnTopHint)}")

    def _trayActivated(self, reason):
        if reason == QSystemTrayIcon.ActivationReason.DoubleClick:
            if self.isVisible():
                self.hide()
            else:
                self.show()

    def _quit_app(self):
        self.tray.hide()
        self.close()
        import sys
        sys.exit(0)

    def closeEvent(self, event):
        self.tray.hide()
        event.accept()
        QApplication.quit()

    def switch_page(self, idx):
        if idx == self.current_idx and self.pages_created[idx]:
            return
        self.current_idx = idx
        if not self.pages_created[idx]:
            self.title_bar.status_lbl.setText(f"  OmniCalc Pro | Loading {self.page_factories[idx][0]}...")
            self._create_page(idx)
        self.stack.fade_to(idx)
        self._update_sidebar_active(idx)
        logger.info(f"Navigated to {self.page_factories[idx][0]} (Index {idx})")
        self.title_bar.status_lbl.setText("  OmniCalc Pro | Ready")

    def _update_sidebar_active(self, idx):
        for i, btn in enumerate(self.sidebar.btn_list):
            btn.setStyleSheet("QToolButton { background: transparent; color: #aaa; }" if i != idx else "QToolButton { background: #2a2a35; color: #00ffaa; }")

    def _create_page(self, idx):
        page = self.page_factories[idx][1]()
        self.stack.addWidget(page)
        self.pages_created[idx] = True
        if idx == 10:
            page.config_changed = self.apply_config
        logger.debug(f"Lazy-loaded page: {self.page_factories[idx][0]}")

    def apply_config(self, cfg):
        self.config = cfg
        save_config(cfg)
        logger.info(f"Settings updated: Theme={cfg.get('theme')}, FontSize={cfg.get('font_size')}")
        app = QApplication.instance()
        if app:
            theme = get_theme(app)
            theme.apply(cfg.get("theme", "dark"))
            app.setFont(QFont("Segoe UI", cfg.get("font_size", 14)))
            self.title_bar.status_lbl.setText("  OmniCalc Pro | Theme Updated")