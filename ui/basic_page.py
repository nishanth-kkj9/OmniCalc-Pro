import re
from typing import Union
from PySide6.QtWidgets import (
    QWidget,
    QVBoxLayout,
    QGridLayout,
    QSizePolicy,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QFrame,
)
from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QKeyEvent, QGuiApplication, QFont
from ui.widgets import CalcButton, DisplayPanel
from utils.helpers import safe_eval
from core.history_manager import get_history_manager
from utils.logger import get_logger

logger = get_logger()


def format_result(val: Union[float, int, str], precision: int = 10) -> str:
    if isinstance(val, (int, float)):
        if float(val) == 0.0:
            return "0"
        if isinstance(val, float) and val.is_integer():
            return str(int(val))
        rounded = round(float(val), precision)
        if rounded.is_integer():
            return str(int(rounded))
        return f"{rounded:.{precision}g}"
    return str(val)


def toggle_sign(expr: str, is_evaluated: bool = False, current_result: str = "0") -> tuple[str, bool]:
    if is_evaluated:
        if current_result in ("0", "", "Error", "NaN", "Infinity", "-Infinity"):
            return expr, False
        if current_result.startswith("-"):
            res = current_result[1:]
        else:
            res = "-" + current_result
        return res, False

    if not expr:
        return "-", False
    if expr == "-":
        return "", False

    # Trailing parenthesized negative number e.g. 12+(-5) -> 12+5
    m_paren = re.search(r"\(-(\d+(?:\.\d+)?)\)$", expr)
    if m_paren:
        return expr[: m_paren.start()] + m_paren.group(1), False

    # Trailing (- e.g. 12+(- -> 12+
    if expr.endswith("(-"):
        return expr[:-2], False

    # If entire expression is a single number (e.g. 5 or -5)
    if re.match(r"^-?\d+(?:\.\d+)?$", expr):
        if expr.startswith("-"):
            return expr[1:], False
        else:
            return "-" + expr, False

    # Trailing number preceded by operator or open paren e.g. 12+5 -> 12+(-5)
    m_op_num = re.search(r"([\+\−\-\×\*\÷\/\^\(])(\d+(?:\.\d+)?)$", expr)
    if m_op_num:
        op = m_op_num.group(1)
        num = m_op_num.group(2)
        return expr[: m_op_num.start()] + op + f"(-{num})", False

    # If ending with an operator e.g. 12+ -> 12+(-
    if re.search(r"[\+\−\-\×\*\÷\/\^\(]$", expr):
        return expr + "(-", False

    return f"-({expr})", False


