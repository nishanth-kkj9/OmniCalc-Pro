from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QComboBox, QTextEdit, QFormLayout, QGroupBox, QCheckBox
)
from core.inference_engine import InferenceEngine


class InferencePage(QWidget):
    def __init__(self):
        super().__init__()
        self.engine = InferenceEngine()
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)

        # Title
        title = QLabel("🧪 Hypothesis Testing & Statistical Inference")
        title.setStyleSheet("font-size: 18px; font-weight: bold; color: #00ffaa;")
        layout.addWidget(title)

        # Controls Group
        controls_group = QGroupBox("Test Selector & Inputs")
        controls_layout = QFormLayout(controls_group)

        self.test_combo = QComboBox()
        self.test_combo.addItems([
            "One-Sample Z-Test (Known σ)",
            "One-Sample Student's t-Test (Unknown σ)",
            "Two-Sample t-Test / Welch's t-Test",
            "One-Way ANOVA",
        ])
        self.test_combo.currentIndexChanged.connect(self._on_test_change)
        controls_layout.addRow("Statistical Test:", self.test_combo)

        # Common significance level & alternative
        self.alpha_input = QLineEdit("0.05")
        controls_layout.addRow("Significance Level (α):", self.alpha_input)

        self.alt_combo = QComboBox()
        self.alt_combo.addItems(["two-sided", "greater", "less"])
        controls_layout.addRow("Alternative Hypothesis:", self.alt_combo)

        # Dynamic Inputs
        self.field1_lbl = QLabel("Sample Mean (x̄):")
        self.field1_input = QLineEdit("10.5")
        controls_layout.addRow(self.field1_lbl, self.field1_input)

        self.field2_lbl = QLabel("Sample Size (n):")
        self.field2_input = QLineEdit("30")
        controls_layout.addRow(self.field2_lbl, self.field2_input)

        self.field3_lbl = QLabel("Pop Std Dev (σ):")
        self.field3_input = QLineEdit("2.0")
        controls_layout.addRow(self.field3_lbl, self.field3_input)

        self.field4_lbl = QLabel("Hypothesized Mean (μ0):")
        self.field4_input = QLineEdit("10.0")
        controls_layout.addRow(self.field4_lbl, self.field4_input)

        self.equal_var_cb = QCheckBox("Assume Equal Variances (Pooled t-test)")
        self.equal_var_cb.setVisible(False)
        controls_layout.addRow(self.equal_var_cb)

        self.anova_text = QTextEdit()
        self.anova_text.setPlaceholderText("Enter group data line by line:\nGroup1: 12, 14, 15, 11\nGroup2: 18, 17, 21, 19\nGroup3: 22, 24, 20, 25")
        self.anova_text.setVisible(False)
        self.anova_text.setMaximumHeight(100)
        controls_layout.addRow(self.anova_text)

        self.run_btn = QPushButton("Run Hypothesis Test")
        self.run_btn.setStyleSheet("""
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
        self.run_btn.clicked.connect(self.run_test)
        controls_layout.addRow(self.run_btn)

        layout.addWidget(controls_group)

        # Output Group
        output_group = QGroupBox("Test Results & Decision")
        output_layout = QVBoxLayout(output_group)

        self.output = QTextEdit()
        self.output.setReadOnly(True)
        self.output.setStyleSheet("font-family: monospace; font-size: 13px;")
        output_layout.addWidget(self.output)

        layout.addWidget(output_group)

    def _on_test_change(self, idx: int):
        self.equal_var_cb.setVisible(False)
        self.anova_text.setVisible(False)
        self.alt_combo.setVisible(True)

        if idx == 0:  # One-sample Z
            self.field1_lbl.setText("Sample Mean (x̄):")
            self.field1_input.setText("10.5")
            self.field1_lbl.setVisible(True)
            self.field1_input.setVisible(True)

            self.field2_lbl.setText("Sample Size (n):")
            self.field2_input.setText("30")
            self.field2_lbl.setVisible(True)
            self.field2_input.setVisible(True)

            self.field3_lbl.setText("Pop Std Dev (σ):")
            self.field3_input.setText("2.0")
            self.field3_lbl.setVisible(True)
            self.field3_input.setVisible(True)

            self.field4_lbl.setText("Hypothesized Mean (μ0):")
            self.field4_input.setText("10.0")
            self.field4_lbl.setVisible(True)
            self.field4_input.setVisible(True)

        elif idx == 1:  # One-sample t
            self.field1_lbl.setText("Sample Mean (x̄):")
            self.field1_input.setText("10.5")
            self.field1_lbl.setVisible(True)
            self.field1_input.setVisible(True)

            self.field2_lbl.setText("Sample Std Dev (s):")
            self.field2_input.setText("2.5")
            self.field2_lbl.setVisible(True)
            self.field2_input.setVisible(True)

            self.field3_lbl.setText("Sample Size (n):")
            self.field3_input.setText("25")
            self.field3_lbl.setVisible(True)
            self.field3_input.setVisible(True)

            self.field4_lbl.setText("Hypothesized Mean (μ0):")
            self.field4_input.setText("10.0")
            self.field4_lbl.setVisible(True)
            self.field4_input.setVisible(True)

        elif idx == 2:  # Two-sample t
            self.field1_lbl.setText("Sample 1 Mean (x̄1) & Std (s1) & n1:")
            self.field1_input.setText("12.5, 2.1, 20")
            self.field1_lbl.setVisible(True)
            self.field1_input.setVisible(True)

            self.field2_lbl.setText("Sample 2 Mean (x̄2) & Std (s2) & n2:")
            self.field2_input.setText("10.1, 1.9, 22")
            self.field2_lbl.setVisible(True)
            self.field2_input.setVisible(True)

            self.field3_lbl.setText("Hypothesized Diff (μ1 - μ2):")
            self.field3_input.setText("0.0")
            self.field3_lbl.setVisible(True)
            self.field3_input.setVisible(True)

            self.field4_lbl.setVisible(False)
            self.field4_input.setVisible(False)

            self.equal_var_cb.setVisible(True)

        elif idx == 3:  # ANOVA
            self.field1_lbl.setVisible(False)
            self.field1_input.setVisible(False)
            self.field2_lbl.setVisible(False)
            self.field2_input.setVisible(False)
            self.field3_lbl.setVisible(False)
            self.field3_input.setVisible(False)
            self.field4_lbl.setVisible(False)
            self.field4_input.setVisible(False)
            self.alt_combo.setVisible(False)
            self.anova_text.setVisible(True)

    def run_test(self):
        try:
            idx = self.test_combo.currentIndex()
            alpha = float(self.alpha_input.text())
            alt = self.alt_combo.currentText()

            if idx == 0:  # Z-test
                mean = float(self.field1_input.text())
                n = int(float(self.field2_input.text()))
                sigma = float(self.field3_input.text())
                mu0 = float(self.field4_input.text())
                res = self.engine.z_test(mean, n, sigma, mu0, alpha, alt)

            elif idx == 1:  # 1-sample t
                mean = float(self.field1_input.text())
                s = float(self.field2_input.text())
                n = int(float(self.field3_input.text()))
                mu0 = float(self.field4_input.text())
                res = self.engine.one_sample_t_test(mean, s, n, mu0, alpha, alt)

            elif idx == 2:  # 2-sample t
                s1_parts = [float(x.strip()) for x in self.field1_input.text().split(",") if x.strip()]
                s2_parts = [float(x.strip()) for x in self.field2_input.text().split(",") if x.strip()]
                if len(s1_parts) < 3 or len(s2_parts) < 3:
                    self.output.setText("Error: Enter mean, std_dev, sample_size separated by commas for both samples.")
                    return
                m1, std1, n1 = s1_parts[0], s1_parts[1], int(s1_parts[2])
                m2, std2, n2 = s2_parts[0], s2_parts[1], int(s2_parts[2])
                diff0 = float(self.field3_input.text())
                eq_var = self.equal_var_cb.isChecked()
                res = self.engine.two_sample_t_test(m1, std1, n1, m2, std2, n2, eq_var, diff0, alpha, alt)

            elif idx == 3:  # ANOVA
                raw_text = self.anova_text.toPlainText().strip()
                if not raw_text:
                    self.output.setText("Error: Enter group data in text box.")
                    return
                groups = []
                for line in raw_text.splitlines():
                    if ":" in line:
                        line = line.split(":", 1)[1]
                    vals = [float(x.strip()) for x in line.replace(",", " ").split() if x.strip()]
                    if vals:
                        groups.append(vals)
                if len(groups) < 2:
                    self.output.setText("Error: ANOVA requires at least 2 non-empty groups.")
                    return
                res = self.engine.anova(groups, alpha)

            else:
                return

            lines = [
                f"=== {res.get('test_name', 'Statistical Test')} ===",
                f"Test Statistic: {res.get('statistic', 0.0):.6f}",
            ]
            if "df" in res:
                lines.append(f"Degrees of Freedom: {res['df']:.4f}")
            if "df_between" in res and "df_within" in res:
                lines.append(f"df (between, within): ({res['df_between']}, {res['df_within']})")
            lines.append(f"p-value: {res.get('p_value', 1.0):.6f}")
            lines.append(f"Significance Level (α): {res.get('alpha', 0.05)}")

            reject = res.get("reject_null", False)
            decision_str = "REJECT NULL HYPOTHESIS" if reject else "FAIL TO REJECT NULL HYPOTHESIS"
            lines.append(f"\nDecision: {decision_str}")

            if "confidence_interval" in res:
                ci = res["confidence_interval"]
                lines.append(f"{ci.get('confidence_level', 0.95)*100:.1f}% CI: [{ci.get('lower', 0.0):.6f}, {ci.get('upper', 0.0):.6f}]")
            if "effect_size" in res:
                lines.append(f"Effect Size: {res['effect_size']:.6f}")
            if "eta_squared" in res:
                lines.append(f"Eta Squared (η²): {res['eta_squared']:.6f}")

            self.output.setText("\n".join(lines))
        except Exception as e:
            self.output.setText(f"Error: {str(e)}")
