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
        self.is_2nd = False
        self.is_hyp = False
        self._undo_stack = []
        self._dynamic_buttons = {}
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

        # 3. Scientific & Numeric Keypad (Unified 5 Columns x 7 Rows Grid matching Web)
        grid = QGridLayout()
        grid.setSpacing(6)

        # Row 1: 2nd, hyp, sin, cos, tan
        self.btn_2nd = CalcButton("2nd", "Func")
        self.btn_2nd.clicked.connect(self._toggle_2nd)
        grid.addWidget(self.btn_2nd, 0, 0)

        self.btn_hyp = CalcButton("hyp", "Func")
        self.btn_hyp.clicked.connect(self._toggle_hyp)
        grid.addWidget(self.btn_hyp, 0, 1)

        self.btn_sin = CalcButton("sin", "Func")
        self.btn_sin.clicked.connect(self._input_sin)
        grid.addWidget(self.btn_sin, 0, 2)
        self._dynamic_buttons["sin"] = self.btn_sin

        self.btn_cos = CalcButton("cos", "Func")
        self.btn_cos.clicked.connect(self._input_cos)
        grid.addWidget(self.btn_cos, 0, 3)
        self._dynamic_buttons["cos"] = self.btn_cos

        self.btn_tan = CalcButton("tan", "Func")
        self.btn_tan.clicked.connect(self._input_tan)
        grid.addWidget(self.btn_tan, 0, 4)
        self._dynamic_buttons["tan"] = self.btn_tan

        # Row 2: ln/eˣ, log/10ˣ, xʸ/x², √/∛, C
        self.btn_ln = CalcButton("ln", "Func")
        self.btn_ln.clicked.connect(lambda: self._input("e^(" if self.is_2nd else "ln("))
        grid.addWidget(self.btn_ln, 1, 0)
        self._dynamic_buttons["ln"] = self.btn_ln

        self.btn_log = CalcButton("log", "Func")
        self.btn_log.clicked.connect(lambda: self._input("10^(" if self.is_2nd else "log("))
        grid.addWidget(self.btn_log, 1, 1)
        self._dynamic_buttons["log"] = self.btn_log

        self.btn_pow = CalcButton("xʸ", "Func")
        self.btn_pow.clicked.connect(lambda: self._input("^2" if self.is_2nd else "^"))
        grid.addWidget(self.btn_pow, 1, 2)
        self._dynamic_buttons["pow"] = self.btn_pow

        self.btn_root = CalcButton("√", "Func")
        self.btn_root.clicked.connect(lambda: self._input("cbrt(" if self.is_2nd else "sqrt("))
        grid.addWidget(self.btn_root, 1, 3)
        self._dynamic_buttons["root"] = self.btn_root

        btn_c = CalcButton("C", "DangerBtn")
        btn_c.clicked.connect(lambda: self._input("C"))
        grid.addWidget(btn_c, 1, 4)

        # Row 3: (, ), n!/nCr, 1/x / |x|, ÷
        btn_lparen = CalcButton("(", "Func")
        btn_lparen.clicked.connect(lambda: self._input("("))
        grid.addWidget(btn_lparen, 2, 0)

        btn_rparen = CalcButton(")", "Func")
        btn_rparen.clicked.connect(lambda: self._input(")"))
        grid.addWidget(btn_rparen, 2, 1)

        self.btn_fact = CalcButton("n!", "Func")
        self.btn_fact.clicked.connect(lambda: self._input("ncr(" if self.is_2nd else "!"))
        grid.addWidget(self.btn_fact, 2, 2)
        self._dynamic_buttons["fact"] = self.btn_fact

        self.btn_inv = CalcButton("1/x", "Func")
        self.btn_inv.clicked.connect(lambda: self._input("abs(" if self.is_2nd else "^(-1)"))
        grid.addWidget(self.btn_inv, 2, 3)
        self._dynamic_buttons["inv"] = self.btn_inv

        btn_div = CalcButton("÷", "Op")
        btn_div.clicked.connect(lambda: self._input("/"))
        grid.addWidget(btn_div, 2, 4)

        # Row 4: π/τ, 7, 8, 9, ×
        self.btn_pi = CalcButton("π", "Func")
        self.btn_pi.clicked.connect(lambda: self._input("tau" if self.is_2nd else "pi"))
        grid.addWidget(self.btn_pi, 3, 0)
        self._dynamic_buttons["pi"] = self.btn_pi

        for col, num in enumerate(["7", "8", "9"]):
            n_btn = CalcButton(num, "")
            n_btn.clicked.connect(lambda _, n=num: self._input(n))
            grid.addWidget(n_btn, 3, 1 + col)

        btn_mul = CalcButton("×", "Op")
        btn_mul.clicked.connect(lambda: self._input("*"))
        grid.addWidget(btn_mul, 3, 4)

        # Row 5: e/2ˣ, 4, 5, 6, −
        self.btn_e = CalcButton("e", "Func")
        self.btn_e.clicked.connect(lambda: self._input("2^(" if self.is_2nd else "e"))
        grid.addWidget(self.btn_e, 4, 0)
        self._dynamic_buttons["e"] = self.btn_e

        for col, num in enumerate(["4", "5", "6"]):
            n_btn = CalcButton(num, "")
            n_btn.clicked.connect(lambda _, n=num: self._input(n))
            grid.addWidget(n_btn, 4, 1 + col)

        btn_sub = CalcButton("−", "Op")
        btn_sub.clicked.connect(lambda: self._input("-"))
        grid.addWidget(btn_sub, 4, 4)

        # Row 6: mod/nPr, 1, 2, 3, +
        self.btn_mod = CalcButton("mod", "Func")
        self.btn_mod.clicked.connect(lambda: self._input("npr(" if self.is_2nd else " mod "))
        grid.addWidget(self.btn_mod, 5, 0)
        self._dynamic_buttons["mod"] = self.btn_mod

        for col, num in enumerate(["1", "2", "3"]):
            n_btn = CalcButton(num, "")
            n_btn.clicked.connect(lambda _, n=num: self._input(n))
            grid.addWidget(n_btn, 5, 1 + col)

        btn_add = CalcButton("+", "Op")
        btn_add.clicked.connect(lambda: self._input("+"))
        grid.addWidget(btn_add, 5, 4)

        # Row 7: ± / ,, 0, ., ⌫, =
        self.btn_sign = CalcButton("±", "Func")
        self.btn_sign.clicked.connect(lambda: self._input("," if self.is_2nd else "SIGN"))
        grid.addWidget(self.btn_sign, 6, 0)
        self._dynamic_buttons["sign"] = self.btn_sign

        btn_0 = CalcButton("0", "")
        btn_0.clicked.connect(lambda: self._input("0"))
        grid.addWidget(btn_0, 6, 1)

        btn_dot = CalcButton(".", "")
        btn_dot.clicked.connect(lambda: self._input("."))
        grid.addWidget(btn_dot, 6, 2)

        btn_bs = CalcButton("⌫", "Func")
        btn_bs.clicked.connect(lambda: self._input("BACKSPACE"))
        grid.addWidget(btn_bs, 6, 3)

        btn_eq = CalcButton("=", "Op")
        btn_eq.setStyleSheet(
            "QPushButton { background: #0284c7; color: white; font-weight: bold; font-size: 16px; border-radius: 10px; }"
            "QPushButton:hover { background: #0369a1; }"
            "QPushButton:pressed { background: #075985; }"
        )
        btn_eq.clicked.connect(lambda: self._input("="))
        grid.addWidget(btn_eq, 6, 4)

        layout.addLayout(grid)

    def _toggle_2nd(self):
        self.is_2nd = not self.is_2nd
        if self.is_2nd:
            self.btn_2nd.setStyleSheet(
                "QPushButton { background: #d97706; color: white; font-weight: bold; border-radius: 10px; }"
                "QPushButton:hover { background: #b45309; }"
            )
        else:
            self.btn_2nd.setStyleSheet(
                "QPushButton { background: #2d3a2d; color: #aaffaa; font-weight: 600; border-radius: 10px; border: none; }"
                "QPushButton:hover { background: #3a4a3a; }"
            )
        self._update_dynamic_buttons()

    def _toggle_hyp(self):
        self.is_hyp = not self.is_hyp
        if self.is_hyp:
            self.btn_hyp.setStyleSheet(
                "QPushButton { background: #0891b2; color: white; font-weight: bold; border-radius: 10px; }"
                "QPushButton:hover { background: #0e7490; }"
            )
        else:
            self.btn_hyp.setStyleSheet(
                "QPushButton { background: #2d3a2d; color: #aaffaa; font-weight: 600; border-radius: 10px; border: none; }"
                "QPushButton:hover { background: #3a4a3a; }"
            )
        self._update_dynamic_buttons()

    def _update_dynamic_buttons(self):
        # Update Trig Buttons
        if self.is_hyp and self.is_2nd:
            self.btn_sin.setText("sinh⁻¹")
            self.btn_cos.setText("cosh⁻¹")
            self.btn_tan.setText("tanh⁻¹")
        elif self.is_hyp:
            self.btn_sin.setText("sinh")
            self.btn_cos.setText("cosh")
            self.btn_tan.setText("tanh")
        elif self.is_2nd:
            self.btn_sin.setText("sin⁻¹")
            self.btn_cos.setText("cos⁻¹")
            self.btn_tan.setText("tan⁻¹")
        else:
            self.btn_sin.setText("sin")
            self.btn_cos.setText("cos")
            self.btn_tan.setText("tan")

        # Update 2nd Mode Secondary Function Labels
        if self.is_2nd:
            self.btn_ln.setText("eˣ")
            self.btn_log.setText("10ˣ")
            self.btn_pow.setText("x²")
            self.btn_root.setText("∛")
            self.btn_fact.setText("nCr")
            self.btn_inv.setText("|x|")
            self.btn_pi.setText("τ")
            self.btn_e.setText("2ˣ")
            self.btn_mod.setText("nPr")
            self.btn_sign.setText(",")
        else:
            self.btn_ln.setText("ln")
            self.btn_log.setText("log")
            self.btn_pow.setText("xʸ")
            self.btn_root.setText("√")
            self.btn_fact.setText("n!")
            self.btn_inv.setText("1/x")
            self.btn_pi.setText("π")
            self.btn_e.setText("e")
            self.btn_mod.setText("mod")
            self.btn_sign.setText("±")

    def _input_sin(self):
        if self.is_hyp and self.is_2nd:
            self._input("asinh(")
        elif self.is_hyp:
            self._input("sinh(")
        elif self.is_2nd:
            self._input("asin(")
        else:
            self._input("sin(")

    def _input_cos(self):
        if self.is_hyp and self.is_2nd:
            self._input("acosh(")
        elif self.is_hyp:
            self._input("cosh(")
        elif self.is_2nd:
            self._input("acos(")
        else:
            self._input("cos(")

    def _input_tan(self):
        if self.is_hyp and self.is_2nd:
            self._input("atanh(")
        elif self.is_hyp:
            self._input("tanh(")
        elif self.is_2nd:
            self._input("atan(")
        else:
            self._input("tan(")

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
            if not self.expression and not self.is_evaluated:
                self.is_2nd = False
                self.is_hyp = False
                self._update_dynamic_buttons()
            self.expression = ""
            self.is_evaluated = False
            self.display.setText("")
            return

        if t == "BACKSPACE":
            if self.is_evaluated:
                self.expression = ""
                self.is_evaluated = False
            else:
                # Remove multi-character function tokens
                fn_match = re.search(r"(asinh|acosh|atanh|sinh|cosh|tanh|asin|acos|atan|sqrt|cbrt|log10|log2|log|ln|exp|expm1|abs|fact|factorial|ncr|npr|gcd|lcm)\($", self.expression, re.IGNORECASE)
                if fn_match:
                    self.expression = self.expression[: fn_match.start()]
                else:
                    # Remove multi-character operator or constant tokens
                    tok_match = re.search(r"(\s*mod\s*|\^\(-1\)|\^2|\^3|2\^\(|10\^\(|e\^\(|tau|Ans)$", self.expression, re.IGNORECASE)
                    if tok_match:
                        self.expression = self.expression[: tok_match.start()]
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
                # Replace visual symbols and ans token before evaluation
                clean_expr = self.expression.replace("Ans", str(self.last_result))
                clean_expr = clean_expr.replace("×", "*").replace("÷", "/").replace("−", "-")
                
                result = safe_eval(clean_expr, mode)
                if isinstance(result, str) and result.startswith("Error"):
                    self.display.setText("Error")
                    self.display.flash_result(success=False)
                    self.is_evaluated = True
                    return

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
            if t in ["+", "-", "*", "/", "^", "%", "^2", "^3", "^(-1)", "!", " mod "]:
                self.expression = self.last_result + t
            elif t == "Ans":
                self.expression = "Ans"
            elif t == ".":
                self.expression = "0."
            else:
                self.expression = t
            self.is_evaluated = False
        else:
            if t == "!":
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
        elif text == ",":
            self._input(",")
        elif text in "+-*/^%()!":
            self._input(text)
        elif text.lower() == "p":
            self._input("pi")
        elif text.lower() == "e":
            self._input("e")
        else:
            super().keyPressEvent(event)
