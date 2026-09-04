"""
OmniCalc Pro Regression & Curve Fitting Engine (Python Desktop Parity - Pure Python)
Supports Linear, Polynomial, Exponential, Logarithmic, and Power regressions.
"""

import math
from typing import List, Dict, Any, Tuple


class RegressionEngine:
    @staticmethod
    def linear_fit(x_pts: List[float], y_pts: List[float]) -> Dict[str, Any]:
        n = len(x_pts)
        if n < 2 or len(y_pts) != n:
            raise ValueError("Linear regression requires at least 2 points with equal x and y lengths.")

        sum_x = sum(x_pts)
        sum_y = sum(y_pts)
        sum_xy = sum(x * y for x, y in zip(x_pts, y_pts))
        sum_x2 = sum(x * x for x in x_pts)

        denom = n * sum_x2 - sum_x * sum_x
        if abs(denom) < 1e-12:
            raise ValueError("Vertical line or degenerate dataset: x values are constant.")

        slope = (n * sum_xy - sum_x * sum_y) / denom
        intercept = (sum_y - slope * sum_x) / n

        mean_y = sum_y / n
        ss_tot = sum((y - mean_y) ** 2 for y in y_pts)
        ss_res = sum((y - (slope * x + intercept)) ** 2 for x, y in zip(x_pts, y_pts))

        r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 1.0

        sign_str = '+' if intercept >= 0 else '-'
        eq_str = f"y = {slope:.4f}x {sign_str} {abs(intercept):.4f}"

        return {
            "type": "linear",
            "slope": float(slope),
            "intercept": float(intercept),
            "r2": float(r2),
            "equation": eq_str,
            "ss_res": float(ss_res),
            "ss_tot": float(ss_tot),
        }

    @staticmethod
    def polynomial_fit(x_pts: List[float], y_pts: List[float], degree: int = 2) -> Dict[str, Any]:
        n = len(x_pts)
        if n <= degree or len(y_pts) != n:
            raise ValueError(f"Polynomial regression of degree {degree} requires at least {degree + 1} points.")

        # Solve Normal Equations (X^T X) C = X^T Y via Gaussian Elimination
        m = degree + 1
        A = [[0.0] * m for _ in range(m)]
        B = [0.0] * m

        for i in range(m):
            for j in range(m):
                A[i][j] = sum((x ** (i + j)) for x in x_pts)
            B[i] = sum((y * (x ** i)) for x, y in zip(x_pts, y_pts))

        # Gaussian Elimination with Partial Pivoting
        for i in range(m):
            max_row = i
            for k in range(i + 1, m):
                if abs(A[k][i]) > abs(A[max_row][i]):
                    max_row = k
            A[i], A[max_row] = A[max_row], A[i]
            B[i], B[max_row] = B[max_row], B[i]

            pivot = A[i][i]
            if abs(pivot) < 1e-12:
                raise ValueError("Degenerate matrix in polynomial fitting.")

            for k in range(i + 1, m):
                factor = A[k][i] / pivot
                for j in range(i, m):
                    A[k][j] -= factor * A[i][j]
                B[k] -= factor * B[i]

        # Back Substitution
        coeffs_asc = [0.0] * m
        for i in range(m - 1, -1, -1):
            s = B[i] - sum(A[i][j] * coeffs_asc[j] for j in range(i + 1, m))
            coeffs_asc[i] = s / A[i][i]

        # Reverse to descending order (highest degree first)
        coeffs = coeffs_asc[::-1]

        def poly_eval(x_val: float) -> float:
            res = 0.0
            for c in coeffs:
                res = res * x_val + c
            return res

        mean_y = sum(y_pts) / n
        ss_tot = sum((y - mean_y) ** 2 for y in y_pts)
        ss_res = sum((y - poly_eval(x)) ** 2 for x, y in zip(x_pts, y_pts))
        r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 1.0

        # Build readable equation string
        terms = []
        deg = degree
        for c in coeffs:
            if deg == 0:
                terms.append(f"{c:.4f}")
            elif deg == 1:
                terms.append(f"{c:.4f}x")
            else:
                terms.append(f"{c:.4f}x^{deg}")
            deg -= 1
        eq_str = "y = " + " + ".join(terms).replace("+ -", "- ")

        return {
            "type": f"polynomial_deg_{degree}",
            "coefficients": [float(c) for c in coeffs],
            "r2": float(r2),
            "equation": eq_str,
            "ss_res": float(ss_res),
            "ss_tot": float(ss_tot),
        }

    @staticmethod
    def exponential_fit(x_pts: List[float], y_pts: List[float]) -> Dict[str, Any]:
        if any(y <= 0 for y in y_pts):
            raise ValueError("Exponential regression y = a * e^(b*x) requires all y > 0.")
        ln_y = [math.log(y) for y in y_pts]
        lin_res = RegressionEngine.linear_fit(x_pts, ln_y)
        b = lin_res["slope"]
        a = math.exp(lin_res["intercept"])

        mean_y = sum(y_pts) / len(y_pts)
        ss_tot = sum((y - mean_y) ** 2 for y in y_pts)
        ss_res = sum((y - a * math.exp(b * x)) ** 2 for x, y in zip(x_pts, y_pts))
        r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 1.0

        return {
            "type": "exponential",
            "a": float(a),
            "b": float(b),
            "r2": float(r2),
            "equation": f"y = {a:.4f} * e^({b:.4f}x)",
            "ss_res": float(ss_res),
            "ss_tot": float(ss_tot),
        }

    @staticmethod
    def logarithmic_fit(x_pts: List[float], y_pts: List[float]) -> Dict[str, Any]:
        if any(x <= 0 for x in x_pts):
            raise ValueError("Logarithmic regression y = a + b * ln(x) requires all x > 0.")
        ln_x = [math.log(x) for x in x_pts]
        lin_res = RegressionEngine.linear_fit(ln_x, y_pts)
        b = lin_res["slope"]
        a = lin_res["intercept"]

        mean_y = sum(y_pts) / len(y_pts)
        ss_tot = sum((y - mean_y) ** 2 for y in y_pts)
        ss_res = sum((y - (a + b * math.log(x))) ** 2 for x, y in zip(x_pts, y_pts))
        r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 1.0

        sign_str = '+' if b >= 0 else '-'
        return {
            "type": "logarithmic",
            "a": float(a),
            "b": float(b),
            "r2": float(r2),
            "equation": f"y = {a:.4f} {sign_str} {abs(b):.4f} * ln(x)",
            "ss_res": float(ss_res),
            "ss_tot": float(ss_tot),
        }

    @staticmethod
    def power_fit(x_pts: List[float], y_pts: List[float]) -> Dict[str, Any]:
        if any(x <= 0 for x in x_pts) or any(y <= 0 for y in y_pts):
            raise ValueError("Power regression y = a * x^b requires all x > 0 and y > 0.")
        ln_x = [math.log(x) for x in x_pts]
        ln_y = [math.log(y) for y in y_pts]
        lin_res = RegressionEngine.linear_fit(ln_x, ln_y)
        b = lin_res["slope"]
        a = math.exp(lin_res["intercept"])

        mean_y = sum(y_pts) / len(y_pts)
        ss_tot = sum((y - mean_y) ** 2 for y in y_pts)
        ss_res = sum((y - a * (x ** b)) ** 2 for x, y in zip(x_pts, y_pts))
        r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 1.0

        return {
            "type": "power",
            "a": float(a),
            "b": float(b),
            "r2": float(r2),
            "equation": f"y = {a:.4f} * x^({b:.4f})",
            "ss_res": float(ss_res),
            "ss_tot": float(ss_tot),
        }

    @staticmethod
    def predict(fit_res: Dict[str, Any], x_val: float) -> float:
        model_type = fit_res.get("type", "")
        if model_type == "linear":
            return fit_res["slope"] * x_val + fit_res["intercept"]
        elif model_type.startswith("polynomial"):
            coeffs = fit_res["coefficients"]
            res = 0.0
            for c in coeffs:
                res = res * x_val + c
            return res
        elif model_type == "exponential":
            return fit_res["a"] * math.exp(fit_res["b"] * x_val)
        elif model_type == "logarithmic":
            if x_val <= 0:
                raise ValueError("x must be > 0 for logarithmic prediction.")
            return fit_res["a"] + fit_res["b"] * math.log(x_val)
        elif model_type == "power":
            if x_val <= 0:
                raise ValueError("x must be > 0 for power prediction.")
            return fit_res["a"] * (x_val ** fit_res["b"])
        else:
            raise ValueError(f"Unknown regression model type: {model_type}")

    @staticmethod
    def fit(x_pts: List[float], y_pts: List[float], model_type: str = "linear", degree: int = 2) -> Dict[str, Any]:
        model = model_type.lower()
        if model == "linear":
            return RegressionEngine.linear_fit(x_pts, y_pts)
        elif model == "polynomial":
            return RegressionEngine.polynomial_fit(x_pts, y_pts, degree=degree)
        elif model == "exponential":
            return RegressionEngine.exponential_fit(x_pts, y_pts)
        elif model == "logarithmic":
            return RegressionEngine.logarithmic_fit(x_pts, y_pts)
        elif model == "power":
            return RegressionEngine.power_fit(x_pts, y_pts)
        else:
            raise ValueError(f"Unsupported regression model type: {model_type}")

