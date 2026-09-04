from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QComboBox, QTextEdit, QFormLayout, QGroupBox
)
from core.regression_engine import RegressionEngine


class RegressionPage(QWidget):
    def __init__(self):
        super().__init__()
        self.engine = RegressionEngine()
        self.last_fit_result = None
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)

        # Title
        title = QLabel("📈 Regression & Curve Fitting")
        title.setStyleSheet("font-size: 18px; font-weight: bold; color: #00ffaa;")
        layout.addWidget(title)

        # Data Entry Group
        data_group = QGroupBox("Data Input")
        data_layout = QFormLayout(data_group)

        self.x_input = QLineEdit()
        self.x_input.setPlaceholderText("Comma/space separated X values: e.g. 1, 2, 3, 4, 5")
        data_layout.addRow("X Values:", self.x_input)

        self.y_input = QLineEdit()
        self.y_input.setPlaceholderText("Comma/space separated Y values: e.g. 2.1, 3.9, 6.1, 8.2, 9.8")
        data_layout.addRow("Y Values:", self.y_input)

        self.model_combo = QComboBox()
        self.model_combo.addItems([
            "Linear (y = mx + b)",
            "Polynomial Deg 2 (y = ax² + bx + c)",
            "Polynomial Deg 3",
            "Polynomial Deg 4",
            "Polynomial Deg 5",
            "Exponential (y = a * e^(bx))",
            "Logarithmic (y = a + b * ln(x))",
            "Power (y = a * x^b)",
        ])
        data_layout.addRow("Model Type:", self.model_combo)

        self.fit_btn = QPushButton("Fit Regression Model")
        self.fit_btn.setObjectName("OperatorBtn")
        self.fit_btn.setStyleSheet("""
            QPushButton {
                background-color: #00ffaa;
                color: #111;
                font-weight: bold;
                padding: 8px 16px;
                border-radius: 6px;
            }
            QPushButton:hover {
                background-color: #00cc88;
            }
        """)
        self.fit_btn.clicked.connect(self.calculate_regression)
        data_layout.addRow(self.fit_btn)

        layout.addWidget(data_group)

        # Result Group
        result_group = QGroupBox("Model Results")
        result_layout = QVBoxLayout(result_group)

        self.output = QTextEdit()
        self.output.setReadOnly(True)
        self.output.setStyleSheet("font-family: monospace; font-size: 13px;")
        result_layout.addWidget(self.output)

        # Prediction & Inverse Prediction Sub-section
        pred_layout = QHBoxLayout()
        pred_layout.addWidget(QLabel("Predict Y for X ="))
        self.pred_x_input = QLineEdit()
        self.pred_x_input.setPlaceholderText("X value")
        pred_layout.addWidget(self.pred_x_input)

        self.pred_btn = QPushButton("Predict Y")
        self.pred_btn.clicked.connect(self.predict_y)
        pred_layout.addWidget(self.pred_btn)

        self.pred_result_lbl = QLabel("")
        self.pred_result_lbl.setStyleSheet("font-weight: bold; color: #00ffaa;")
        pred_layout.addWidget(self.pred_result_lbl)

        result_layout.addLayout(pred_layout)

        inv_layout = QHBoxLayout()
        inv_layout.addWidget(QLabel("Inverse Predict X for Y ="))
        self.pred_y_input = QLineEdit()
        self.pred_y_input.setPlaceholderText("Y value")
        inv_layout.addWidget(self.pred_y_input)

        self.inv_btn = QPushButton("Predict X")
        self.inv_btn.clicked.connect(self.predict_x)
        inv_layout.addWidget(self.inv_btn)

        self.inv_result_lbl = QLabel("")
        self.inv_result_lbl.setStyleSheet("font-weight: bold; color: #00ffaa;")
        inv_layout.addWidget(self.inv_result_lbl)

        result_layout.addLayout(inv_layout)
        layout.addWidget(result_group)

    def _parse_list(self, text: str):
        text = text.replace(",", " ").strip()
        if not text:
            return []
        return [float(val) for val in text.split() if val]

    def calculate_regression(self):
        try:
            x_pts = self._parse_list(self.x_input.text())
            y_pts = self._parse_list(self.y_input.text())

            if not x_pts or not y_pts:
                self.output.setText("Error: Please enter valid numeric values for X and Y.")
                return

            if len(x_pts) != len(y_pts):
                self.output.setText(f"Error: X count ({len(x_pts)}) does not match Y count ({len(y_pts)}).")
                return

            model_idx = self.model_combo.currentIndex()
            if model_idx == 0:
                res = self.engine.fit(x_pts, y_pts, "linear")
            elif model_idx == 1:
                res = self.engine.fit(x_pts, y_pts, "polynomial", degree=2)
            elif model_idx == 2:
                res = self.engine.fit(x_pts, y_pts, "polynomial", degree=3)
            elif model_idx == 3:
                res = self.engine.fit(x_pts, y_pts, "polynomial", degree=4)
            elif model_idx == 4:
                res = self.engine.fit(x_pts, y_pts, "polynomial", degree=5)
            elif model_idx == 5:
                res = self.engine.fit(x_pts, y_pts, "exponential")
            elif model_idx == 6:
                res = self.engine.fit(x_pts, y_pts, "logarithmic")
            elif model_idx == 7:
                res = self.engine.fit(x_pts, y_pts, "power")
            else:
                res = self.engine.fit(x_pts, y_pts, "linear")

            self.last_fit_result = res

            lines = [
                f"=== REGRESSION FIT RESULT ===",
                f"Model: {res.get('type', 'Custom')}",
                f"Equation: {res.get('equation', 'N/A')}",
                f"R² (Coefficient of Determination): {res.get('r2', 0.0):.6f}",
                f"Adjusted R²: {res.get('adjusted_r2', 0.0):.6f}",
                f"RMSE: {res.get('rmse', 0.0):.6f}",
                f"MAE: {res.get('mae', 0.0):.6f}",
                f"Sum of Squared Residuals (SS_res): {res.get('ss_res', 0.0):.6f}",
                f"Total Sum of Squares (SS_tot): {res.get('ss_tot', 0.0):.6f}",
            ]
            if "slope" in res:
                lines.append(f"Slope (m): {res['slope']:.6f}")
                lines.append(f"Intercept (b): {res['intercept']:.6f}")
            if "coefficients" in res:
                lines.append("Coefficients (descending degree): " + ", ".join(f"{c:.6f}" for c in res["coefficients"]))
            if "a" in res and "b" in res:
                lines.append(f"Parameter a: {res['a']:.6f}")
                lines.append(f"Parameter b: {res['b']:.6f}")

            if "residuals" in res and res["residuals"]:
                lines.append("\nResidual Analysis Table:")
                lines.append("  # |      X      |  Observed Y  | Predicted Y  |   Residual   ")
                lines.append("-" * 65)
                for idx, item in enumerate(res["residuals"]):
                    lines.append(f"{idx+1:3d} | {item['x']:11.4f} | {item['y_observed']:12.4f} | {item['y_predicted']:12.4f} | {item['residual']:12.4f}")

            self.output.setText("\n".join(lines))
            self.pred_result_lbl.setText("")
            self.inv_result_lbl.setText("")
        except Exception as e:
            self.output.setText(f"Error: {str(e)}")
            self.last_fit_result = None

    def predict_y(self):
        if not self.last_fit_result:
            self.pred_result_lbl.setText("Fit a model first!")
            return
        try:
            x_val = float(self.pred_x_input.text().strip())
            y_pred = self.engine.predict(self.last_fit_result, x_val)
            self.pred_result_lbl.setText(f"Predicted Y = {y_pred:.6f}")
        except Exception as e:
            self.pred_result_lbl.setText(f"Error: {str(e)}")

    def predict_x(self):
        if not self.last_fit_result:
            self.inv_result_lbl.setText("Fit a model first!")
            return
        try:
            y_val = float(self.pred_y_input.text().strip())
            x_roots = self.engine.inverse_predict(self.last_fit_result, y_val)
            if not x_roots:
                self.inv_result_lbl.setText("No real root found for Y")
            else:
                formatted = ", ".join(f"{r:.6f}" for r in x_roots)
                self.inv_result_lbl.setText(f"Predicted X ≈ {formatted}")
        except Exception as e:
            self.inv_result_lbl.setText(f"Error: {str(e)}")
