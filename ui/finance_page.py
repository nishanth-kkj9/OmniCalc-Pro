from PySide6.QtWidgets import QWidget, QGridLayout, QLineEdit, QLabel, QComboBox, QPushButton
from core.finance_engine import FinanceEngine

class FinancePage(QWidget):
    def __init__(self):
        super().__init__()
        self.engine = FinanceEngine()
        self.setup_ui()

    def setup_ui(self):
        layout = QGridLayout(self)
        self.calc_type = QComboBox()
        self.calc_type.addItems(["EMI Calculator", "Compound Interest", "GST", "Discount"])
        self.calc_type.currentIndexChanged.connect(self.update_form)
        layout.addWidget(self.calc_type, 0, 0, 1, 2)

        self.labels = []
        self.inputs = []
        self.update_form(0)

    def update_form(self, idx):
        for lbl in self.labels: lbl.deleteLater()
        for inp in self.inputs: inp.deleteLater()
        self.labels.clear(); self.inputs.clear()
        if hasattr(self, 'btn') and self.btn:
            self.btn.deleteLater()
        if hasattr(self, 'res') and self.res:
            self.res.deleteLater()

        fields = {
            0: [("Principal", "500000"), ("Annual Rate (%)", "8.5"), ("Months", "60")],
            1: [("Principal", "10000"), ("Rate (%)", "10"), ("Years", "5"), ("Compounds/Year", "4")],
            2: [("Amount", "11800"), ("GST Rate (%)", "18")],
            3: [("Price", "500"), ("Discount (%)", "20")]
        }

        start_row = 1
        for i, (name, val) in enumerate(fields[idx]):
            lbl = QLabel(name)
            inp = QLineEdit(val)
            self.labels.append(lbl)
            self.inputs.append(inp)
            self.layout().addWidget(lbl, start_row + i*2, 0)
            self.layout().addWidget(inp, start_row + i*2, 1)

        self.btn = QPushButton("Calculate")
        self.btn.setObjectName("OperatorBtn")
        self.btn.clicked.connect(self.calculate)
        self.layout().addWidget(self.btn, start_row + len(fields[idx])*2, 0, 1, 2)

        self.res = QLabel("Result will appear here.")
        self.layout().addWidget(self.res, start_row + len(fields[idx])*2 + 1, 0, 1, 2)

    def calculate(self):
        vals = [i.text() for i in self.inputs]
        idx = self.calc_type.currentIndex()
        try:
            if idx == 0:
                emi, total, interest = self.engine.emi(*map(float, vals))
                res = f"EMI: {emi}\nTotal Payment: {total}\nTotal Interest: {interest}"
            elif idx == 1:
                amt, interest = self.engine.compound_interest(*map(float, vals))
                res = f"Amount: {amt}\nInterest: {interest}"
            elif idx == 2:
                res = self.engine.gst(*map(float, vals))
            else:
                saved, final = self.engine.discount(*map(float, vals))
                res = f"You Save: {saved}\nFinal Price: {final}"
            self.res.setText(str(res))
        except: self.res.setText("Invalid Input")