from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QComboBox, QTextEdit, QFormLayout, QGroupBox, QStackedLayout
)
from PySide6.QtCore import Qt
from core.fractions_engine import FractionsEngine
from core.history_manager import get_history_manager


class FractionsPage(QWidget):
    def __init__(self):
        super().__init__()
        self.engine = FractionsEngine()
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)

        # Title
        title = QLabel("½ Fractions, Number Theory & Prime Factorization")
        title.setStyleSheet("font-size: 18px; font-weight: bold; color: #00ffaa;")
        layout.addWidget(title)

        # Mode Selection
        mode_layout = QHBoxLayout()
        mode_layout.addWidget(QLabel("Module:"))
        self.mode_combo = QComboBox()
        self.mode_combo.addItems([
            "Exact Fraction Arithmetic & Simplification",
            "Greatest Common Divisor (GCD) & Least Common Multiple (LCM)",
            "Prime Factorization & Divisor Analysis"
        ])
        self.mode_combo.currentIndexChanged.connect(self._on_mode_changed)
        mode_layout.addWidget(self.mode_combo, 1)
        layout.addLayout(mode_layout)

        # Inputs Container
        self.inputs_group = QGroupBox("Inputs")
        self.inputs_layout = QStackedLayout(self.inputs_group)

        # 0. Fractions Panel
        frac_widget = QWidget()
        frac_form = QFormLayout(frac_widget)
        self.f1_num = QLineEdit("3")
        self.f1_den = QLineEdit("4")
        self.frac_op = QComboBox()
        self.frac_op.addItems(["+ (Add)", "- (Subtract)", "* (Multiply)", "/ (Divide)"])
        self.f2_num = QLineEdit("2")
        self.f2_den = QLineEdit("5")

        frac_form.addRow("Fraction 1 Numerator:", self.f1_num)
        frac_form.addRow("Fraction 1 Denominator:", self.f1_den)
        frac_form.addRow("Operator:", self.frac_op)
        frac_form.addRow("Fraction 2 Numerator:", self.f2_num)
        frac_form.addRow("Fraction 2 Denominator:", self.f2_den)
        self.inputs_layout.addWidget(frac_widget)

        # 1. GCD / LCM Panel
        gcd_widget = QWidget()
        gcd_form = QFormLayout(gcd_widget)
        self.gcd_input = QLineEdit("48, 180, 24")
        gcd_form.addRow("Integers (comma / space separated):", self.gcd_input)
        self.inputs_layout.addWidget(gcd_widget)

        # 2. Prime Factorization Panel
        prime_widget = QWidget()
        prime_form = QFormLayout(prime_widget)
        self.prime_input = QLineEdit("360")
        prime_form.addRow("Integer n to Factorize:", self.prime_input)
        self.inputs_layout.addWidget(prime_widget)

        layout.addWidget(self.inputs_group)

        # Calculate Button
        btn_layout = QHBoxLayout()
        self.calc_btn = QPushButton("Calculate Exact Rational / Number Theory")
        self.calc_btn.setStyleSheet("""
            QPushButton {
                background-color: #00ffaa; color: #111; font-weight: bold;
                padding: 8px 16px; border-radius: 6px;
            }
            QPushButton:hover { background-color: #00cc88; }
        """)
        self.calc_btn.clicked.connect(self.calculate)
        btn_layout.addWidget(self.calc_btn)
        layout.addLayout(btn_layout)

        # Output Text
        output_group = QGroupBox("Exact Rational Results & Steps")
        out_layout = QVBoxLayout(output_group)
        self.output = QTextEdit()
        self.output.setReadOnly(True)
        self.output.setStyleSheet("font-family: monospace; font-size: 13px;")
        out_layout.addWidget(self.output)
        layout.addWidget(output_group)

    def _on_mode_changed(self, idx: int):
        self.inputs_layout.setCurrentIndex(idx)

    def calculate(self):
        idx = self.mode_combo.currentIndex()
        try:
            if idx == 0:  # Fraction Arithmetic
                n1 = int(self.f1_num.text())
                d1 = int(self.f1_den.text())
                n2 = int(self.f2_num.text())
                d2 = int(self.f2_den.text())
                op = self.frac_op.currentText().split()[0]

                res = self.engine.evaluate_binary_op(n1, d1, op, n2, d2)
                out = [
                    f"=== FRACTION ARITHMETIC ===",
                    f"Expression: ({n1}/{d1}) {op} ({n2}/{d2})",
                    "",
                    f"Simplified Fraction:  {res['simplified_str']}",
                    f"Mixed Fraction Form:  {res['mixed_str'] if res['mixed_str'] else 'N/A'}",
                    f"Exact Decimal Value:  {res['decimal_val']:.8g}",
                    f"Calculation Step:     {res['step_calculation']}"
                ]
                res_str = res['simplified_str']
                summary_expr = f"({n1}/{d1}) {op} ({n2}/{d2})"

            elif idx == 1:  # GCD & LCM
                raw = self.gcd_input.text()
                nums = [int(x.strip()) for x in raw.replace(";", ",").split(",") if x.strip()]
                res = self.engine.gcd_lcm_list(nums)
                out = [
                    f"=== GCD & LCM SOLVER ===",
                    f"Input Numbers: {res['numbers']}",
                    "",
                    f"Greatest Common Divisor (GCD): {res['gcd']}",
                    f"Least Common Multiple (LCM):   {res['lcm']}"
                ]
                res_str = f"GCD={res['gcd']}, LCM={res['lcm']}"
                summary_expr = f"GCD/LCM: {nums}"

            elif idx == 2:  # Prime Factorization
                n = int(self.prime_input.text())
                res = self.engine.prime_factorization(n)
                out = [
                    f"=== PRIME FACTORIZATION & NUMBER THEORY ===",
                    f"Number n = {res['n']}",
                    "",
                    f"Is Prime:              {'YES' if res['is_prime'] else 'NO'}",
                    f"Prime Factorization:   {res['latex_str']}",
                    f"Total Divisors Count:  {res['divisor_count']}",
                    f"Sum of Divisors:       {res['divisor_sum']}"
                ]
                res_str = res['latex_str']
                summary_expr = f"Factors: {n}"

            result_text = "\n".join(out)
            self.output.setText(result_text)
            get_history_manager().add_entry(summary_expr, res_str)

        except Exception as e:
            self.output.setText(f"Error evaluating fractions / number theory: {e}")
