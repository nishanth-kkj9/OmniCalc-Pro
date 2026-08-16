from PySide6.QtWidgets import QWidget, QGridLayout, QLineEdit, QComboBox, QLabel, QPushButton
from core.programmer_engine import ProgrammerEngine

class ProgrammerPage(QWidget):
    def __init__(self):
        super().__init__()
        self.engine = ProgrammerEngine()
        self.setup_ui()

    def setup_ui(self):
        layout = QGridLayout(self)
        layout.addWidget(QLabel("Decimal Input:"), 0, 0)
        self.dec_in = QLineEdit("255")
        layout.addWidget(self.dec_in, 0, 1)

        self.base_combo = QComboBox()
        self.base_combo.addItems(["BIN", "OCT", "HEX"])
        layout.addWidget(self.base_combo, 1, 1)
        
        self.res_label = QLabel("Binary: -")
        self.res_label2 = QLabel("Octal: -")
        self.res_label3 = QLabel("Hex: -")
        layout.addWidget(self.res_label, 2, 0, 1, 2)
        layout.addWidget(self.res_label2, 3, 0, 1, 2)
        layout.addWidget(self.res_label3, 4, 0, 1, 2)

        self.btn_calc = QPushButton("Convert")
        self.btn_calc.clicked.connect(self.convert_all)
        layout.addWidget(self.btn_calc, 5, 1)

        self.bitwise_layout(layout)
        self.dec_in.returnPressed.connect(self.convert_all)

    def convert_all(self):
        try:
            val = self.dec_in.text()
            base = self.base_combo.currentText()
            self.res_label.setText(f"Binary: {self.engine.to_base(val, 'BIN')}")
            self.res_label2.setText(f"Octal: {self.engine.to_base(val, 'OCT')}")
            self.res_label3.setText(f"Hexadecimal: {self.engine.to_base(val, 'HEX')}")
        except: pass

    def bitwise_layout(self, layout):
        layout.addWidget(QLabel("Bitwise Op:"), 6, 0)
        self.a_in = QLineEdit("255")
        self.op_in = QComboBox()
        self.op_in.addItems(["AND", "OR", "XOR"])
        self.b_in = QLineEdit("15")
        layout.addWidget(self.a_in, 6, 1)
        layout.addWidget(self.op_in, 7, 0)
        layout.addWidget(self.b_in, 7, 1)
        self.bit_res = QPushButton("Result: -")
        self.bit_res.clicked.connect(self.do_bitwise)
        layout.addWidget(self.bit_res, 8, 0, 1, 2)

    def do_bitwise(self):
        res = self.engine.bitwise(self.a_in.text(), self.b_in.text(), self.op_in.currentText())
        self.bit_res.setText(f"Result: {res}")