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
            # Parametric: expect "x(t), y(t)"
            parts = [p.strip() for p in raw.split(",", 1)]
            if len(parts) == 2:
                models.append(GraphModel(expression=parts[0], curve_type="parametric", parametric_y=parts[1]))
            else:
                models.append(GraphModel(expression=parts[0], curve_type="parametric", parametric_y="0"))
        elif curve_type_idx == 2:
            # Polar
            for e in raw.split(";"):
                if e.strip():
                    models.append(GraphModel(expression=e.strip(), curve_type="polar"))
        else:
            # Cartesian
            for e in raw.split(","):
                if e.strip():
                    models.append(GraphModel(expression=e.strip(), curve_type="function"))

        self.engine.plot_equations(models)
