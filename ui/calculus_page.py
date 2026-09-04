from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QComboBox, QTextEdit, QFormLayout, QGroupBox, QStackedLayout, QApplication
)
from PySide6.QtCore import Qt
from core.calculus_engine import CalculusEngine
from core.history_manager import get_history_manager


class CalculusPage(QWidget):
    def __init__(self):
        super().__init__()
        self.engine = CalculusEngine(angle_mode="radians")
        self.last_plottable_expressions = []
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)

        # Title
        title = QLabel("∫ Calculus & Numerical Analysis")
        title.setStyleSheet("font-size: 18px; font-weight: bold; color: #00ffaa;")
        layout.addWidget(title)

        # Mode Selection
        mode_layout = QHBoxLayout()
        mode_layout.addWidget(QLabel("Calculus Tool:"))
        self.mode_combo = QComboBox()
        self.mode_combo.addItems([
            "Derivative f'(x₀)",
            "Second Derivative f''(x₀)",
            "Definite Integration ∫ f(x) dx",
            "Tangent & Normal Lines",
            "Root Finding f(x) = 0",
            "Newton-Raphson Iterations",
            "Area Between Curves",
        ])
        self.mode_combo.currentIndexChanged.connect(self._on_mode_changed)
        mode_layout.addWidget(self.mode_combo, 1)
        layout.addLayout(mode_layout)

        # Inputs Container
        self.inputs_group = QGroupBox("Inputs")
        self.inputs_layout = QStackedLayout(self.inputs_group)

        # 0. Derivative f'(x0)
        d1_widget = QWidget()
        d1_form = QFormLayout(d1_widget)
        self.d1_expr = QLineEdit("x**3 - 3*x + 2")
        self.d1_x0 = QLineEdit("2")
        d1_form.addRow("f(x):", self.d1_expr)
        d1_form.addRow("At point x₀:", self.d1_x0)
        self.inputs_layout.addWidget(d1_widget)

        # 1. Second Derivative f''(x0)
        d2_widget = QWidget()
        d2_form = QFormLayout(d2_widget)
        self.d2_expr = QLineEdit("sin(x) + x**2")
        self.d2_x0 = QLineEdit("3.14159")
        d2_form.addRow("f(x):", self.d2_expr)
        d2_form.addRow("At point x₀:", self.d2_x0)
        self.inputs_layout.addWidget(d2_widget)

        # 2. Definite Integration ∫ f(x) dx
        integ_widget = QWidget()
        integ_form = QFormLayout(integ_widget)
        self.integ_expr = QLineEdit("x**2 * sin(x)")
        self.integ_a = QLineEdit("0")
        self.integ_b = QLineEdit("3.14159")
        self.integ_method = QComboBox()
        self.integ_method.addItems(["simpson", "trapezoid", "midpoint", "adaptive"])
        self.integ_subdiv = QLineEdit("100")
        integ_form.addRow("f(x):", self.integ_expr)
        r_lim = QHBoxLayout()
        r_lim.addWidget(self.integ_a); r_lim.addWidget(QLabel("to")); r_lim.addWidget(self.integ_b)
        integ_form.addRow("Limits [a, b]:", r_lim)
        integ_form.addRow("Method:", self.integ_method)
        integ_form.addRow("Subdivisions:", self.integ_subdiv)
        self.inputs_layout.addWidget(integ_widget)

        # 3. Tangent & Normal Lines
        tan_widget = QWidget()
        tan_form = QFormLayout(tan_widget)
        self.tan_expr = QLineEdit("x**2")
        self.tan_x0 = QLineEdit("1")
        tan_form.addRow("f(x):", self.tan_expr)
        tan_form.addRow("At point x₀:", self.tan_x0)
        self.inputs_layout.addWidget(tan_widget)

        # 4. Root Finding
        root_widget = QWidget()
        root_form = QFormLayout(root_widget)
        self.root_expr = QLineEdit("cos(x) - x")
        self.root_a = QLineEdit("-10")
        self.root_b = QLineEdit("10")
        root_form.addRow("f(x):", self.root_expr)
        r_r = QHBoxLayout()
        r_r.addWidget(self.root_a); r_r.addWidget(QLabel("to")); r_r.addWidget(self.root_b)
        root_form.addRow("Search Interval:", r_r)
        self.inputs_layout.addWidget(root_widget)

        # 5. Newton-Raphson
        nr_widget = QWidget()
        nr_form = QFormLayout(nr_widget)
        self.nr_expr = QLineEdit("x**3 - x - 2")
        self.nr_x0 = QLineEdit("1.5")
        self.nr_max = QLineEdit("20")
        nr_form.addRow("f(x) = 0:", self.nr_expr)
        nr_form.addRow("Initial Guess x₀:", self.nr_x0)
        nr_form.addRow("Max Iterations:", self.nr_max)
        self.inputs_layout.addWidget(nr_widget)

        # 6. Area Between Curves
        area_widget = QWidget()
        area_form = QFormLayout(area_widget)
        self.area_f1 = QLineEdit("x**2")
        self.area_f2 = QLineEdit("x")
        self.area_a = QLineEdit("0")
        self.area_b = QLineEdit("1")
        area_form.addRow("f₁(x):", self.area_f1)
        area_form.addRow("f₂(x):", self.area_f2)
        r_a = QHBoxLayout()
        r_a.addWidget(self.area_a); r_a.addWidget(QLabel("to")); r_a.addWidget(self.area_b)
        area_form.addRow("Limits [a, b]:", r_a)
        self.inputs_layout.addWidget(area_widget)

        layout.addWidget(self.inputs_group)

        # Action Buttons
        btn_layout = QHBoxLayout()
        self.calc_btn = QPushButton("Calculate")
        self.calc_btn.setStyleSheet("""
            QPushButton {
                background-color: #00ffaa; color: #111; font-weight: bold;
                padding: 8px 16px; border-radius: 6px;
            }
            QPushButton:hover { background-color: #00cc88; }
        """)
        self.calc_btn.clicked.connect(self.calculate)
        btn_layout.addWidget(self.calc_btn)

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
        output_group = QGroupBox("Results & Step Breakdown")
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
            if idx == 0:  # Derivative
                expr = self.d1_expr.text().strip()
                x0 = float(self.d1_x0.text())
                val = self.engine.calculate_derivative(expr, x0)
                expr_str = f"d/dx ({expr}) at x = {x0}"
                self.last_plottable_expressions = [expr]

                if val is not None:
                    res_str = f"f'({x0:g}) = {val:.8g}"
                    out = [f"=== FIRST DERIVATIVE ===", f"Function: f(x) = {expr}", f"Point x₀: {x0:g}", "", res_str]
                else:
                    res_str = "Error: Undefined derivative"
                    out = [res_str]

            elif idx == 1:  # Second Derivative
                expr = self.d2_expr.text().strip()
                x0 = float(self.d2_x0.text())
                val = self.engine.calculate_second_derivative(expr, x0)
                expr_str = f"d²/dx² ({expr}) at x = {x0}"
                self.last_plottable_expressions = [expr]

                if val is not None:
                    res_str = f"f''({x0:g}) = {val:.8g}"
                    out = [f"=== SECOND DERIVATIVE ===", f"Function: f(x) = {expr}", f"Point x₀: {x0:g}", "", res_str]
                else:
                    res_str = "Error: Undefined second derivative"
                    out = [res_str]

            elif idx == 2:  # Integration
                expr = self.integ_expr.text().strip()
                a = float(self.integ_a.text())
                b = float(self.integ_b.text())
                method = self.integ_method.currentText()
                subdiv = int(self.integ_subdiv.text())
                res = self.engine.integrate_definite(expr, a, b, subdivisions=subdiv, method=method)
                expr_str = f"∫[{a}, {b}] ({expr}) dx"
                self.last_plottable_expressions = [expr]

                if res:
                    res_str = f"Integral Value = {res['value']:.8g}"
                    out = [
                        f"=== DEFINITE INTEGRATION ===",
                        f"Function: f(x) = {expr}",
                        f"Limits: [{a:g}, {b:g}]",
                        f"Method: {res['method']} (Subdivisions: {res['subdivisions']})",
                        "",
                        res_str
                    ]
                else:
                    res_str = "Error: Integration failed"
                    out = [res_str]

            elif idx == 3:  # Tangent & Normal
                expr = self.tan_expr.text().strip()
                x0 = float(self.tan_x0.text())
                tan_res = self.engine.calculate_tangent_line(expr, x0)
                norm_res = self.engine.calculate_normal_line(expr, x0)
                expr_str = f"Tangent & Normal to ({expr}) at x = {x0}"

                out = [f"=== TANGENT & NORMAL LINES ===", f"Function: f(x) = {expr}", f"Point: x₀ = {x0:g}"]
                self.last_plottable_expressions = [expr]

                if tan_res:
                    out.append(f"\nTangent Line: {tan_res['equation']}")
                    out.append(f"  Point of tangency: ({tan_res['x0']:g}, {tan_res['y0']:g})")
                    out.append(f"  Slope m = {tan_res['slope']:g}")
                    # Extract RHS of y = mx + b for graph plotting
                    if "y = " in tan_res['equation']:
                        self.last_plottable_expressions.append(tan_res['equation'].replace("y = ", ""))
                if norm_res:
                    out.append(f"\nNormal Line: {norm_res['equation']}")
                    if "y = " in norm_res['equation']:
                        self.last_plottable_expressions.append(norm_res['equation'].replace("y = ", ""))

                res_str = tan_res['equation'] if tan_res else "Failed"

            elif idx == 4:  # Root Finding
                expr = self.root_expr.text().strip()
                a = float(self.root_a.text())
                b = float(self.root_b.text())
                from core.equation_engine import EquationEngine
                res = EquationEngine.solve_general_equation(expr, range_min=a, range_max=b)
                expr_str = f"Roots of ({expr}) = 0 on [{a}, {b}]"
                self.last_plottable_expressions = [expr]

                out = [f"=== BRENT ROOT FINDER ===", f"Function: f(x) = {expr}", f"Interval: [{a:g}, {b:g}]", ""]
                if res["ok"] and res["roots"]:
                    out.append(f"Roots ({len(res['roots'])}):")
                    for r in res["roots"]:
                        out.append(f"  x = {r:g}")
                    res_str = f"Roots: {res['roots']}"
                else:
                    res_str = "No roots found"
                    out.append(res_str)

            elif idx == 5:  # Newton-Raphson
                expr = self.nr_expr.text().strip()
                x0 = float(self.nr_x0.text())
                max_i = int(self.nr_max.text())
                res = self.engine.solve_newton_raphson(expr, x0, max_iterations=max_i)
                expr_str = f"Newton-Raphson for ({expr}) = 0 starting at {x0}"
                self.last_plottable_expressions = [expr]

                res_str = f"Root ≈ {res['root']:.8g}"
                out = [f"=== NEWTON-RAPHSON SOLVER ===", f"Function: f(x) = {expr}", f"Initial x₀: {x0:g}", ""]
                out.append(f"Status: {'Converged' if res['converged'] else 'Failed/Max Iterations'}")
                out.append(f"Final Root Approximation: {res['root']:.8g}")
                out.append("\n--- Iteration Log ---")
                out.append(f"{'Iter':<6} {'x_n':<12} {'f(x_n)':<12} {'f\'(x_n)':<12} {'x_{n+1}':<12} {'Error':<12}")
                for row in res["iterations"]:
                    out.append(f"{row['iter']:<6} {row['x']:<12.6g} {row['fx']:<12.6g} {row['fPrime']:<12.6g} {row['nextX']:<12.6g} {row['error']:<12.6g}")

            elif idx == 6:  # Area Between Curves
                f1 = self.area_f1.text().strip()
                f2 = self.area_f2.text().strip()
                a = float(self.area_a.text())
                b = float(self.area_b.text())
                res = self.engine.area_between_curves(f1, f2, a, b)
                expr_str = f"Area between ({f1}) and ({f2}) on [{a}, {b}]"
                self.last_plottable_expressions = [f1, f2]

                if res:
                    res_str = f"Area = {res['value']:.8g}"
                    out = [
                        f"=== AREA BETWEEN CURVES ===",
                        f"Upper/Lower Curves: f₁(x) = {f1}, f₂(x) = {f2}",
                        f"Interval: [{a:g}, {b:g}]",
                        "",
                        res_str
                    ]
                else:
                    res_str = "Error: Area calculation failed"
                    out = [res_str]

            result_text = "\n".join(out)
            self.output.setText(result_text)
            get_history_manager().add_entry(f"Calculus: {expr_str}", res_str)

        except Exception as e:
            self.output.setText(f"Error executing calculus operation: {e}")

    def plot_in_graph(self):
        if not self.last_plottable_expressions:
            self.calculate()
        if self.last_plottable_expressions:
            app = QApplication.instance()
            if app:
                for widget in app.topLevelWidgets():
                    if hasattr(widget, "switch_page") and hasattr(widget, "stack"):
                        # Graph page is index 3
                        widget.switch_page(3)
                        graph_page = widget.stack.widget(3)
                        if graph_page and hasattr(graph_page, "input_eq"):
                            combined = ", ".join(self.last_plottable_expressions)
                            graph_page.input_eq.setText(combined)
                            if hasattr(graph_page, "plot_graph"):
                                graph_page.plot_graph()
                        break
