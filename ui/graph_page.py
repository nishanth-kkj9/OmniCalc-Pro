from PySide6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QLineEdit, QPushButton
from PySide6.QtCore import Qt
from core.graph_engine import GraphEngine

class GraphPage(QWidget):
    def __init__(self):
        super().__init__()
        self.engine = GraphEngine(self)
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        input_layout = QHBoxLayout()
        self.input_eq = QLineEdit()
        self.input_eq.setPlaceholderText("e.g., x**2, sin(x), x^3 - 2*x")
        self.btn_plot = QPushButton("Plot")
        self.btn_plot.setObjectName("OperatorBtn")
        self.btn_plot.clicked.connect(self.plot_graph)
        self.btn_clear = QPushButton("Clear")
        self.btn_clear.setObjectName("DangerBtn")
        self.btn_clear.clicked.connect(self.engine.clear)
        input_layout.addWidget(self.input_eq, 4)
        input_layout.addWidget(self.btn_plot, 1)
        input_layout.addWidget(self.btn_clear, 1)
        layout.addLayout(input_layout)
        layout.addWidget(self.engine, 1)

    def plot_graph(self):
        eqs = self.input_eq.text().split(",")
        self.engine.plot_equations(eqs)