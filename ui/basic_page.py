from PySide6.QtWidgets import QWidget, QVBoxLayout, QGridLayout, QSizePolicy, QHBoxLayout
from PySide6.QtCore import Qt
from PySide6.QtGui import QKeyEvent
from ui.widgets import CalcButton, DisplayPanel
from utils.helpers import safe_eval
from core.history_manager import get_history_manager
from utils.logger import get_logger

logger = get_logger()

class BasicPage(QWidget):
    def __init__(self, config):
        super().__init__()
        self.config = config
        self.history_db = get_history_manager()
        self.expression = ""
        self.memory = 0.0
        self._undo_stack = []
        self._history_cursor = -1
        self.setup_ui()

    def setup_ui(self):
        self.setFocusPolicy(Qt.FocusPolicy.StrongFocus)
        layout = QVBoxLayout(self)
        layout.setSpacing(10)

        mem_layout = QHBoxLayout()
        mem_btns = ["MC", "MR", "M+", "M-"]
        self.mem_btns = {}
        for m in mem_btns:
            btn = CalcButton(m, "Func")
            btn.setMinimumHeight(35)
            btn.clicked.connect(lambda _, t=m: self._input(t))
            self.mem_btns[m] = btn
            mem_layout.addWidget(btn)
        mem_layout.addStretch()
        self.mem_label = CalcButton("M: 0", "Func")
        self.mem_label.setEnabled(False)
        self.mem_label.setMinimumHeight(35)
        mem_layout.addWidget(self.mem_label)
        layout.addLayout(mem_layout)

        self.display = DisplayPanel()
        layout.addWidget(self.display)

        grid = QGridLayout()
        grid.setSpacing(12)

        btns = [
            (0, 0, "C", 1, 1, "DangerBtn"), (0, 1, "\u232b", 1, 1, "DangerBtn"), (0, 2, "(", 1, 1, "Func"), (0, 3, ")", 1, 1, "Func"),
            (1, 0, "7"), (1, 1, "8"), (1, 2, "9"), (1, 3, "\u00f7", 1, 1, "Op"),
            (2, 0, "4"), (2, 1, "5"), (2, 2, "6"), (2, 3, "\u00d7", 1, 1, "Op"),
            (3, 0, "1"), (3, 1, "2"), (3, 2, "3"), (3, 3, "\u2212", 1, 1, "Op"),
            (4, 0, "0"), (4, 1, "."), (4, 2, "=", 1, 1, "Op"), (4, 3, "+", 1, 1, "Op"),
            (5, 0, "%", 1, 1, "Func"), (5, 1, "x\u00b2", 1, 1, "Func"), (5, 2, "\u221a", 1, 1, "Func"), (5, 3, "\u00b1", 1, 1, "Func")
        ]
        
        for b in btns:
            r = int(b[0])
            c = int(b[1])
            txt = str(b[2])
            rs = int(b[3]) if len(b) > 3 else 1
            cs = int(b[4]) if len(b) > 4 else 1
            cls = str(b[5]) if len(b) > 5 else ""
            
            btn = CalcButton(txt, cls)
            btn.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
            btn.clicked.connect(lambda _, t=txt: self._input(t))
            grid.addWidget(btn, r, c, rs, cs)
            
        layout.addLayout(grid)

    def _input(self, t):
        if t not in ("MC", "MR", "M+", "M-"):
            if not self._undo_stack or self._undo_stack[-1] != self.expression:
                self._undo_stack.append(self.expression)
                if len(self._undo_stack) > 50:
                    self._undo_stack.pop(0)

        if t == "C":
            self.expression = ""
            self._history_cursor = -1
            logger.debug("Cleared calculator")
        elif t == "\u232b":
            self.expression = self.expression[:-1]
        elif t == "\u00b1":
            if self.expression:
                try:
                    res = safe_eval(f"({self.expression})*-1", self.config.get("angle_mode", "degrees"))
                    self.expression = str(res)
                except (ValueError, TypeError, ZeroDivisionError, OverflowError):
                    self.expression = f"({self.expression})*-1"
        elif t == "=":
            logger.info(f"Executing: {self.expression}")
            try:
                res = safe_eval(self.expression, self.config.get("angle_mode", "degrees"))
                self.history_db.add_entry(self.expression, str(res))
                logger.info(f"Result: {res}")
                self.expression = str(res)
                self.display.flash_result(success=True)
                self._history_cursor = -1
            except Exception as e:
                logger.warning(f"Calc failed: {e}")
                self.expression = "Error"
                self.display.flash_result(success=False)
        elif t == "x\u00b2":
            self.expression += "^2"
        elif t == "\u221a":
            self.expression += "sqrt("
        elif t == "MC":
            self.memory = 0.0
            self._update_memory_label()
            logger.debug("Memory cleared")
        elif t == "MR":
            self.expression += str(self.memory)
        elif t == "M+":
            try:
                current = safe_eval(self.expression or "0", self.config.get("angle_mode", "degrees"))
                self.memory += float(current)
                self._update_memory_label()
                logger.debug(f"M+: {current}, memory now: {self.memory}")
            except (ValueError, TypeError, ZeroDivisionError, OverflowError):
                pass
        elif t == "M-":
            try:
                current = safe_eval(self.expression or "0", self.config.get("angle_mode", "degrees"))
                self.memory -= float(current)
                self._update_memory_label()
                logger.debug(f"M-: {current}, memory now: {self.memory}")
            except (ValueError, TypeError, ZeroDivisionError, OverflowError):
                pass
        else:
            self.expression += t

        self.display.setText(self.expression)
        self._update_memory_label()

    def _update_memory_label(self):
        if hasattr(self, 'mem_label'):
            self.mem_label.setText(f"M: {self.memory}")

    def keyPressEvent(self, event):
        key = event.key()
        text = event.text()

        # Ctrl+Z Undo
        if (event.modifiers() & Qt.KeyboardModifier.ControlModifier) and key == Qt.Key.Key_Z:
            if self._undo_stack:
                self.expression = self._undo_stack.pop()
                self.display.setText(self.expression)
            return

        # Up/Down history navigation
        if key == Qt.Key.Key_Up:
            try:
                entries = self.history_db.get_all(limit=25)
                if entries:
                    self._history_cursor = min(self._history_cursor + 1, len(entries) - 1)
                    row = entries[self._history_cursor]
                    self.expression = row["expression"]
                    self.display.setText(self.expression)
            except Exception as e:
                logger.debug(f"History Up navigation failed: {e}")
            return
        elif key == Qt.Key.Key_Down:
            try:
                if self._history_cursor > 0:
                    self._history_cursor -= 1
                    entries = self.history_db.get_all(limit=25)
                    if entries:
                        row = entries[self._history_cursor]
                        self.expression = row["expression"]
                        self.display.setText(self.expression)
                elif self._history_cursor == 0:
                    self._history_cursor = -1
                    self.expression = ""
                    self.display.setText("")
            except Exception as e:
                logger.debug(f"History Down navigation failed: {e}")
            return

        if key == Qt.Key.Key_Return or key == Qt.Key.Key_Equal:
            self._input("=")
        elif key == Qt.Key.Key_Escape:
            self._input("C")
        elif key == Qt.Key.Key_Backspace or key == Qt.Key.Key_Delete:
            self._input("\u232b")
        elif text in "0123456789":
            self._input(text)
        elif text == ".":
            self._input(".")
        elif text in "+-*/":
            self._input(text)
        elif text in "()":
            self._input(text)
        elif text == "%":
            self._input("%")
        elif text == "^":
            self._input("x\u00b2")
        else:
            super().keyPressEvent(event)