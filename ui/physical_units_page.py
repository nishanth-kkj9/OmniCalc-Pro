from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QComboBox, QTextEdit, QFormLayout, QGroupBox, QStackedLayout, QTableWidget, QTableWidgetItem, QHeaderView
)
from PySide6.QtCore import Qt
from core.units_engine import UnitsEngine
from core.history_manager import get_history_manager


class PhysicalUnitsPage(QWidget):
    def __init__(self):
        super().__init__()
        self.engine = UnitsEngine()
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)

        # Title
        title = QLabel("⚛ Physical Units & Dimensional Analysis")
        title.setStyleSheet("font-size: 18px; font-weight: bold; color: #00ffaa;")
        layout.addWidget(title)

        # Mode Selection
        mode_layout = QHBoxLayout()
        mode_layout.addWidget(QLabel("Module:"))
        self.mode_combo = QComboBox()
        self.mode_combo.addItems([
            "Unit Converter & Dimensional Validator",
            "Compound Unit Arithmetic (Dimension Checker)",
            "Universal Physical Constants Library",
            "Physics Formula Solver"
        ])
        self.mode_combo.currentIndexChanged.connect(self._on_mode_changed)
        mode_layout.addWidget(self.mode_combo, 1)
        layout.addLayout(mode_layout)

        # Inputs Container
        self.inputs_group = QGroupBox("Inputs")
        self.inputs_layout = QStackedLayout(self.inputs_group)

        # 0. Converter Panel
        conv_widget = QWidget()
        conv_form = QFormLayout(conv_widget)
        self.conv_val = QLineEdit("100")
        self.conv_from = QComboBox()
        self.conv_to = QComboBox()
        unit_symbols = list(self.engine.UNITS.keys())
        self.conv_from.addItems(unit_symbols)
        self.conv_to.addItems(unit_symbols)
        self.conv_from.setCurrentText("km")
        self.conv_to.setCurrentText("mi")

        conv_form.addRow("Value:", self.conv_val)
        conv_form.addRow("From Unit:", self.conv_from)
        conv_form.addRow("To Unit:", self.conv_to)
        self.inputs_layout.addWidget(conv_widget)

        # 1. Compound Arithmetic Panel
        comp_widget = QWidget()
        comp_form = QFormLayout(comp_widget)
        self.comp_v1 = QLineEdit("50")
        self.comp_u1 = QComboBox()
        self.comp_u1.addItems(unit_symbols)
        self.comp_u1.setCurrentText("N")

        self.comp_op = QComboBox()
        self.comp_op.addItems(["* (Multiply)", "/ (Divide)", "+ (Add)", "- (Subtract)"])

        self.comp_v2 = QLineEdit("10")
        self.comp_u2 = QComboBox()
        self.comp_u2.addItems(unit_symbols)
        self.comp_u2.setCurrentText("m")

        comp_form.addRow("Quantity 1 Value:", self.comp_v1)
        comp_form.addRow("Quantity 1 Unit:", self.comp_u1)
        comp_form.addRow("Operator:", self.comp_op)
        comp_form.addRow("Quantity 2 Value:", self.comp_v2)
        comp_form.addRow("Quantity 2 Unit:", self.comp_u2)
        self.inputs_layout.addWidget(comp_widget)

        # 2. Physical Constants Panel
        const_widget = QWidget()
        const_layout = QVBoxLayout(const_widget)
        const_label = QLabel("Universal Physics Constants with Exact SI Dimensions:")
        const_layout.addWidget(const_label)
        self.const_table = QTableWidget()
        self.const_table.setColumnCount(5)
        self.const_table.setHorizontalHeaderLabels(["Symbol", "Constant Name", "Value", "Unit", "Dimensions"])
        self.const_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self._populate_constants_table()
        const_layout.addWidget(self.const_table)
        self.inputs_layout.addWidget(const_widget)

        # 3. Physics Formula Panel
        form_widget = QWidget()
        form_layout = QFormLayout(form_widget)
        self.form_combo = QComboBox()
        self.form_combo.addItems([
            "Newton's 2nd Law: F = m · a",
            "Kinetic Energy: E_k = (1/2) · m · v²",
            "Ohm's Law: V = I · R"
        ])
        self.form_p1 = QLineEdit("10")
        self.form_p1_label = QLabel("Param 1:")
        self.form_p2 = QLineEdit("9.80665")
        self.form_p2_label = QLabel("Param 2:")

        form_layout.addRow("Select Formula:", self.form_combo)
        form_layout.addRow(self.form_p1_label, self.form_p1)
        form_layout.addRow(self.form_p2_label, self.form_p2)
        self.inputs_layout.addWidget(form_widget)

        layout.addWidget(self.inputs_group)

        # Calculate Button
        btn_layout = QHBoxLayout()
        self.calc_btn = QPushButton("Process Unit Conversion / Calculation")
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
        output_group = QGroupBox("Results & Dimensional Analysis")
        out_layout = QVBoxLayout(output_group)
        self.output = QTextEdit()
        self.output.setReadOnly(True)
        self.output.setStyleSheet("font-family: monospace; font-size: 13px;")
        out_layout.addWidget(self.output)
        layout.addWidget(output_group)

    def _populate_constants_table(self):
        constants = self.engine.CONSTANTS
        self.const_table.setRowCount(len(constants))
        for row, (sym, data) in enumerate(constants.items()):
            dim_str = self.engine.format_dimension_vector(data["dimensions"])
            self.const_table.setItem(row, 0, QTableWidgetItem(data["symbol"]))
            self.const_table.setItem(row, 1, QTableWidgetItem(data["name"]))
            self.const_table.setItem(row, 2, QTableWidgetItem(f"{data['value']:g}"))
            self.const_table.setItem(row, 3, QTableWidgetItem(data["unit"]))
            self.const_table.setItem(row, 4, QTableWidgetItem(dim_str))

    def _on_mode_changed(self, idx: int):
        self.inputs_layout.setCurrentIndex(idx)

    def calculate(self):
        idx = self.mode_combo.currentIndex()
        try:
            if idx == 0:  # Converter
                val = float(self.conv_val.text())
                u1 = self.conv_from.currentText()
                u2 = self.conv_to.currentText()

                res = self.engine.convert_unit(val, u1, u2)
                dim_vector_str = self.engine.format_dimension_vector(res["dimension_vector"])
                out = [
                    f"=== UNIT CONVERSION RESULTS ===",
                    f"Conversion: {val:g} {u1}  ➔  {res['value']:.8g} {u2}",
                    "",
                    f"Physical Quantity:  {res['dimension_name']}",
                    f"Dimension Vector:   {dim_vector_str}",
                    f"Base SI Value:      {res['base_si_value']:.8g}"
                ]
                res_str = f"{res['value']:.8g} {u2}"
                summary_expr = f"Convert: {val:g} {u1} -> {u2}"

            elif idx == 1:  # Compound Unit Arithmetic
                v1 = float(self.comp_v1.text())
                u1 = self.comp_u1.currentText()
                op = self.comp_op.currentText().split()[0]
                v2 = float(self.comp_v2.text())
                u2 = self.comp_u2.currentText()

                res = self.engine.evaluate_compound_unit(v1, u1, op, v2, u2)
                out = [
                    f"=== COMPOUND UNIT ARITHMETIC ===",
                    f"Operation: ({v1:g} {u1}) {op} ({v2:g} {u2})",
                    "",
                    f"Dimensional Consistency: VALID",
                    f"Resulting Quantity Name: {res['dimension_name']}",
                    f"Resulting Dimensions:    {res['formatted_dimensions']}",
                    f"Result Base Value:       {res['result_base_val']:.8g} (SI)",
                    f"Result User Value:       {res['result_user_val']:.8g} {u1}"
                ]
                res_str = f"{res['result_base_val']:.8g} SI"
                summary_expr = f"Units: ({v1:g} {u1}) {op} ({v2:g} {u2})"

            elif idx == 2:  # Constants
                out = ["Selected Physical Constants displayed in the table above."]
                res_str = "Constants"
                summary_expr = "Constants View"

            elif idx == 3:  # Physics Formula Solver
                f_idx = self.form_combo.currentIndex()
                if f_idx == 0:
                    res = self.engine.solve_physics_formula("newton_f_ma", {"m": float(self.form_p1.text()), "a": float(self.form_p2.text())})
                elif f_idx == 1:
                    res = self.engine.solve_physics_formula("kinetic_energy", {"m": float(self.form_p1.text()), "v": float(self.form_p2.text())})
                else:
                    res = self.engine.solve_physics_formula("ohms_law", {"i": float(self.form_p1.text()), "r": float(self.form_p2.text())})

                out = [
                    f"=== PHYSICS FORMULA SOLVER ===",
                    f"Formula: {res['formula']}",
                    f"Result:  {res['result_value']:.8g} {res['result_unit']}",
                    f"Quantity:{res['dimension_name']}",
                    "",
                    "Calculation Steps:"
                ]
                out.extend(f"• {step}" for step in res["steps"])
                res_str = f"{res['result_value']:.8g} {res['result_unit']}"
                summary_expr = f"Physics: {res['formula']}"

            result_text = "\n".join(out)
            self.output.setText(result_text)
            get_history_manager().add_entry(summary_expr, res_str)

        except Exception as e:
            self.output.setText(f"Error evaluating units/physics: {e}")
