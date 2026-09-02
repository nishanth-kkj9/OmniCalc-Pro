from typing import List, Optional
from PySide6.QtWidgets import QWidget, QGridLayout, QLineEdit, QLabel, QComboBox, QPushButton
from core.finance_engine import FinanceEngine

class FinancePage(QWidget):
    def __init__(self) -> None:
        super().__init__()
        self.engine = FinanceEngine()
        self.btn: Optional[QPushButton] = None
        self.res: Optional[QLabel] = None
        self.labels: List[QLabel] = []
        self.inputs: List[QLineEdit] = []
        self.grid_layout = QGridLayout(self)
        self.setup_ui()

    def setup_ui(self) -> None:
        self.calc_type = QComboBox()
        self.calc_type.addItems(["EMI Calculator", "Compound Interest", "GST", "Discount"])
        self.calc_type.currentIndexChanged.connect(self.update_form)
        self.grid_layout.addWidget(self.calc_type, 0, 0, 1, 2)

        self.labels = []
        self.inputs = []
        self.update_form(0)

    def update_form(self, idx: int) -> None:
        for lbl in self.labels:
            lbl.deleteLater()
        for inp in self.inputs:
            inp.deleteLater()
        self.labels.clear()
        self.inputs.clear()
        if self.btn is not None:
            self.btn.deleteLater()
            self.btn = None
        if self.res is not None:
            self.res.deleteLater()
            self.res = None

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
            self.grid_layout.addWidget(lbl, start_row + i*2, 0)
            self.grid_layout.addWidget(inp, start_row + i*2, 1)

        self.btn = QPushButton("Calculate")
        self.btn.setObjectName("OperatorBtn")
        self.btn.clicked.connect(self.calculate)
        self.grid_layout.addWidget(self.btn, start_row + len(fields[idx])*2, 0, 1, 2)

        self.res = QLabel("Result will appear here.")
        self.grid_layout.addWidget(self.res, start_row + len(fields[idx])*2 + 1, 0, 1, 2)

    def calculate(self) -> None:
        vals = [i.text().strip() for i in self.inputs]
        if any(not v for v in vals):
            if self.res is not None:
                self.res.setText("Please fill all fields.")
            return
        idx = self.calc_type.currentIndex()
        try:
            if idx == 0:
                p = float(vals[0])
                r = float(vals[1])
                m = int(float(vals[2]))
                if m <= 0 or p < 0 or r < 0:
                    raise ValueError("Values must be positive and months > 0")
                emi, total, interest = self.engine.emi(p, r, m)
                res_text = f"EMI: {emi}\nTotal Payment: {total}\nTotal Interest: {interest}"
            elif idx == 1:
                p = float(vals[0])
                r = float(vals[1])
                y = int(float(vals[2]))
                c = int(float(vals[3]))
                if p < 0 or r < 0 or y < 0 or c <= 0:
                    raise ValueError("Invalid parameters (compounds/yr must be > 0)")
                amt, interest = self.engine.compound_interest(p, r, c, y)
                res_text = f"Amount: {amt}\nInterest: {interest}"
            elif idx == 2:
                amt_val = float(vals[0])
                rate_val = float(vals[1])
                if amt_val < 0 or rate_val < 0:
                    raise ValueError("Amount and rate must be positive")
                gst_res = self.engine.gst(amt_val, rate_val)
                res_text = f"Base: {gst_res[0]}\nTax: {gst_res[1]}\nTotal: {gst_res[2]}"
            else:
                price = float(vals[0])
                disc = float(vals[1])
                if price < 0 or disc < 0:
                    raise ValueError("Price and discount must be positive")
                saved, final = self.engine.discount(price, disc)
                res_text = f"You Save: {saved}\nFinal Price: {final}"
            if self.res is not None:
                self.res.setText(res_text)
        except ValueError as ve:
            if self.res is not None:
                self.res.setText(f"Invalid Input: {ve}")
        except Exception:
            if self.res is not None:
                self.res.setText("Invalid Input")