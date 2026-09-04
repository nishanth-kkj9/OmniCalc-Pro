from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QComboBox, QTextEdit, QFormLayout, QGroupBox, QStackedLayout, QTableWidget, QTableWidgetItem, QHeaderView
)
from PySide6.QtCore import Qt
from core.sequences_engine import SequencesEngine
from core.history_manager import get_history_manager


class SequencesPage(QWidget):
    def __init__(self):
        super().__init__()
        self.engine = SequencesEngine()
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)

        # Title
        title = QLabel("∑ Sequences, Series & Convergence Analysis")
        title.setStyleSheet("font-size: 18px; font-weight: bold; color: #00ffaa;")
        layout.addWidget(title)

        # Mode Selection
        mode_layout = QHBoxLayout()
        mode_layout.addWidget(QLabel("Sequence Type:"))
        self.mode_combo = QComboBox()
        self.mode_combo.addItems([
            "Arithmetic Progression (a_n = a1 + (n-1)d)",
            "Geometric Progression (a_n = a1 · r^(n-1))",
            "Fibonacci Sequence",
            "Harmonic Sequence (a_n = 1 / (a + (n-1)d))",
            "Explicit Formula (a_n = f(n))",
            "Recursive Relation (a_n = f(a_{n-1}))"
        ])
        self.mode_combo.currentIndexChanged.connect(self._on_mode_changed)
        mode_layout.addWidget(self.mode_combo, 1)
        layout.addLayout(mode_layout)

        # Inputs Container
        self.inputs_group = QGroupBox("Sequence Parameters")
        self.inputs_layout = QStackedLayout(self.inputs_group)

        # 0. Arithmetic Panel
        arith_widget = QWidget()
        arith_form = QFormLayout(arith_widget)
        self.arith_a1 = QLineEdit("1")
        self.arith_d = QLineEdit("2")
        self.arith_n = QLineEdit("20")
        arith_form.addRow("First Term a₁:", self.arith_a1)
        arith_form.addRow("Common Difference d:", self.arith_d)
        arith_form.addRow("Number of Terms n (max 500):", self.arith_n)
        self.inputs_layout.addWidget(arith_widget)

        # 1. Geometric Panel
        geom_widget = QWidget()
        geom_form = QFormLayout(geom_widget)
        self.geom_a1 = QLineEdit("1")
        self.geom_r = QLineEdit("0.5")
        self.geom_n = QLineEdit("20")
        geom_form.addRow("First Term a₁:", self.geom_a1)
        geom_form.addRow("Common Ratio r:", self.geom_r)
        geom_form.addRow("Number of Terms n (max 500):", self.geom_n)
        self.inputs_layout.addWidget(geom_widget)

        # 2. Fibonacci Panel
        fib_widget = QWidget()
        fib_form = QFormLayout(fib_widget)
        self.fib_n = QLineEdit("20")
        fib_form.addRow("Number of Terms n (max 500):", self.fib_n)
        self.inputs_layout.addWidget(fib_widget)

        # 3. Harmonic Panel
        harm_widget = QWidget()
        harm_form = QFormLayout(harm_widget)
        self.harm_a = QLineEdit("1")
        self.harm_d = QLineEdit("1")
        self.harm_n = QLineEdit("20")
        harm_form.addRow("Initial Denominator a:", self.harm_a)
        harm_form.addRow("Step d:", self.harm_d)
        harm_form.addRow("Number of Terms n (max 500):", self.harm_n)
        self.inputs_layout.addWidget(harm_widget)

        # 4. Explicit Panel
        exp_widget = QWidget()
        exp_form = QFormLayout(exp_widget)
        self.exp_expr = QLineEdit("1 / n**2")
        self.exp_start = QLineEdit("1")
        self.exp_n = QLineEdit("20")
        exp_form.addRow("Explicit Formula a_n = f(n):", self.exp_expr)
        exp_form.addRow("Start n:", self.exp_start)
        exp_form.addRow("Number of Terms n (max 500):", self.exp_n)
        self.inputs_layout.addWidget(exp_widget)

        # 5. Recursive Panel
        rec_widget = QWidget()
        rec_form = QFormLayout(rec_widget)
        self.rec_expr = QLineEdit("2 * a_prev + 1")
        self.rec_init = QLineEdit("1")
        self.rec_n = QLineEdit("20")
        rec_form.addRow("Recursive Formula f(a_prev):", self.rec_expr)
        rec_form.addRow("Initial Term a₁:", self.rec_init)
        rec_form.addRow("Number of Terms n (max 500):", self.rec_n)
        self.inputs_layout.addWidget(rec_widget)

        layout.addWidget(self.inputs_group)

        # Calculate Button
        btn_layout = QHBoxLayout()
        self.calc_btn = QPushButton("Generate Sequence & Analyze")
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

        # Results Split
        results_layout = QHBoxLayout()

        # Analysis Output
        output_group = QGroupBox("Formulas & Convergence Analysis")
        out_layout = QVBoxLayout(output_group)
        self.output = QTextEdit()
        self.output.setReadOnly(True)
        self.output.setStyleSheet("font-family: monospace; font-size: 13px;")
        out_layout.addWidget(self.output)
        results_layout.addWidget(output_group, 1)

        # Table Output
        table_group = QGroupBox("Generated Terms & Partial Sums (S_n)")
        table_layout = QVBoxLayout(table_group)
        self.table = QTableWidget()
        self.table.setColumnCount(5)
        self.table.setHorizontalHeaderLabels(["n", "a_n", "S_n (Partial Sum)", "Δ (Diff)", "Ratio (a_n/a_{n-1})"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        table_layout.addWidget(self.table)
        results_layout.addWidget(table_group, 1)

        layout.addLayout(results_layout)

    def _on_mode_changed(self, idx: int):
        self.inputs_layout.setCurrentIndex(idx)

    def calculate(self):
        idx = self.mode_combo.currentIndex()
        try:
            if idx == 0:  # Arithmetic
                a1 = float(self.arith_a1.text())
                d = float(self.arith_d.text())
                n = int(self.arith_n.text())
                res = self.engine.arithmetic(a1, d, n)
                summary_expr = f"Arithmetic: a1={a1}, d={d}, n={n}"

            elif idx == 1:  # Geometric
                a1 = float(self.geom_a1.text())
                r = float(self.geom_r.text())
                n = int(self.geom_n.text())
                res = self.engine.geometric(a1, r, n)
                summary_expr = f"Geometric: a1={a1}, r={r}, n={n}"

            elif idx == 2:  # Fibonacci
                n = int(self.fib_n.text())
                res = self.engine.fibonacci(n)
                summary_expr = f"Fibonacci: n={n}"

            elif idx == 3:  # Harmonic
                a = float(self.harm_a.text())
                d = float(self.harm_d.text())
                n = int(self.harm_n.text())
                res = self.engine.harmonic(n, a, d)
                summary_expr = f"Harmonic: a={a}, d={d}, n={n}"

            elif idx == 4:  # Explicit
                expr = self.exp_expr.text().strip()
                start_n = int(self.exp_start.text())
                n = int(self.exp_n.text())
                res = self.engine.explicit(expr, n, start_n)
                summary_expr = f"Explicit: a_n={expr}, n={n}"

            elif idx == 5:  # Recursive
                expr = self.rec_expr.text().strip()
                init = [float(x.strip()) for x in self.rec_init.text().split(",")]
                n = int(self.rec_n.text())
                res = self.engine.recursive(expr, init, n)
                summary_expr = f"Recursive: {expr}, init={init}, n={n}"

            # Format Analysis Text
            conv = res["convergence"]
            out = [
                f"=== SEQUENCE ANALYSIS ===",
                f"Closed Form: {res.get('closed_form', 'N/A')}",
                f"Sum Formula: {res.get('sum_formula', 'N/A')}",
                "",
                f"Sequence Convergent: {'YES' if conv['is_convergent'] else 'NO'}",
                f"Estimated Limit L:   {f'{conv[\"estimated_limit\"]:.8g}' if conv['estimated_limit'] is not None else 'Diverges / Infinite'}",
                f"Series Convergent:   {'YES' if conv.get('sum_convergent') else 'NO'}",
                f"Infinite Sum S_∞:    {f'{conv[\"estimated_sum\"]:.8g}' if conv.get('estimated_sum') is not None else 'Diverges / Undefined'}",
                "",
                "--- Analysis Notes ---"
            ]
            out.extend(f"• {note}" for note in conv.get("notes", []))
            self.output.setText("\n".join(out))

            # Populate Table
            terms = res["terms"]
            self.table.setRowCount(len(terms))
            for row, t in enumerate(terms):
                self.table.setItem(row, 0, QTableWidgetItem(str(t["n"])))
                self.table.setItem(row, 1, QTableWidgetItem(f"{t['an']:.8g}"))
                self.table.setItem(row, 2, QTableWidgetItem(f"{t['Sn']:.8g}"))
                diff_str = f"{t['diff']:.8g}" if t.get('diff') is not None else "-"
                ratio_str = f"{t['ratio']:.8g}" if t.get('ratio') is not None else "-"
                self.table.setItem(row, 3, QTableWidgetItem(diff_str))
                self.table.setItem(row, 4, QTableWidgetItem(ratio_str))

            last_an = terms[-1]["an"] if terms else "N/A"
            get_history_manager().add_entry(summary_expr, f"a_{terms[-1]['n']} = {last_an:g}" if isinstance(last_an, (int, float)) else str(last_an))

        except Exception as e:
            self.output.setText(f"Error computing sequence: {e}")
