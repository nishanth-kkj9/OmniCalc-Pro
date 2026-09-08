import re
from typing import Union
from PySide6.QtWidgets import (
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QGridLayout,
    QComboBox,
    QLabel,
    QPushButton,
    QFrame,
    QSizePolicy,
)
from PySide6.QtCore import Qt
from PySide6.QtGui import QKeyEvent, QGuiApplication
from ui.widgets import CalcButton, DisplayPanel
from utils.helpers import safe_eval, save_config
from core.history_manager import get_history_manager
from utils.logger import get_logger

logger = get_logger()


def format_sci_result(val: Union[float, int, str], precision: int = 10) -> str:
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

    m_paren = re.search(r"\(-(\d+(?:\.\d+)?)\)$", expr)
    if m_paren:
        return expr[: m_paren.start()] + m_paren.group(1), False

    if expr.endswith("(-"):
        return expr[:-2], False

    if re.match(r"^-?\d+(?:\.\d+)?$", expr):
        if expr.startswith("-"):
            return expr[1:], False
        else:
            return "-" + expr, False

    m_op_num = re.search(r"([\+\−\-\×\*\÷\/\^\(])(\d+(?:\.\d+)?)$", expr)
    if m_op_num:
        op = m_op_num.group(1)
        num = m_op_num.group(2)
        return expr[: m_op_num.start()] + op + f"(-{num})", False

    if re.search(r"[\+\−\-\×\*\÷\/\^\(]$", expr):
        return expr + "(-", False

    return f"-({expr})", False


