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
            "Exponential Distribution Exp(λ)",
            "Bernoulli Distribution Bern(p)",
            "Geometric Distribution Geo(p)",
            "Uniform Distribution U(a, b)",
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

        # Optional Interval P(a <= X <= b)
        self.interval_label = QLabel("Interval P(a ≤ X ≤ b):")
        self.interval_input = QLineEdit("")
        self.interval_input.setPlaceholderText("a, b (e.g. -1.0, 1.0)")
        controls_layout.addRow(self.interval_label, self.interval_input)

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

        elif idx == 5:  # Exponential
            self.param1_label.setText("Rate Parameter (λ):")
            self.param1_input.setText("1.5")
            self.param1_label.setVisible(True)
            self.param1_input.setVisible(True)

            self.param2_label.setVisible(False)
            self.param2_input.setVisible(False)

            self.val_label.setText("Value (x or probability p):")
            self.val_input.setText("1.0")

        elif idx == 6:  # Bernoulli
            self.param1_label.setText("Success Prob (p):")
            self.param1_input.setText("0.6")
            self.param1_label.setVisible(True)
            self.param1_input.setVisible(True)

            self.param2_label.setVisible(False)
            self.param2_input.setVisible(False)

            self.val_label.setText("Outcome k (0 or 1):")
            self.val_input.setText("1")

        elif idx == 7:  # Geometric
            self.param1_label.setText("Success Prob (p):")
            self.param1_input.setText("0.3")
            self.param1_label.setVisible(True)
            self.param1_input.setVisible(True)

            self.param2_label.setVisible(False)
            self.param2_input.setVisible(False)

            self.val_label.setText("Trials to 1st Success (k ≥ 1):")
            self.val_input.setText("3")

        elif idx == 8:  # Uniform
            self.param1_label.setText("Lower Bound (a):")
            self.param1_input.setText("0.0")
            self.param1_label.setVisible(True)
            self.param1_input.setVisible(True)

            self.param2_label.setText("Upper Bound (b):")
            self.param2_input.setText("10.0")
            self.param2_label.setVisible(True)
            self.param2_input.setVisible(True)

            self.val_label.setText("Value (x or probability p):")
            self.val_input.setText("5.0")

    def calculate(self):
        try:
            idx = self.dist_combo.currentIndex()
            lines = []
            dist_key = ""
            params_dict = {}

            if idx == 0:  # Normal
                mean = float(self.param1_input.text())
                std = float(self.param2_input.text())
                if std <= 0:
                    self.output.setText("Error: Standard deviation must be > 0.")
                    return
                val = float(self.val_input.text())
                dist_key = "normal"
                params_dict = {"mean": mean, "std": std}

                pdf_v = self.engine.normal_pdf(val, mean, std)
                cdf_v = self.engine.normal_cdf(val, mean, std)
                lines.append(f"=== NORMAL DISTRIBUTION N({mean}, {std}) ===")
                lines.append(f"X = {val}")
                lines.append(f"PDF f(x) = {pdf_v:.6f}")
                lines.append(f"CDF P(X <= x) = {cdf_v:.6f}")
                lines.append(f"P(X > x) = {1.0 - cdf_v:.6f}")

                if 0.0 < val < 1.0:
                    q_v = self.engine.normal_quantile(val, mean, std)
                    lines.append(f"Quantile for p = {val}: x = {q_v:.6f}")

            elif idx == 1:  # Student's t
                df = float(self.param1_input.text())
                if df <= 0:
                    self.output.setText("Error: Degrees of freedom must be > 0.")
                    return
                val = float(self.val_input.text())
                dist_key = "student_t"
                params_dict = {"df": df}

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
                dist_key = "chi_square"
                params_dict = {"df": df}

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
                dist_key = "binomial"
                params_dict = {"n": float(n), "p": p}

                pmf_v = self.engine.binomial_pmf(k, n, p)
                cdf_v = self.engine.binomial_cdf(k, n, p)

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
                dist_key = "poisson"
                params_dict = {"lambda": lam}

                pmf_v = self.engine.poisson_pmf(k, lam)
                cdf_v = self.engine.poisson_cdf(k, lam)

                lines.append(f"=== POISSON DISTRIBUTION Poisson(λ={lam}) ===")
                lines.append(f"k = {k}")
                lines.append(f"PMF P(X = k) = {pmf_v:.6f}")
                lines.append(f"CDF P(X <= k) = {cdf_v:.6f}")
                lines.append(f"P(X > k) = {1.0 - cdf_v:.6f}")

            elif idx == 5:  # Exponential
                rate = float(self.param1_input.text())
                val = float(self.val_input.text())
                if rate <= 0:
                    self.output.setText("Error: Rate λ must be > 0.")
                    return
                dist_key = "exponential"
                params_dict = {"rate": rate}

                pdf_v = self.engine.exponential_pdf(val, rate)
                cdf_v = self.engine.exponential_cdf(val, rate)
                lines.append(f"=== EXPONENTIAL DISTRIBUTION Exp(λ={rate}) ===")
                lines.append(f"X = {val}")
                lines.append(f"PDF f(x) = {pdf_v:.6f}")
                lines.append(f"CDF P(X <= x) = {cdf_v:.6f}")
                lines.append(f"P(X > x) = {1.0 - cdf_v:.6f}")

                if 0.0 < val < 1.0:
                    q_v = self.engine.exponential_quantile(val, rate)
                    lines.append(f"Quantile for p = {val}: x = {q_v:.6f}")

            elif idx == 6:  # Bernoulli
                p = float(self.param1_input.text())
                k = int(float(self.val_input.text()))
                if not (0.0 <= p <= 1.0):
                    self.output.setText("Error: Probability p must be in [0, 1].")
                    return
                dist_key = "bernoulli"
                params_dict = {"p": p}

                pmf_v = self.engine.bernoulli_pmf(k, p)
                cdf_v = self.engine.bernoulli_cdf(k, p)
                lines.append(f"=== BERNOULLI DISTRIBUTION Bern(p={p}) ===")
                lines.append(f"k = {k}")
                lines.append(f"PMF P(X = k) = {pmf_v:.6f}")
                lines.append(f"CDF P(X <= k) = {cdf_v:.6f}")

            elif idx == 7:  # Geometric
                p = float(self.param1_input.text())
                k = int(float(self.val_input.text()))
                if not (0.0 < p <= 1.0) or k < 1:
                    self.output.setText("Error: Probability p must be in (0, 1] and k >= 1.")
                    return
                dist_key = "geometric"
                params_dict = {"p": p}

                pmf_v = self.engine.geometric_pmf(k, p)
                cdf_v = self.engine.geometric_cdf(k, p)
                lines.append(f"=== GEOMETRIC DISTRIBUTION Geo(p={p}) ===")
                lines.append(f"k = {k}")
                lines.append(f"PMF P(X = k) = {pmf_v:.6f}")
                lines.append(f"CDF P(X <= k) = {cdf_v:.6f}")

            elif idx == 8:  # Uniform
                a = float(self.param1_input.text())
                b = float(self.param2_input.text())
                val = float(self.val_input.text())
                if a >= b:
                    self.output.setText("Error: Upper bound b must be > lower bound a.")
                    return
                dist_key = "uniform"
                params_dict = {"a": a, "b": b}

                pdf_v = self.engine.uniform_pdf(val, a, b)
                cdf_v = self.engine.uniform_cdf(val, a, b)
                lines.append(f"=== UNIFORM DISTRIBUTION U(a={a}, b={b}) ===")
                lines.append(f"X = {val}")
                lines.append(f"PDF f(x) = {pdf_v:.6f}")
                lines.append(f"CDF P(X <= x) = {cdf_v:.6f}")

                if 0.0 <= val <= 1.0:
                    q_v = self.engine.uniform_quantile(val, a, b)
                    lines.append(f"Quantile for p = {val}: x = {q_v:.6f}")

            # Append Moments
            if dist_key:
                moments = self.engine.get_moments(dist_key, params_dict)
                lines.append("\nDistribution Moments:")
                lines.append(f"  Mean (E[X]): {moments.get('mean', 0.0):.6f}")
                lines.append(f"  Variance (Var[X]): {moments.get('variance', 0.0):.6f}")
                lines.append(f"  Std Dev (σ): {moments.get('std_dev', 0.0):.6f}")
                lines.append(f"  Skewness: {moments.get('skewness', 0.0):.6f}")
                lines.append(f"  Kurtosis: {moments.get('kurtosis', 0.0):.6f}")

            # Interval P(a <= X <= b) if provided
            raw_interval = self.interval_input.text().strip()
            if raw_interval and "," in raw_interval and dist_key:
                parts = [float(x.strip()) for x in raw_interval.split(",") if x.strip()]
                if len(parts) == 2:
                    range_p = self.engine.range_probability(dist_key, params_dict, parts[0], parts[1])
                    lines.append(f"\nInterval Probability P({parts[0]} <= X <= {parts[1]}) = {range_p:.6f}")

            self.output.setText("\n".join(lines))
        except Exception as e:
            self.output.setText(f"Error: {str(e)}")
