from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QComboBox, QTextEdit, QFormLayout, QGroupBox, QStackedLayout
)
from PySide6.QtCore import Qt
from core.complex_engine import ComplexEngine
from core.history_manager import get_history_manager


class ComplexPage(QWidget):
    def __init__(self):
        super().__init__()
        self.engine = ComplexEngine()
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)

        # Title
        title = QLabel("ℂ Complex Numbers & Phasor Analysis")
        title.setStyleSheet("font-size: 18px; font-weight: bold; color: #00ffaa;")
        layout.addWidget(title)

        # Mode Selection
        mode_layout = QHBoxLayout()
        mode_layout.addWidget(QLabel("Operation Mode:"))
        self.mode_combo = QComboBox()
        self.mode_combo.addItems([
            "Representations & Properties",
            "Complex Arithmetic & Operations",
            "Powers & n-th Complex Roots",
            "AC RLC Circuit / Phasor Impedance"
        ])
        self.mode_combo.currentIndexChanged.connect(self._on_mode_changed)
        mode_layout.addWidget(self.mode_combo, 1)
        layout.addLayout(mode_layout)

        # Inputs Container
        self.inputs_group = QGroupBox("Inputs")
        self.inputs_layout = QStackedLayout(self.inputs_group)

        # 0. Representations Panel
        rep_widget = QWidget()
        rep_form = QFormLayout(rep_widget)
        self.rep_z = QLineEdit("3 + 4i")
        rep_form.addRow("Complex Number z (Rectangular / Polar / Euler):", self.rep_z)
        self.inputs_layout.addWidget(rep_widget)

        # 1. Arithmetic Panel
        arith_widget = QWidget()
        arith_form = QFormLayout(arith_widget)
        self.arith_z1 = QLineEdit("3 + 4i")
        self.arith_z2 = QLineEdit("1 - 2i")
        self.arith_op = QComboBox()
        self.arith_op.addItems(["+ (Add)", "- (Subtract)", "* (Multiply)", "/ (Divide)", "^ (Exponent)", "parallel (Z1 || Z2)"])
        arith_form.addRow("Complex z₁:", self.arith_z1)
        arith_form.addRow("Operator:", self.arith_op)
        arith_form.addRow("Complex z₂:", self.arith_z2)
        self.inputs_layout.addWidget(arith_widget)

        # 2. Powers & Roots Panel
        pr_widget = QWidget()
        pr_form = QFormLayout(pr_widget)
        self.pr_z = QLineEdit("1 + i")
        self.pr_root_n = QLineEdit("3")
        pr_form.addRow("Complex Number z:", self.pr_z)
        pr_form.addRow("Root Order n (n-th roots):", self.pr_root_n)
        self.inputs_layout.addWidget(pr_widget)

        # 3. RLC Circuit Panel
        rlc_widget = QWidget()
        rlc_form = QFormLayout(rlc_widget)
        self.rlc_r = QLineEdit("10")
        self.rlc_l = QLineEdit("0.05")
        self.rlc_c = QLineEdit("0.0001")
        self.rlc_f = QLineEdit("60")
        rlc_form.addRow("Resistance R (Ω):", self.rlc_r)
        rlc_form.addRow("Inductance L (H):", self.rlc_l)
        rlc_form.addRow("Capacitance C (F):", self.rlc_c)
        rlc_form.addRow("Frequency f (Hz):", self.rlc_f)
        self.inputs_layout.addWidget(rlc_widget)

        layout.addWidget(self.inputs_group)

        # Calculate Button
        btn_layout = QHBoxLayout()
        self.calc_btn = QPushButton("Calculate Complex Operations")
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

        # Output Group
        output_group = QGroupBox("Results & Representations")
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
            if idx == 0:  # Representations
                z_str = self.rep_z.text().strip()
                z = self.engine.parse_complex(z_str)
                if z is None:
                    self.output.setText(f"Error: Could not parse complex number '{z_str}'")
                    return
                reps = self.engine.calculate_all_representations(z)
                out = [
                    f"=== COMPLEX NUMBER ANALYSIS: {z_str} ===",
                    "",
                    f"Rectangular Form:  {reps['rectangular']}",
                    f"Polar Form (deg):  {reps['polar_deg']}",
                    f"Polar Form (rad):  {reps['polar_rad']}",
                    f"Euler Form:        {reps['euler']}",
                    f"Real Part (Re):    {reps['re']:g}",
                    f"Imag Part (Im):    {reps['im']:g}",
                    f"Modulus |z| (r):   {reps['modulus']:g}",
                    f"Argument (θ deg):  {reps['argument_deg']:g}°",
                    f"Argument (θ rad):  {reps['argument_rad']:g} rad",
                    f"Conjugate (z*):    {self.engine.format_rectangular(reps['conjugate'])}"
                ]
                res_str = reps['rectangular']
                summary_expr = f"Analyze: {z_str}"

            elif idx == 1:  # Arithmetic
                z1_str = self.arith_z1.text().strip()
                z2_str = self.arith_z2.text().strip()
                z1 = self.engine.parse_complex(z1_str)
                z2 = self.engine.parse_complex(z2_str)
                if z1 is None or z2 is None:
                    self.output.setText("Error: Could not parse z1 or z2.")
                    return

                op_sel = self.arith_op.currentText().split()[0]
                res = self.engine.evaluate_binary_op(z1, z2, op_sel)
                reps = res["representations"]
                out = [
                    f"=== COMPLEX ARITHMETIC: z1 {op_sel} z2 ===",
                    f"z₁ = {z1_str}",
                    f"z₂ = {z2_str}",
                    "",
                    f"Result (Rectangular): {reps['rectangular']}",
                    f"Result (Polar deg):   {reps['polar_deg']}",
                    f"Result (Euler):       {reps['euler']}",
                    f"Modulus:             {reps['modulus']:g}",
                    f"Argument:            {reps['argument_deg']:g}°"
                ]
                res_str = reps['rectangular']
                summary_expr = f"Complex: {z1_str} {op_sel} {z2_str}"

            elif idx == 2:  # Powers & Roots
                z_str = self.pr_z.text().strip()
                n = int(self.pr_root_n.text())
                z = self.engine.parse_complex(z_str)
                if z is None:
                    self.output.setText(f"Error: Could not parse complex number '{z_str}'")
                    return

                roots_list = self.engine.roots(z, n)
                out = [
                    f"=== {n}-th COMPLEX ROOTS OF z = {z_str} ===",
                    ""
                ]
                for k, r in enumerate(roots_list):
                    r_reps = self.engine.calculate_all_representations(r)
                    out.append(f"Root k = {k}:")
                    out.append(f"  Rectangular: {r_reps['rectangular']}")
                    out.append(f"  Polar:       {r_reps['polar_deg']}")

                res_str = f"{len(roots_list)} roots computed"
                summary_expr = f"Roots (n={n}): {z_str}"

            elif idx == 3:  # RLC Circuit
                r = float(self.rlc_r.text())
                l = float(self.rlc_l.text())
                c = float(self.rlc_c.text())
                freq = float(self.rlc_f.text())

                res = self.engine.rlc_impedance(r, l, c, freq)
                reps = res["representations"]
                out = [
                    f"=== RLC CIRCUIT IMPEDANCE & RESONANCE ===",
                    f"R = {r:g} Ω, L = {l:g} H, C = {c:g} F, f = {freq:g} Hz",
                    "",
                    f"Angular Frequency ω:     {res['omega']:g} rad/s",
                    f"Inductive Reactance X_L: {res['X_L']:g} Ω",
                    f"Capacitive Reactance X_C:{res['X_C']:g} Ω",
                    f"Net Reactance X:         {res['net_reactance']:g} Ω",
                    f"Total Impedance Z:       {reps['rectangular']} Ω",
                    f"Polar Impedance Z:       {reps['polar_deg']} Ω",
                    f"Phase Angle φ:           {res['phase_deg']:g}°",
                    f"Resonance Frequency f₀:  {res['resonance_freq_Hz']:g} Hz"
                ]
                res_str = f"Z = {reps['rectangular']} Ω"
                summary_expr = f"RLC Z: R={r}, L={l}, C={c}, f={freq}"

            result_text = "\n".join(out)
            self.output.setText(result_text)
            get_history_manager().add_entry(summary_expr, res_str)

        except Exception as e:
            self.output.setText(f"Error performing complex calculation: {e}")
