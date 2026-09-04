from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QComboBox, QTextEdit, QFormLayout, QGroupBox, QStackedLayout, QApplication
)
from PySide6.QtCore import Qt
from core.equation_engine import EquationEngine
from core.history_manager import get_history_manager


class EquationPage(QWidget):
    def __init__(self):
        super().__init__()
        self.engine = EquationEngine()
        self.last_plottable_expression = None
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)

        # Title
        title = QLabel("🧮 Equation & System Solver")
        title.setStyleSheet("font-size: 18px; font-weight: bold; color: #00ffaa;")
        layout.addWidget(title)

        # Mode Selection
        mode_layout = QHBoxLayout()
        mode_layout.addWidget(QLabel("Solver Mode:"))
        self.mode_combo = QComboBox()
        self.mode_combo.addItems([
            "Quadratic (ax² + bx + c = 0)",
            "Cubic (ax³ + bx² + cx + d = 0)",
            "Linear System 2×2",
            "Linear System 3×3",
            "Single Equation (f(x) = 0)",
            "Quadratic Inequality",
        ])
        self.mode_combo.currentIndexChanged.connect(self._on_mode_changed)
        mode_layout.addWidget(self.mode_combo, 1)
        layout.addLayout(mode_layout)

        # Inputs Container
        self.inputs_group = QGroupBox("Inputs")
        self.inputs_layout = QStackedLayout(self.inputs_group)

        # 0. Quadratic Panel
        quad_widget = QWidget()
        quad_form = QFormLayout(quad_widget)
        self.quad_a = QLineEdit("1")
        self.quad_b = QLineEdit("-5")
        self.quad_c = QLineEdit("6")
        quad_form.addRow("Coefficient a:", self.quad_a)
        quad_form.addRow("Coefficient b:", self.quad_b)
        quad_form.addRow("Coefficient c:", self.quad_c)
        self.inputs_layout.addWidget(quad_widget)

        # 1. Cubic Panel
        cubic_widget = QWidget()
        cubic_form = QFormLayout(cubic_widget)
        self.cubic_a = QLineEdit("1")
        self.cubic_b = QLineEdit("-6")
        self.cubic_c = QLineEdit("11")
        self.cubic_d = QLineEdit("-6")
        cubic_form.addRow("Coefficient a:", self.cubic_a)
        cubic_form.addRow("Coefficient b:", self.cubic_b)
        cubic_form.addRow("Coefficient c:", self.cubic_c)
        cubic_form.addRow("Coefficient d:", self.cubic_d)
        self.inputs_layout.addWidget(cubic_widget)

        # 2. Linear 2x2 Panel
        sys2_widget = QWidget()
        sys2_form = QFormLayout(sys2_widget)
        self.sys2_a1 = QLineEdit("2"); self.sys2_b1 = QLineEdit("3"); self.sys2_c1 = QLineEdit("8")
        self.sys2_a2 = QLineEdit("1"); self.sys2_b2 = QLineEdit("-1"); self.sys2_c2 = QLineEdit("1")
        row1 = QHBoxLayout()
        row1.addWidget(self.sys2_a1); row1.addWidget(QLabel("x +")); row1.addWidget(self.sys2_b1); row1.addWidget(QLabel("y =")); row1.addWidget(self.sys2_c1)
        row2 = QHBoxLayout()
        row2.addWidget(self.sys2_a2); row2.addWidget(QLabel("x +")); row2.addWidget(self.sys2_b2); row2.addWidget(QLabel("y =")); row2.addWidget(self.sys2_c2)
        sys2_form.addRow("Eq 1:", row1)
        sys2_form.addRow("Eq 2:", row2)
        self.inputs_layout.addWidget(sys2_widget)

        # 3. Linear 3x3 Panel
        sys3_widget = QWidget()
        sys3_form = QFormLayout(sys3_widget)
        self.sys3_a1 = QLineEdit("1"); self.sys3_b1 = QLineEdit("1"); self.sys3_c1 = QLineEdit("1"); self.sys3_d1 = QLineEdit("6")
        self.sys3_a2 = QLineEdit("0"); self.sys3_b2 = QLineEdit("2"); self.sys3_c2 = QLineEdit("5"); self.sys3_d2 = QLineEdit("-4")
        self.sys3_a3 = QLineEdit("2"); self.sys3_b3 = QLineEdit("5"); self.sys3_c3 = QLineEdit("-1"); self.sys3_d3 = QLineEdit("27")
        r3_1 = QHBoxLayout(); r3_1.addWidget(self.sys3_a1); r3_1.addWidget(QLabel("x +")); r3_1.addWidget(self.sys3_b1); r3_1.addWidget(QLabel("y +")); r3_1.addWidget(self.sys3_c1); r3_1.addWidget(QLabel("z =")); r3_1.addWidget(self.sys3_d1)
        r3_2 = QHBoxLayout(); r3_2.addWidget(self.sys3_a2); r3_2.addWidget(QLabel("x +")); r3_2.addWidget(self.sys3_b2); r3_2.addWidget(QLabel("y +")); r3_2.addWidget(self.sys3_c2); r3_2.addWidget(QLabel("z =")); r3_2.addWidget(self.sys3_d2)
        r3_3 = QHBoxLayout(); r3_3.addWidget(self.sys3_a3); r3_3.addWidget(QLabel("x +")); r3_3.addWidget(self.sys3_b3); r3_3.addWidget(QLabel("y +")); r3_3.addWidget(self.sys3_c3); r3_3.addWidget(QLabel("z =")); r3_3.addWidget(self.sys3_d3)
        sys3_form.addRow("Eq 1:", r3_1)
        sys3_form.addRow("Eq 2:", r3_2)
        sys3_form.addRow("Eq 3:", r3_3)
        self.inputs_layout.addWidget(sys3_widget)

        # 4. Single Equation Panel
        single_widget = QWidget()
        single_form = QFormLayout(single_widget)
        self.single_expr = QLineEdit("x**3 - 2*x - 5")
        self.single_min = QLineEdit("-10")
        self.single_max = QLineEdit("10")
        single_form.addRow("f(x) = 0:", self.single_expr)
        r_range = QHBoxLayout()
        r_range.addWidget(self.single_min); r_range.addWidget(QLabel("to")); r_range.addWidget(self.single_max)
        single_form.addRow("Search Range:", r_range)
        self.inputs_layout.addWidget(single_widget)

        # 5. Quadratic Inequality Panel
        ineq_widget = QWidget()
        ineq_form = QFormLayout(ineq_widget)
        self.ineq_a = QLineEdit("1")
        self.ineq_b = QLineEdit("-3")
        self.ineq_c = QLineEdit("2")
        self.ineq_op = QComboBox()
        self.ineq_op.addItems(["<", "<=", ">", ">="])
        ineq_form.addRow("Coefficient a:", self.ineq_a)
        ineq_form.addRow("Coefficient b:", self.ineq_b)
        ineq_form.addRow("Coefficient c:", self.ineq_c)
        ineq_form.addRow("Inequality Op:", self.ineq_op)
        self.inputs_layout.addWidget(ineq_widget)

        layout.addWidget(self.inputs_group)

        # Action Buttons
        btn_layout = QHBoxLayout()
        self.solve_btn = QPushButton("Solve Equation")
        self.solve_btn.setStyleSheet("""
            QPushButton {
                background-color: #00ffaa; color: #111; font-weight: bold;
                padding: 8px 16px; border-radius: 6px;
            }
            QPushButton:hover { background-color: #00cc88; }
        """)
        self.solve_btn.clicked.connect(self.solve)
        btn_layout.addWidget(self.solve_btn)

        self.plot_btn = QPushButton("📊 Plot in Graphing Calculator")
        self.plot_btn.setStyleSheet("""
            QPushButton {
                background-color: #2a2a38; color: #00ffaa; font-weight: bold;
                padding: 8px 16px; border-radius: 6px; border: 1px solid #00ffaa;
            }
            QPushButton:hover { background-color: #3a3a48; }
        """)
        self.plot_btn.clicked.connect(self.plot_in_graph)
        btn_layout.addWidget(self.plot_btn)

        layout.addLayout(btn_layout)

        # Output Group
        output_group = QGroupBox("Results & Derivation Steps")
        out_layout = QVBoxLayout(output_group)
        self.output = QTextEdit()
        self.output.setReadOnly(True)
        self.output.setStyleSheet("font-family: monospace; font-size: 13px;")
        out_layout.addWidget(self.output)
        layout.addWidget(output_group)

    def _on_mode_changed(self, idx: int):
        self.inputs_layout.setCurrentIndex(idx)

    def solve(self):
        idx = self.mode_combo.currentIndex()
        try:
            if idx == 0:  # Quadratic
                a = float(self.quad_a.text())
                b = float(self.quad_b.text())
                c = float(self.quad_c.text())
                res = self.engine.solve_quadratic(a, b, c)
                expr_str = f"{a}*x^2 + {b}*x + {c} = 0"
                self.last_plottable_expression = f"{a}*x**2 + {b}*x + {c}"

                out = [f"=== QUADRATIC SOLVER: {expr_str} ===", ""]
                out.append(f"Discriminant Δ: {res['discriminant']}")
                out.append(f"Nature of roots: {res['nature']}")
                out.append("Roots:")
                for i, r in enumerate(res["roots"], 1):
                    re, im = r["re"], r["im"]
                    r_str = f"{re:g}" if abs(im) < 1e-10 else f"{re:g} ± {abs(im):g}i"
                    out.append(f"  x{i} = {r_str}")
                out.append(f"Vertex: ({res['vertex']['x']:g}, {res['vertex']['y']:g})")
                out.append("\n--- Derivation Steps ---")
                out.extend(res["steps"])
                result_str = "\n".join(out)

            elif idx == 1:  # Cubic
                a = float(self.cubic_a.text())
                b = float(self.cubic_b.text())
                c = float(self.cubic_c.text())
                d = float(self.cubic_d.text())
                res = self.engine.solve_cubic(a, b, c, d)
                expr_str = f"{a}*x^3 + {b}*x^2 + {c}*x + {d} = 0"
                self.last_plottable_expression = f"{a}*x**3 + {b}*x**2 + {c}*x + {d}"

                out = [f"=== CUBIC SOLVER: {expr_str} ===", "", "Roots:"]
                for i, r in enumerate(res["roots"], 1):
                    re, im = r["re"], r["im"]
                    r_str = f"{re:g}" if abs(im) < 1e-10 else f"{re:g} ± {abs(im):g}i"
                    out.append(f"  x{i} = {r_str}")
                out.append("\n--- Derivation Steps ---")
                out.extend(res["steps"])
                result_str = "\n".join(out)

            elif idx == 2:  # Linear 2x2
                a1, b1, c1 = float(self.sys2_a1.text()), float(self.sys2_b1.text()), float(self.sys2_c1.text())
                a2, b2, c2 = float(self.sys2_a2.text()), float(self.sys2_b2.text()), float(self.sys2_c2.text())
                res = self.engine.solve_linear_system_2x2(a1, b1, c1, a2, b2, c2)
                expr_str = f"2x2 System: {a1}x+{b1}y={c1}, {a2}x+{b2}y={c2}"
                self.last_plottable_expression = None

                out = [f"=== LINEAR SYSTEM 2x2 SOLVER ===", ""]
                if res["is_solvable"]:
                    out.append(f"Solution: x = {res['x']:g}, y = {res['y']:g}")
                else:
                    out.append(f"Status: {res['message']}")
                out.append("\n--- Cramer's Rule Steps ---")
                out.extend(res["steps"])
                result_str = "\n".join(out)

            elif idx == 3:  # Linear 3x3
                a1, b1, c1, d1 = float(self.sys3_a1.text()), float(self.sys3_b1.text()), float(self.sys3_c1.text()), float(self.sys3_d1.text())
                a2, b2, c2, d2 = float(self.sys3_a2.text()), float(self.sys3_b2.text()), float(self.sys3_c2.text()), float(self.sys3_d2.text())
                a3, b3, c3, d3 = float(self.sys3_a3.text()), float(self.sys3_b3.text()), float(self.sys3_c3.text()), float(self.sys3_d3.text())
                res = self.engine.solve_linear_system_3x3(a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3)
                expr_str = "3x3 Linear System"
                self.last_plottable_expression = None

                out = [f"=== LINEAR SYSTEM 3x3 SOLVER ===", ""]
                if res["is_solvable"]:
                    out.append(f"Solution: x = {res['x']:g}, y = {res['y']:g}, z = {res['z']:g}")
                else:
                    out.append(f"Status: {res['message']}")
                out.append("\n--- Cramer's Rule Steps ---")
                out.extend(res["steps"])
                result_str = "\n".join(out)

            elif idx == 4:  # Single Equation
                expr = self.single_expr.text().strip()
                rmin = float(self.single_min.text())
                rmax = float(self.single_max.text())
                res = self.engine.solve_general_equation(expr, range_min=rmin, range_max=rmax)
                expr_str = f"f(x) = {expr} = 0 on [{rmin}, {rmax}]"
                self.last_plottable_expression = expr

                out = [f"=== NONLINEAR ROOT SOLVER: {expr_str} ===", ""]
                if res["ok"]:
                    if res["roots"]:
                        out.append(f"Real Roots Found ({len(res['roots'])}):")
                        for r in res["roots"]:
                            out.append(f"  x = {r:g}")
                    else:
                        out.append("No real roots found in the given range.")
                else:
                    out.append(f"Error: {res.get('error', 'Unknown error')}")
                result_str = "\n".join(out)

            elif idx == 5:  # Quadratic Inequality
                a = float(self.ineq_a.text())
                b = float(self.ineq_b.text())
                c = float(self.ineq_c.text())
                op = self.ineq_op.currentText()
                res = self.engine.solve_quadratic_inequality(a, b, c, op)
                expr_str = f"{a}x² + {b}x + {c} {op} 0"
                self.last_plottable_expression = f"{a}*x**2 + {b}*x + {c}"

                out = [f"=== QUADRATIC INEQUALITY SOLVER ===", f"Inequality: {expr_str}", ""]
                out.append(f"Solution Interval: {res['intervals']}")
                result_str = "\n".join(out)

            self.output.setText(result_str)
            get_history_manager().add_entry(f"Equation: {expr_str}", result_str.split("\n")[2] if len(result_str.split("\n")) > 2 else result_str)

        except Exception as e:
            self.output.setText(f"Error solving equation: {e}")

    def plot_in_graph(self):
        if not self.last_plottable_expression:
            self.solve()
        if self.last_plottable_expression:
            app = QApplication.instance()
            if app:
                for widget in app.topLevelWidgets():
                    if hasattr(widget, "switch_page") and hasattr(widget, "stack"):
                        # Graph page is at index 3
                        widget.switch_page(3)
                        graph_page = widget.stack.widget(3)
                        if graph_page and hasattr(graph_page, "input_eq"):
                            graph_page.input_eq.setText(self.last_plottable_expression)
                            if hasattr(graph_page, "plot_graph"):
                                graph_page.plot_graph()
                        break
