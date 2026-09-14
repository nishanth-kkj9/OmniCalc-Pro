from PySide6.QtWidgets import (
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QLineEdit,
    QPushButton,
    QComboBox,
    QLabel,
    QGroupBox,
)
from PySide6.QtCore import Qt
from core.graph_engine import GraphEngine, GraphModel


def split_top_level(text: str, delimiter: str = ',') -> list[str]:
    """Splits text by delimiter only at the top level of parentheses/brackets."""
    results = []
    current = []
    depth = 0
    for ch in text:
        if ch in '([{':
            depth += 1
            current.append(ch)
        elif ch in ')]}':
            if depth > 0:
                depth -= 1
            current.append(ch)
        elif ch == delimiter and depth == 0:
            part = ''.join(current).strip()
            if part:
                results.append(part)
            current = []
        else:
            current.append(ch)
    last = ''.join(current).strip()
    if last:
        results.append(last)
    return results


class GraphPage(QWidget):
    def __init__(self):
        super().__init__()
        self.engine = GraphEngine(self)
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)

        # Header controls
        ctrl_box = QGroupBox("Expressions & Options")
        box_layout = QVBoxLayout(ctrl_box)

        input_layout = QHBoxLayout()
        self.type_combo = QComboBox()
        self.type_combo.addItems(["Function (y=)", "Parametric (x,y)", "Polar (r=)"])
        self.type_combo.currentIndexChanged.connect(self.on_type_changed)

        self.input_eq = QLineEdit()
        self.input_eq.setPlaceholderText("e.g. x**2 - 4, sin(x), 1/x")
        self.input_eq.returnPressed.connect(self.plot_graph)

        self.btn_plot = QPushButton("Plot")
        self.btn_plot.setObjectName("OperatorBtn")
        self.btn_plot.clicked.connect(self.plot_graph)

        self.btn_clear = QPushButton("Clear")
        self.btn_clear.setObjectName("DangerBtn")
        self.btn_clear.clicked.connect(self.engine.clear)

        input_layout.addWidget(QLabel("Type:"))
        input_layout.addWidget(self.type_combo, 1)
        input_layout.addWidget(self.input_eq, 4)
        input_layout.addWidget(self.btn_plot, 1)
        input_layout.addWidget(self.btn_clear, 1)

        box_layout.addLayout(input_layout)
        layout.addWidget(ctrl_box)
        layout.addWidget(self.engine, 1)

    def on_type_changed(self, index: int):
        if index == 0:
            self.input_eq.setPlaceholderText("e.g. x**2 - 4, sin(x), 1/x")
        elif index == 1:
            self.input_eq.setPlaceholderText("e.g. cos(t), sin(t)")
        elif index == 2:
            self.input_eq.setPlaceholderText("e.g. 2*cos(theta), 1 - cos(theta)")

    def plot_graph(self):
        raw = self.input_eq.text().strip()
        if not raw:
            return
        curve_type_idx = self.type_combo.currentIndex()
        models = []

        if curve_type_idx == 1:
            # Parametric: expect "x(t), y(t)" or "(x(t), y(t))"
            expr_str = raw
            if expr_str.startswith("(") and expr_str.endswith(")"):
                expr_str = expr_str[1:-1].strip()
            parts = split_top_level(expr_str, delimiter=",")
            if len(parts) >= 2:
                models.append(
                    GraphModel(expression=parts[0], curve_type="parametric", parametric_y=parts[1])
                )
            elif len(parts) == 1:
                models.append(
                    GraphModel(expression=parts[0], curve_type="parametric", parametric_y="0")
                )
        elif curve_type_idx == 2:
            # Polar
            items = split_top_level(raw, delimiter=";")
            for e in items:
                models.append(GraphModel(expression=e, curve_type="polar"))
        else:
            # Function: semicolon or top-level comma
            items = split_top_level(raw, delimiter=";") if ";" in raw else split_top_level(raw, delimiter=",")
            for e in items:
                models.append(GraphModel(expression=e, curve_type="function"))

        self.engine.plot_equations(models)
