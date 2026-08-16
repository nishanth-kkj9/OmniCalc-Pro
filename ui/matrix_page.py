from PySide6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QGridLayout, QLabel, QLineEdit, QComboBox, QPushButton, QTextEdit
from PySide6.QtCore import Qt
from core.matrix_engine import MatrixEngine

class MatrixPage(QWidget):
    def __init__(self):
        super().__init__()
        self.engine = MatrixEngine()
        self.setup_ui()

    def setup_ui(self):
        main = QVBoxLayout(self)
        h = QHBoxLayout()
        h.addWidget(QLabel("Operation:"))
        self.op = QComboBox()
        self.op.addItems(["Add", "Subtract", "Multiply", "Determinant", "Inverse", "Transpose"])
        h.addWidget(self.op)
        main.addLayout(h)

        self.mat_a = QLineEdit("1,2;3,4")
        self.mat_a.setPlaceholderText("Matrix A (e.g. 1,2;3,4)")
        main.addWidget(self.mat_a)
        self.mat_b = QLineEdit("5,6;7,8")
        self.mat_b.setPlaceholderText("Matrix B (e.g. 5,6;7,8)")
        main.addWidget(self.mat_b)

        self.btn = QPushButton("Calculate")
        self.btn.setObjectName("OperatorBtn")
        self.btn.clicked.connect(self.calculate)
        main.addWidget(self.btn)

        self.output = QTextEdit()
        self.output.setReadOnly(True)
        main.addWidget(self.output)

    def calculate(self):
        try:
            A = self.engine.parse(self.mat_a.text())
            op = self.op.currentText()
            res = ""
            if op == "Add": res = str(self.engine.add(A, self.engine.parse(self.mat_b.text())))
            elif op == "Subtract": res = str(self.engine.sub(A, self.engine.parse(self.mat_b.text())))
            elif op == "Multiply": res = str(self.engine.mul(A, self.engine.parse(self.mat_b.text())))
            elif op == "Determinant": res = f"{self.engine.det(A):.4f}"
            elif op == "Inverse": res = str(self.engine.inv(A))
            elif op == "Transpose": res = str(self.engine.trans(A))
            self.output.setText(res)
        except Exception as e: self.output.setText(f"Error: {e}")