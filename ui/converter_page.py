from PySide6.QtWidgets import QWidget, QVBoxLayout, QGridLayout, QLabel, QLineEdit, QComboBox
from PySide6.QtCore import Qt
from core.converter_engine import ConverterEngine

class ConverterPage(QWidget):
    def __init__(self):
        super().__init__()
        self.engine = ConverterEngine()
        self.setup_ui()

    def setup_ui(self):
        layout = QGridLayout(self)
        layout.addWidget(QLabel("Category"), 0, 0)
        self.cat_combo = QComboBox()
        self.cat_combo.addItems(list(ConverterEngine.CATEGORIES.keys()))
        self.cat_combo.currentTextChanged.connect(self.update_units)
        layout.addWidget(self.cat_combo, 0, 1)

        layout.addWidget(QLabel("From"), 1, 0)
        self.from_unit = QComboBox()
        layout.addWidget(self.from_unit, 1, 1)
        
        layout.addWidget(QLabel("Value"), 2, 0)
        self.val_input = QLineEdit("1")
        layout.addWidget(self.val_input, 2, 1)

        layout.addWidget(QLabel("To"), 3, 0)
        self.to_unit = QComboBox()
        layout.addWidget(self.to_unit, 3, 1)

        self.result_label = QLabel("Result: -", alignment=Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.result_label, 4, 0, 1, 2)

        self.val_input.textChanged.connect(self.calculate)
        self.to_unit.currentTextChanged.connect(self.calculate)
        self.from_unit.currentTextChanged.connect(self.calculate)
        self.update_units()

    def update_units(self):
        cat = self.cat_combo.currentText()
        units = list(ConverterEngine.CATEGORIES[cat].keys())
        self.from_unit.clear()
        self.to_unit.clear()
        self.from_unit.addItems(units)
        self.to_unit.addItems(units)
        if len(units) > 1: self.to_unit.setCurrentIndex(1)
        self.calculate()

    def calculate(self):
        try:
            val = float(self.val_input.text())
            res = self.engine.convert(val, self.from_unit.currentText(), self.to_unit.currentText(), self.cat_combo.currentText())
            self.result_label.setText(f"Result: {round(res, 6)}")
        except: self.result_label.setText("Result: Invalid Input")