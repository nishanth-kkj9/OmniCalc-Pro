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
        self.type_combo.addItems(["Cartesian (y=)", "Parametric (x,y)", "Polar (r=)"])

        self.input_eq = QLineEdit()
        self.input_eq.setPlaceholderText("e.g. x**2 - 4, sin(x), 1/x")

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

    def plot_graph(self):
        raw = self.input_eq.text()
        eqs = [e.strip() for e in raw.split(",") if e.strip()]
        self.engine.plot_equations(eqs)