class BasicPage(QWidget):
    def __init__(self, config=None):
        super().__init__()
        self.config = config or {}
        self.history_db = get_history_manager()
        self.expression = ""
        self.is_evaluated = False
        self.last_result = "0"
        self.memory = 0.0
        self._undo_stack = []
        self._history_cursor = -1
        self.setup_ui()

    def setup_ui(self):
        self.setFocusPolicy(Qt.FocusPolicy.StrongFocus)
        layout = QVBoxLayout(self)
        layout.setSpacing(10)
        layout.setContentsMargins(12, 12, 12, 12)

        # 1. Memory Bar
        mem_layout = QHBoxLayout()
        mem_layout.setSpacing(8)
        mem_btns = ["MC", "MR", "M+", "M-"]
        self.mem_btns = {}
        for m in mem_btns:
            btn = CalcButton(m, "Func")
            btn.setMinimumHeight(32)
            btn.clicked.connect(lambda _, t=m: self._input(t))
            self.mem_btns[m] = btn
            mem_layout.addWidget(btn)

        mem_layout.addStretch()

        # Active Memory Indicator Badge
        self.mem_label = QLabel("M = 0")
        self.mem_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.mem_label.setStyleSheet(
            "QLabel { background-color: rgba(56, 189, 248, 0.15); "
            "color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); "
            "border-radius: 6px; padding: 2px 8px; font-weight: bold; font-size: 11px; }"
        )
        self.mem_label.setVisible(False)
        mem_layout.addWidget(self.mem_label)
        layout.addLayout(mem_layout)

        # 2. Display Card
        display_frame = QFrame()
        display_frame.setFrameShape(QFrame.Shape.StyledPanel)
        display_frame.setStyleSheet(
            "QFrame { background-color: #1e293b; border: 1px solid #334155; "
            "border-radius: 12px; padding: 8px; }"
        )
        disp_layout = QVBoxLayout(display_frame)
        disp_layout.setContentsMargins(10, 8, 10, 8)
        disp_layout.setSpacing(4)

        # Secondary row: expression crumb + undo/copy utility actions
        top_disp_row = QHBoxLayout()
        self.expr_label = QLabel("")
        self.expr_label.setStyleSheet("color: #94a3b8; font-family: monospace; font-size: 13px;")
        top_disp_row.addWidget(self.expr_label, stretch=1)

        self.undo_btn = QPushButton("Undo")
        self.undo_btn.setFixedSize(56, 26)
        self.undo_btn.setEnabled(False)
        self.undo_btn.setStyleSheet(
            "QPushButton { background: #334155; color: #f1f5f9; border-radius: 4px; font-size: 11px; } "
            "QPushButton:hover { background: #475569; } "
            "QPushButton:disabled { color: #64748b; background: #1e293b; }"
        )
        self.undo_btn.clicked.connect(self.handle_undo)
        top_disp_row.addWidget(self.undo_btn)

        self.copy_btn = QPushButton("Copy")
        self.copy_btn.setFixedSize(56, 26)
        self.copy_btn.setStyleSheet(
            "QPushButton { background: #334155; color: #f1f5f9; border-radius: 4px; font-size: 11px; } "
            "QPushButton:hover { background: #475569; }"
        )
        self.copy_btn.clicked.connect(self.handle_copy)
        top_disp_row.addWidget(self.copy_btn)

        disp_layout.addLayout(top_disp_row)

        # Main result line
        self.display = DisplayPanel()
        self.display.setText("0")
        disp_layout.addWidget(self.display)
        layout.addWidget(display_frame)

        # 3. Main Keypad Grid (6 rows x 4 cols, matching Web)
        grid = QGridLayout()
        grid.setSpacing(10)

        # (row, col, label, action, style_class)
        btn_defs = [
            # Row 0: Destructive & Parentheses
            (0, 0, "AC", "C", "DangerBtn"),
            (0, 1, "(", "(", "Func"),
            (0, 2, ")", ")", "Func"),
            (0, 3, "\u232b", "\u232b", "DangerBtn"),
            # Row 1: Math functions & Divide
            (1, 0, "\u221a", "\u221a", "Func"),
            (1, 1, "%", "%", "Func"),
            (1, 2, "x\u02e0", "^", "Func"),
            (1, 3, "\u00f7", "\u00f7", "Op"),
            # Row 2: 7 8 9 Multiply
            (2, 0, "7", "7", ""),
            (2, 1, "8", "8", ""),
            (2, 2, "9", "9", ""),
            (2, 3, "\u00d7", "\u00d7", "Op"),
            # Row 3: 4 5 6 Subtract
            (3, 0, "4", "4", ""),
            (3, 1, "5", "5", ""),
            (3, 2, "6", "6", ""),
            (3, 3, "\u2212", "\u2212", "Op"),
            # Row 4: 1 2 3 Add
            (4, 0, "1", "1", ""),
            (4, 1, "2", "2", ""),
            (4, 2, "3", "3", ""),
            (4, 3, "+", "+", "Op"),
            # Row 5: ± 0 . Equals (Equals prominent bottom-right)
            (5, 0, "\u00b1", "\u00b1", "Func"),
            (5, 1, "0", "0", ""),
            (5, 2, ".", ".", ""),
            (5, 3, "=", "=", "Op"),
        ]

        self.buttons = {}
        for r, c, lbl, act, cls in btn_defs:
            btn = CalcButton(lbl, cls)
            btn.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
            btn.clicked.connect(lambda _, a=act: self._input(a))
            grid.addWidget(btn, r, c)
            self.buttons[lbl] = btn
            if act == "C":
                self.clear_btn = btn

        layout.addLayout(grid)

    def _push_undo(self):
        state = (self.expression, self.is_evaluated, self.last_result)
        if not self._undo_stack or self._undo_stack[-1] != state:
            self._undo_stack.append(state)
            if len(self._undo_stack) > 50:
                self._undo_stack.pop(0)
            if hasattr(self, "undo_btn"):
                self.undo_btn.setEnabled(True)

    def handle_undo(self):
        if self._undo_stack:
            prev_expr, prev_eval, prev_res = self._undo_stack.pop()
            self.expression = prev_expr
            self.is_evaluated = prev_eval
            self.last_result = prev_res
            self.display.setText(self.expression if self.expression else "0")
            self.expr_label.setText(f"{self.expression} =" if self.is_evaluated else "")
            self._update_clear_button()
            if hasattr(self, "undo_btn"):
                self.undo_btn.setEnabled(len(self._undo_stack) > 0)

    def handle_copy(self):
        val_to_copy = self.display.text() or self.expression or "0"
        app = QGuiApplication.instance()
        if app:
            clipboard = app.clipboard()
            if clipboard:
                clipboard.setText(val_to_copy)
        if hasattr(self, "copy_btn"):
            self.copy_btn.setText("Copied!")
            QTimer.singleShot(
                1500,
                lambda: self.copy_btn.setText("Copy") if hasattr(self, "copy_btn") else None,
            )

    def _update_clear_button(self):
        if hasattr(self, "clear_btn"):
            self.clear_btn.setText("C" if self.expression else "AC")

    def _update_memory_label(self):
        if hasattr(self, "mem_label"):
            if self.memory != 0.0:
                self.mem_label.setText(f"M = {format_result(self.memory)}")
                self.mem_label.setVisible(True)
            else:
                self.mem_label.setText("M = 0")
                self.mem_label.setVisible(False)

    def _input(self, t):
        if t in ("C", "AC"):
            self._push_undo()
            self.expression = ""
            self.is_evaluated = False
            self.last_result = "0"
            self._history_cursor = -1
            self.display.setText("0")
            self.expr_label.setText("")
            self._update_clear_button()
            logger.debug("Cleared calculator")
            return

        if t == "\u232b":  # Backspace
            self._push_undo()
            if self.is_evaluated or self.expression in ("Error", "-"):
                self.expression = ""
                self.is_evaluated = False
                self.last_result = "0"
                self.display.setText("0")
                self.expr_label.setText("")
            elif self.expression:
                if self.expression.endswith("sqrt("):
                    self.expression = self.expression[:-5]
                elif self.expression.endswith("√(") or self.expression.endswith("(-"):
                    self.expression = self.expression[:-2]
                else:
                    self.expression = self.expression[:-1]
                self.display.setText(self.expression if self.expression else "0")
            self._update_clear_button()
            return

        if t == "\u00b1":  # ±
            self._push_undo()
            new_expr, _ = toggle_sign(self.expression, self.is_evaluated, self.last_result)
            self.expression = new_expr
            self.is_evaluated = False
            self.display.setText(self.expression if self.expression else "0")
            self._update_clear_button()
            return

        if t == "=":
            if not self.expression.strip():
                return
            if self.is_evaluated:
                return

            self._push_undo()
            logger.info(f"Executing: {self.expression}")
            try:
                res = safe_eval(self.expression, self.config.get("angle_mode", "degrees"))
                if isinstance(res, str) and res.startswith("Error:"):
                    self.expression = "Error"
                    self.last_result = "Error"
                    self.is_evaluated = True
                    self.display.setText("Error")
                    self.display.flash_result(success=False)
                else:
                    formatted = format_result(res)
                    self.history_db.add_entry(self.expression, formatted)
                    self.expr_label.setText(f"{self.expression} =")
                    self.last_result = formatted
                    self.expression = formatted
                    self.is_evaluated = True
                    self.display.setText(formatted)
                    self.display.flash_result(success=True)
                    self._history_cursor = -1
                    logger.info(f"Result: {formatted}")
            except Exception as e:
                logger.warning(f"Calc failed: {e}")
                self.expression = "Error"
                self.last_result = "Error"
                self.is_evaluated = True
                self.display.setText("Error")
                self.display.flash_result(success=False)

            self._update_clear_button()
            return

        if t == "MC":
            self.memory = 0.0
            self._update_memory_label()
            logger.debug("Memory cleared")
            return

        if t == "MR":
            self._push_undo()
            mem_str = format_result(self.memory)
            if self.is_evaluated:
                self.expression = mem_str
                self.is_evaluated = False
            elif not self.expression or re.search(r"[\+\−\-\×\*\÷\/\^\(]$", self.expression):
                self.expression += mem_str
            else:
                self.expression = mem_str
            self.display.setText(self.expression)
            self._update_clear_button()
            return

        if t in ("M+", "M-"):
            val_to_eval = self.last_result if self.is_evaluated else (self.expression or "0")
            try:
                val = safe_eval(val_to_eval, self.config.get("angle_mode", "degrees"))
                if isinstance(val, (int, float)):
                    if t == "M+":
                        self.memory += float(val)
                    else:
                        self.memory -= float(val)
                    self._update_memory_label()
                    logger.debug(f"{t}: {val}, memory now: {self.memory}")
            except Exception as e:
                logger.debug(f"{t} failed: {e}")
            return

        # Regular inputs
        self._push_undo()

        if t in ("\u221a", "√"):
            if self.is_evaluated:
                self.expression = "√("
                self.is_evaluated = False
            else:
                self.expression += "√("
            self.display.setText(self.expression)
            self._update_clear_button()
            return

        if t == "%":
            if self.expression and not re.search(r"[\+\−\-\×\*\÷\/\^\(\%]$", self.expression):
                self.expression += "%"
                self.display.setText(self.expression)
            self._update_clear_button()
            return

        if t == ".":
            if self.is_evaluated or self.expression == "Error":
                self.expression = "0."
                self.is_evaluated = False
            elif not self.expression:
                self.expression = "0."
            else:
                tokens = re.split(r"[\+\−\-\×\*\÷\/\^\(\)]", self.expression)
                cur_token = tokens[-1] if tokens else ""
                if "." in cur_token:
                    return
                if re.search(r"[\+\−\-\×\*\÷\/\^\(]$", self.expression):
                    self.expression += "0."
                else:
                    self.expression += "."
            self.display.setText(self.expression)
            self._update_clear_button()
            return

        if t in ("0", "1", "2", "3", "4", "5", "6", "7", "8", "9"):
            if self.is_evaluated or self.expression == "Error":
                self.expression = t
                self.is_evaluated = False
            elif self.expression == "0":
                self.expression = t
            else:
                self.expression += t
            self.display.setText(self.expression)
            self._update_clear_button()
            return

        if t in ("+", "-", "−", "*", "×", "/", "÷", "^"):
            norm_op = {"*": "\u00d7", "/": "\u00f7", "-": "\u2212"}.get(t, t)
            if self.is_evaluated:
                if self.last_result not in ("Error", "NaN", "Infinity", "-Infinity"):
                    self.expression = self.last_result + norm_op
                else:
                    self.expression = "0" + norm_op
                self.is_evaluated = False
            elif not self.expression:
                if norm_op == "\u2212":
                    self.expression = "\u2212"
                else:
                    self.expression = "0" + norm_op
            elif re.search(r"[\+\−\×\÷\^]$", self.expression):
                self.expression = self.expression[:-1] + norm_op
            else:
                self.expression += norm_op
            self.display.setText(self.expression)
            self._update_clear_button()
            return

        if t == "(":
            if self.is_evaluated:
                self.expression = "("
                self.is_evaluated = False
            else:
                self.expression += "("
            self.display.setText(self.expression)
            self._update_clear_button()
            return

        if t == ")":
            open_count = self.expression.count("(")
            close_count = self.expression.count(")")
            if open_count <= close_count or re.search(r"[\+\−\×\÷\^\(]$", self.expression):
                return
            self.expression += ")"
            self.display.setText(self.expression)
            self._update_clear_button()
            return

        # Fallback
        self.expression += t
        self.display.setText(self.expression)
        self._update_clear_button()

    def keyPressEvent(self, event: QKeyEvent):
        key = event.key()
        text = event.text()

        # Ctrl+Z Undo
        if (event.modifiers() & Qt.KeyboardModifier.ControlModifier) and key == Qt.Key.Key_Z:
            self.handle_undo()
            return

        # Ctrl+C Copy
        if (event.modifiers() & Qt.KeyboardModifier.ControlModifier) and key == Qt.Key.Key_C:
            self.handle_copy()
            return

        # Up/Down History Navigation
        if key == Qt.Key.Key_Up:
            try:
                entries = self.history_db.get_all(limit=25)
                if entries:
                    self._history_cursor = min(self._history_cursor + 1, len(entries) - 1)
                    row = entries[self._history_cursor]
                    self.expression = row["expression"]
                    self.last_result = row["result"]
                    self.is_evaluated = True
                    self.expr_label.setText(f"{self.expression} =")
                    self.display.setText(self.last_result)
                    self._update_clear_button()
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
                        self.last_result = row["result"]
                        self.is_evaluated = True
                        self.expr_label.setText(f"{self.expression} =")
                        self.display.setText(self.last_result)
                        self._update_clear_button()
                elif self._history_cursor == 0:
                    self._history_cursor = -1
                    self.expression = ""
                    self.last_result = "0"
                    self.is_evaluated = False
                    self.expr_label.setText("")
                    self.display.setText("0")
                    self._update_clear_button()
            except Exception as e:
                logger.debug(f"History Down navigation failed: {e}")
            return

        if key in (Qt.Key.Key_Return, Qt.Key.Key_Enter, Qt.Key.Key_Equal):
            self._input("=")
        elif key == Qt.Key.Key_Escape:
            self._input("C")
        elif key in (Qt.Key.Key_Backspace, Qt.Key.Key_Delete):
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
            self._input("^")
        else:
            super().keyPressEvent(event)

    def closeEvent(self, event):
        try:
            self._undo_stack.clear()
        except Exception:
            pass
        super().closeEvent(event)