class ScientificPage(QWidget):
    def __init__(self, config=None):
        super().__init__()
        self.config = config or {}
        self.history_db = get_history_manager()
        self.expression = ""
        self.is_evaluated = False
        self.last_result = "0"
        self.memory = 0.0
        self._undo_stack = []
        self.setup_ui()

    def setup_ui(self):
        self.setFocusPolicy(Qt.FocusPolicy.StrongFocus)
        layout = QVBoxLayout(self)
        layout.setSpacing(8)
        layout.setContentsMargins(12, 12, 12, 12)

        # 1. Top Bar: Angle Mode + Memory & Utility Actions
        top_bar = QHBoxLayout()
        top_bar.setSpacing(6)

        mode_lbl = QLabel("Angle:")
        mode_lbl.setStyleSheet("font-weight: 600; color: #a0a0b8;")
        top_bar.addWidget(mode_lbl)

        self.mode_combo = QComboBox()
        self.mode_combo.addItems(["Degrees (DEG)", "Radians (RAD)", "Gradians (GRAD)"])
        current_angle = self.config.get("angle_mode", "degrees").lower()
        if "rad" in current_angle:
            self.mode_combo.setCurrentIndex(1)
        elif "grad" in current_angle:
            self.mode_combo.setCurrentIndex(2)
        else:
            self.mode_combo.setCurrentIndex(0)
        self.mode_combo.currentIndexChanged.connect(self._change_mode)
        top_bar.addWidget(self.mode_combo)

        self.mode_badge = QLabel("DEG")
        self.mode_badge.setStyleSheet(
            "background-color: #00ffaa22; color: #00ffaa; font-weight: bold; border-radius: 4px; padding: 2px 6px;"
        )
        self._update_badge_text()
        top_bar.addWidget(self.mode_badge)

        top_bar.addStretch()

        # Memory Register Label
        self.mem_label = QLabel("")
        self.mem_label.setStyleSheet("color: #ffaa00; font-weight: bold; padding: 2px 6px;")
        self.mem_label.setVisible(False)
        top_bar.addWidget(self.mem_label)

        # Memory Buttons
        for mem_op in ["MC", "MR", "M+", "M-"]:
            m_btn = QPushButton(mem_op)
            m_btn.setFixedSize(36, 26)
            m_btn.setCursor(Qt.CursorShape.PointingHandCursor)
            m_btn.setStyleSheet(
                "QPushButton { background: #252538; color: #cbd5e1; border: 1px solid #334155; border-radius: 4px; font-weight: 600; font-size: 11px; }"
                "QPushButton:hover { background: #334155; color: white; }"
            )
            m_btn.clicked.connect(lambda _, op=mem_op: self._handle_memory(op))
            top_bar.addWidget(m_btn)

        # Undo & Copy Buttons
        undo_btn = QPushButton("Undo")
        undo_btn.setFixedSize(48, 26)
        undo_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        undo_btn.setStyleSheet(
            "QPushButton { background: #252538; color: #cbd5e1; border: 1px solid #334155; border-radius: 4px; font-weight: 600; font-size: 11px; }"
            "QPushButton:hover { background: #334155; color: white; }"
        )
        undo_btn.clicked.connect(self._undo)
        top_bar.addWidget(undo_btn)

        copy_btn = QPushButton("Copy")
        copy_btn.setFixedSize(48, 26)
        copy_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        copy_btn.setStyleSheet(
            "QPushButton { background: #252538; color: #cbd5e1; border: 1px solid #334155; border-radius: 4px; font-weight: 600; font-size: 11px; }"
            "QPushButton:hover { background: #334155; color: white; }"
        )
        copy_btn.clicked.connect(self._copy_to_clipboard)
        top_bar.addWidget(copy_btn)

        layout.addLayout(top_bar)

        # 2. Display Panel
        self.display = DisplayPanel()
        layout.addWidget(self.display)

        # 3. Scientific Functions Grid (Row of Trig & Transcendental Functions)
        sci_grid = QGridLayout()
        sci_grid.setSpacing(6)

        sci_funcs = [
            ("sin", "sin("), ("cos", "cos("), ("tan", "tan("), ("(", "("), (")", ")"),
            ("asin", "asin("), ("acos", "acos("), ("atan", "atan("), ("ln", "ln("), ("log", "log("),
            ("sinh", "sinh("), ("cosh", "cosh("), ("tanh", "tanh("), ("√", "sqrt("), ("∛", "cbrt("),
            ("x!", "!"), ("xʸ", "^"), ("x²", "^2"), ("x³", "^3"), ("1/x", "^(-1)"),
            ("π", "pi"), ("e", "e"), ("|x|", "abs("), ("mod", " mod "), ("Ans", "Ans"),
        ]

        for i, (label, token) in enumerate(sci_funcs):
            r, c = divmod(i, 5)
            btn = CalcButton(label, "Func")
            btn.clicked.connect(lambda _, tok=token: self._input(tok))
            sci_grid.addWidget(btn, r, c)
        layout.addLayout(sci_grid)

        # 4. Divider Line
        line = QFrame()
        line.setFrameShape(QFrame.Shape.HLine)
        line.setStyleSheet("color: #334155;")
        layout.addWidget(line)

        # 5. Standard Numeric & Operator Keypad
        num_grid = QGridLayout()
        num_grid.setSpacing(6)

        keys = [
            ("7", "7", ""), ("8", "8", ""), ("9", "9", ""), ("÷", "/", "Op"), ("C", "C", "DangerBtn"),
            ("4", "4", ""), ("5", "5", ""), ("6", "6", ""), ("×", "*", "Op"), ("⌫", "BACKSPACE", ""),
            ("1", "1", ""), ("2", "2", ""), ("3", "3", ""), ("−", "-", "Op"), ("±", "SIGN", ""),
            ("0", "0", ""), (".", ".", ""), ("%", "%", "Op"), ("+", "+", "Op"), ("=", "=", "Op"),
        ]

        for i, (label, token, style_cls) in enumerate(keys):
            r, c = divmod(i, 5)
            btn = CalcButton(label, style_cls)
            btn.clicked.connect(lambda _, tok=token: self._input(tok))
            num_grid.addWidget(btn, r, c)
        layout.addLayout(num_grid)

    def _push_undo(self):
        self._undo_stack.append((self.expression, self.is_evaluated, self.last_result))
        if len(self._undo_stack) > 50:
            self._undo_stack.pop(0)

    def _undo(self):
        if not self._undo_stack:
            return
        expr, is_eval, last_res = self._undo_stack.pop()
        self.expression = expr
        self.is_evaluated = is_eval
        self.last_result = last_res
        self.display.setText(self.expression if self.expression else self.last_result)

    def _copy_to_clipboard(self):
        text = self.display.text()
        if text:
            clipboard = QGuiApplication.clipboard()
            clipboard.setText(text)
            self.display.flash_result(success=True)

    def _update_badge_text(self):
        idx = self.mode_combo.currentIndex()
        badges = ["DEG", "RAD", "GRAD"]
        if 0 <= idx < len(badges):
            self.mode_badge.setText(badges[idx])

    def _change_mode(self, index: int):
        modes = ["degrees", "radians", "gradians"]
        mode_val = modes[index] if 0 <= index < len(modes) else "degrees"
        self.config["angle_mode"] = mode_val
        self._update_badge_text()
        save_config(self.config)

    def _handle_memory(self, action: str):
        self._push_undo()
        try:
            curr_val = float(self.last_result if self.is_evaluated else (self.expression or "0"))
        except ValueError:
            curr_val = 0.0

        if action == "MC":
            self.memory = 0.0
            self.mem_label.setVisible(False)
            self.mem_label.setText("")
        elif action == "MR":
            mem_str = format_sci_result(self.memory)
            if self.is_evaluated:
                self.expression = mem_str
                self.is_evaluated = False
            else:
                self.expression += mem_str
            self.display.setText(self.expression)
        elif action == "M+":
            self.memory += curr_val
            self.mem_label.setText(f"M: {format_sci_result(self.memory)}")
            self.mem_label.setVisible(True)
        elif action == "M-":
            self.memory -= curr_val
            self.mem_label.setText(f"M: {format_sci_result(self.memory)}")
            self.mem_label.setVisible(True)

    def _input(self, t: str):
        self._push_undo()

        if t == "C":
            self.expression = ""
            self.is_evaluated = False
            self.display.setText("")
            return

        if t == "BACKSPACE":
            if self.is_evaluated:
                self.expression = ""
                self.is_evaluated = False
            else:
                # Remove function token if at end
                fn_match = re.search(r"(asinh|acosh|atanh|sinh|cosh|tanh|asin|acos|atan|sqrt|cbrt|log|ln|abs)\($", self.expression)
                if fn_match:
                    self.expression = self.expression[: fn_match.start()]
                else:
                    self.expression = self.expression[:-1]
            self.display.setText(self.expression)
            return

        if t == "SIGN":
            self.expression, self.is_evaluated = toggle_sign(
                self.expression, self.is_evaluated, self.last_result
            )
            self.display.setText(self.expression)
            return

        if t == "=":
            if not self.expression.strip():
                return
            mode = self.config.get("angle_mode", "degrees")
            try:
                # Replace visual symbols before evaluation
                clean_expr = self.expression.replace("Ans", str(self.last_result))
                clean_expr = clean_expr.replace("×", "*").replace("÷", "/").replace("−", "-")
                
                result = safe_eval(clean_expr, mode)
                formatted = format_sci_result(result)
                self.last_result = formatted
                
                # Add calculation to History Manager
                if self.history_db:
                    try:
                        self.history_db.add_history(self.expression, formatted, "scientific")
                    except Exception:
                        pass

                self.expression = formatted
                self.is_evaluated = True
                self.display.setText(formatted)
                self.display.flash_result(success=True)
            except Exception as e:
                logger.warning(f"Scientific evaluation failed: {e}")
                self.display.setText("Error")
                self.display.flash_result(success=False)
                self.is_evaluated = True
            return

        # Regular Token Appends
        if self.is_evaluated:
            if t in ["+", "-", "*", "/", "^", "%", "^2", "^3", "^(-1)"]:
                self.expression = self.last_result + t
            elif t == "Ans":
                self.expression = str(self.last_result)
            elif t == ".":
                self.expression = "0."
            else:
                self.expression = t
            self.is_evaluated = False
        else:
            if t == "Ans":
                self.expression += str(self.last_result)
            elif t == "!":
                # If preceding character is digit or close parenthesis, append !
                if re.search(r"[\d\)]$", self.expression):
                    self.expression += "!"
                else:
                    self.expression += "fact("
            elif t == ".":
                m = re.search(r"(\d+\.?\d*)$", self.expression)
                if m and "." in m.group(1):
                    return
                if not self.expression or re.search(r"[\+\-\*\/\^\(\,]\s*$", self.expression):
                    self.expression += "0."
                else:
                    self.expression += "."
            else:
                self.expression += t

        self.display.setText(self.expression)

    def keyPressEvent(self, event: QKeyEvent):
        key = event.key()
        text = event.text()

        if event.modifiers() & Qt.KeyboardModifier.ControlModifier:
            if key == Qt.Key.Key_Z:
                self._undo()
                return
            elif key == Qt.Key.Key_C:
                self._copy_to_clipboard()
                return

        if key in (Qt.Key.Key_Return, Qt.Key.Key_Enter, Qt.Key.Key_Equal) and text in ("", "=", "\r", "\n"):
            self._input("=")
        elif key == Qt.Key.Key_Escape:
            self._input("C")
        elif key in (Qt.Key.Key_Backspace, Qt.Key.Key_Delete):
            self._input("BACKSPACE")
        elif text in "0123456789":
            self._input(text)
        elif text == ".":
            self._input(".")
        elif text in "+-*/^%()!":
            self._input(text)
        else:
            super().keyPressEvent(event)
