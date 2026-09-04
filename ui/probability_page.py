from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QComboBox, QTextEdit, QFormLayout, QGroupBox, QStackedLayout
)
from core.distributions_engine import DistributionsEngine, student_t_pdf


class ProbabilityPage(QWidget):
    def __init__(self):
        super().__init__()
        self.engine = DistributionsEngine()
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)

        # Title
        title = QLabel("🎲 Probability Distributions")
        title.setStyleSheet("font-size: 18px; font-weight: bold; color: #00ffaa;")
        layout.addWidget(title)

        # Controls Group
        controls_group = QGroupBox("Distribution & Parameters")
        controls_layout = QFormLayout(controls_group)

        self.dist_combo = QComboBox()
        self.dist_combo.addItems([
            "Normal Distribution N(μ, σ)",
            "Student's t-Distribution t(df)",
            "Chi-Square Distribution χ²(df)",
            "Binomial Distribution B(n, p)",
            "Poisson Distribution Poisson(λ)",
        ])
        self.dist_combo.currentIndexChanged.connect(self._on_dist_change)
        controls_layout.addRow("Distribution:", self.dist_combo)

        # Parameter fields
        self.param1_label = QLabel("Mean (μ):")
        self.param1_input = QLineEdit("0.0")
        controls_layout.addRow(self.param1_label, self.param1_input)

        self.param2_label = QLabel("Std Dev (σ):")
        self.param2_input = QLineEdit("1.0")
        controls_layout.addRow(self.param2_label, self.param2_input)

        # Variable input field (x or k or p)
        self.val_label = QLabel("Value (x or k or p):")
        self.val_input = QLineEdit("0.0")
        controls_layout.addRow(self.val_label, self.val_input)

        self.calc_btn = QPushButton("Calculate Probability")
        self.calc_btn.setStyleSheet("""
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
        self.calc_btn.clicked.connect(self.calculate)
        controls_layout.addRow(self.calc_btn)

        layout.addWidget(controls_group)

        # Output Group
        output_group = QGroupBox("Distribution Results")
        output_layout = QVBoxLayout(output_group)

        self.output = QTextEdit()
        self.output.setReadOnly(True)
        self.output.setStyleSheet("font-family: monospace; font-size: 13px;")
        output_layout.addWidget(self.output)

        layout.addWidget(output_group)

    def _on_dist_change(self, idx: int):
        if idx == 0:  # Normal
            self.param1_label.setText("Mean (μ):")
            self.param1_input.setText("0.0")
            self.param1_label.setVisible(True)
            self.param1_input.setVisible(True)

            self.param2_label.setText("Std Dev (σ):")
            self.param2_input.setText("1.0")
            self.param2_label.setVisible(True)
            self.param2_input.setVisible(True)

            self.val_label.setText("Value (x or probability p):")
            self.val_input.setText("0.0")

        elif idx == 1:  # Student's t
            self.param1_label.setText("Degrees of Freedom (df):")
            self.param1_input.setText("10")
            self.param1_label.setVisible(True)
            self.param1_input.setVisible(True)

            self.param2_label.setVisible(False)
            self.param2_input.setVisible(False)

            self.val_label.setText("t-score or probability p:")
            self.val_input.setText("1.96")

        elif idx == 2:  # Chi-Square
            self.param1_label.setText("Degrees of Freedom (df):")
            self.param1_input.setText("5")
            self.param1_label.setVisible(True)
            self.param1_input.setVisible(True)

            self.param2_label.setVisible(False)
            self.param2_input.setVisible(False)

            self.val_label.setText("χ² value:")
            self.val_input.setText("11.07")

        elif idx == 3:  # Binomial
            self.param1_label.setText("Number of Trials (n):")
            self.param1_input.setText("10")
            self.param1_label.setVisible(True)
            self.param1_input.setVisible(True)

            self.param2_label.setText("Success Prob (p):")
            self.param2_input.setText("0.5")
            self.param2_label.setVisible(True)
            self.param2_input.setVisible(True)

            self.val_label.setText("Successes (k):")
            self.val_input.setText("5")

        elif idx == 4:  # Poisson
            self.param1_label.setText("Rate Parameter (λ):")
            self.param1_input.setText("3.0")
            self.param1_label.setVisible(True)
            self.param1_input.setVisible(True)

            self.param2_label.setVisible(False)
            self.param2_input.setVisible(False)

            self.val_label.setText("Occurrences (k):")
            self.val_input.setText("3")

    def calculate(self):
        try:
            idx = self.dist_combo.currentIndex()
            lines = []

            if idx == 0:  # Normal
                mean = float(self.param1_input.text())
                std = float(self.param2_input.text())
                if std <= 0:
                    self.output.setText("Error: Standard deviation must be > 0.")
                    return
                val = float(self.val_input.text())

                pdf_v = self.engine.normal_pdf(val, mean, std)
                cdf_v = self.engine.normal_cdf(val, mean, std)
                lines.append(f"=== NORMAL DISTRIBUTION N({mean}, {std}) ===")
                lines.append(f"X = {val}")
                lines.append(f"PDF f(x) = {pdf_v:.6f}")
                lines.append(f"CDF P(X <= x) = {cdf_v:.6f}")
                lines.append(f"P(X > x) = {1.0 - cdf_v:.6f}")

                # If 0 < val < 1, also compute quantile
                if 0.0 < val < 1.0:
                    q_v = self.engine.normal_quantile(val, mean, std)
                    lines.append(f"Quantile for p = {val}: x = {q_v:.6f}")

            elif idx == 1:  # Student's t
                df = float(self.param1_input.text())
                if df <= 0:
                    self.output.setText("Error: Degrees of freedom must be > 0.")
                    return
                val = float(self.val_input.text())

                pdf_v = student_t_pdf(val, df)
                cdf_v = self.engine.student_t_cdf(val, df)
                lines.append(f"=== STUDENT'S t-DISTRIBUTION t(df={df}) ===")
                lines.append(f"t = {val}")
                lines.append(f"PDF f(t) = {pdf_v:.6f}")
                lines.append(f"CDF P(T <= t) = {cdf_v:.6f}")
                lines.append(f"P(T > t) = {1.0 - cdf_v:.6f}")

                if 0.0 < val < 1.0:
                    q_v = self.engine.student_t_quantile(val, df)
                    lines.append(f"Quantile for p = {val}: t = {q_v:.6f}")

            elif idx == 2:  # Chi-Square
                df = float(self.param1_input.text())
                if df <= 0:
                    self.output.setText("Error: Degrees of freedom must be > 0.")
                    return
                val = float(self.val_input.text())

                cdf_v = self.engine.chi_square_cdf(val, df)
                lines.append(f"=== CHI-SQUARE DISTRIBUTION χ²(df={df}) ===")
                lines.append(f"χ² = {val}")
                lines.append(f"CDF P(X <= χ²) = {cdf_v:.6f}")
                lines.append(f"p-value P(X >= χ²) = {1.0 - cdf_v:.6f}")

            elif idx == 3:  # Binomial
                n = int(float(self.param1_input.text()))
                p = float(self.param2_input.text())
                k = int(float(self.val_input.text()))

                if n < 0 or not (0.0 <= p <= 1.0) or k < 0 or k > n:
                    self.output.setText("Error: Invalid Binomial parameters (0 <= k <= n, 0 <= p <= 1).")
                    return

                pmf_v = self.engine.binomial_pmf(k, n, p)
                cdf_v = sum(self.engine.binomial_pmf(i, n, p) for i in range(k + 1))

                lines.append(f"=== BINOMIAL DISTRIBUTION B(n={n}, p={p}) ===")
                lines.append(f"k = {k}")
                lines.append(f"PMF P(X = k) = {pmf_v:.6f}")
                lines.append(f"CDF P(X <= k) = {cdf_v:.6f}")
                lines.append(f"P(X > k) = {1.0 - cdf_v:.6f}")

            elif idx == 4:  # Poisson
                lam = float(self.param1_input.text())
                k = int(float(self.val_input.text()))

                if lam <= 0 or k < 0:
                    self.output.setText("Error: λ must be > 0 and k >= 0.")
                    return

                pmf_v = self.engine.poisson_pmf(k, lam)
                cdf_v = sum(self.engine.poisson_pmf(i, lam) for i in range(k + 1))

                lines.append(f"=== POISSON DISTRIBUTION Poisson(λ={lam}) ===")
                lines.append(f"k = {k}")
                lines.append(f"PMF P(X = k) = {pmf_v:.6f}")
                lines.append(f"CDF P(X <= k) = {cdf_v:.6f}")
                lines.append(f"P(X > k) = {1.0 - cdf_v:.6f}")

            self.output.setText("\n".join(lines))
        except Exception as e:
            self.output.setText(f"Error: {str(e)}")
