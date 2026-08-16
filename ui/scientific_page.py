from PySide6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QGridLayout, QComboBox, QLabel
from PySide6.QtCore import Qt
from ui.widgets import CalcButton, DisplayPanel
from utils.helpers import safe_eval

class ScientificPage(QWidget):
    def __init__(self, config):
        super().__init__()
        self.config = config
        self.expression = ""
        self.setup_ui()

    def setup_ui(self):
        self.setFocusPolicy(Qt.FocusPolicy.StrongFocus)
        layout = QVBoxLayout(self)
        layout.setSpacing(10)

        h = QHBoxLayout()
        h.addWidget(QLabel("Mode:"))
        self.mode_combo = QComboBox()
        self.mode_combo.addItems(["Degrees", "Radians"])
        self.mode_combo.setCurrentIndex(0 if self.config.get("angle_mode") == "degrees" else 1)
        self.mode_combo.currentTextChanged.connect(self._change_mode)
        h.addWidget(self.mode_combo)

        self.mode_label = QLabel("DEG")
        self.mode_label.setStyleSheet("color: #00ffaa; font-weight: bold; padding: 4px 8px;")
        h.addWidget(self.mode_label)
        h.addStretch()
        layout.addLayout(h)

        self.display = DisplayPanel()
        layout.addWidget(self.display)

        sci_grid = QGridLayout()
        sci_grid.setSpacing(10)

        funcs = [
            "sin", "cos", "tan", "(",
            "asin", "acos", "atan", ")",
            "sinh", "cosh", "tanh", "C",
            "ln", "log", "\u221a", "\u03c0"
        ]
        for i, f in enumerate(funcs):
            r, c = divmod(i, 4)
            cls = "Func"
            btn = CalcButton(f, cls)
            btn.clicked.connect(lambda _, t=f: self._input(t))
            sci_grid.addWidget(btn, r, c)
        layout.addLayout(sci_grid)

        exp_grid = QGridLayout()
        exp_grid.setSpacing(10)
        exp_funcs = ["x!", "^", "x\u00b2", "x\u00b3", "e", "10^x", "2^x", "e^x"]
        for i, f in enumerate(exp_funcs):
            r, c = divmod(i, 4)
            btn = CalcButton(f, "Func")
            btn.clicked.connect(lambda _, t=f: self._input(t))
            exp_grid.addWidget(btn, r, c)
        layout.addLayout(exp_grid)

        num_grid = QGridLayout()
        num_grid.setSpacing(10)
        keys = ["7","8","9","\u00f7","4","5","6","\u00d7","1","2","3","\u2212","0",".","=","+"]
        for i, k in enumerate(keys):
            r, c = divmod(i, 4)
            cls = "Op" if k in ["\u00f7","\u00d7","\u2212","+","="] else ""
            btn = CalcButton(k, cls)
            btn.clicked.connect(lambda _, t=k: self._input(t))
            num_grid.addWidget(btn, r, c)
        layout.addLayout(num_grid)

    def _input(self, t):
        if t == "C":
            self.expression = ""
        elif t == "=":
            try:
                self.expression = str(safe_eval(self.expression, self.config.get("angle_mode", "degrees")))
                self.display.flash_result(success=True)
            except:
                self.expression = "Error"
                self.display.flash_result(success=False)
        elif t == "x!":
            self.expression += "factorial("
        elif t == "\u221a":
            self.expression += "sqrt("
        elif t == "x\u00b2":
            self.expression += "^2"
        elif t == "x\u00b3":
            self.expression += "^3"
        elif t == "10^x":
            self.expression += "10^("
        elif t == "2^x":
            self.expression += "2^("
        elif t == "e^x":
            self.expression += "exp("
        else:
            self.expression += t.replace("\u03c0", "pi")
        self.display.setText(self.expression)

    def _change_mode(self, mode):
        self.config["angle_mode"] = "degrees" if mode == "Degrees" else "radians"
        self.mode_label.setText("DEG" if mode == "Degrees" else "RAD")
        from utils.helpers import save_config
        save_config(self.config)

    def keyPressEvent(self, event):
        key = event.key()
        text = event.text()

        if key == Qt.Key.Key_Return or key == Qt.Key.Key_Equal:
            self._input("=")
        elif key == Qt.Key.Key_Escape or key == Qt.Key.Key_C:
            self._input("C")
        elif key == Qt.Key.Key_Backspace:
            self.expression = self.expression[:-1]
        elif key == Qt.Key.Key_Delete:
            self.expression = self.expression[:-1]
        elif text in "0123456789":
            self._input(text)
        elif text == ".":
            self._input(".")
        elif text in "+-*/":
            self._input(text)
        elif text in "()":
            self._input(text)
        elif text == "^":
            self._input("^")
        else:
            super().keyPressEvent(event)