"""
OmniCalc Pro Regression & Curve Fitting Engine (Python Desktop Parity - Pure Python)
Supports Linear, Polynomial, Exponential, Logarithmic, and Power regressions
with residuals, ANOVA metrics (R², adjusted R², RMSE, MAE), and inverse prediction.
"""

import math
from typing import List, Dict, Any, Tuple


class RegressionEngine:
    @staticmethod
    def _compute_metrics(x_pts: List[float], y_pts: List[float], y_preds: List[float], num_params: int) -> Dict[str, Any]:
        n = len(y_pts)
        mean_y = sum(y_pts) / n
        ss_tot = sum((y - mean_y) ** 2 for y in y_pts)
        ss_res = sum((y - yp) ** 2 for y, yp in zip(y_pts, y_preds))

        r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 1.0
        r2 = max(0.0, min(1.0, r2))

        adj_r2 = r2
        if n > num_params:
            adj_r2 = 1.0 - ((1.0 - r2) * (n - 1) / (n - num_params))
            adj_r2 = max(0.0, min(1.0, adj_r2))

        mae = sum(abs(y - yp) for y, yp in zip(y_pts, y_preds)) / n
        rmse = math.sqrt(ss_res / n)

        residuals = [
            {
                "x": float(x),
                "y_observed": float(y),
                "y_predicted": float(yp),
                "residual": float(y - yp)
            }
            for x, y, yp in zip(x_pts, y_pts, y_preds)
        ]

        return {
            "r2": float(r2),
            "adjusted_r2": float(adj_r2),
            "ss_res": float(ss_res),
            "ss_tot": float(ss_tot),
            "mae": float(mae),
            "rmse": float(rmse),
            "residuals": residuals,
        }

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

        y_preds = [slope * x + intercept for x in x_pts]
        metrics = RegressionEngine._compute_metrics(x_pts, y_pts, y_preds, num_params=2)

        sign_str = '+' if intercept >= 0 else '-'
        eq_str = f"y = {slope:.4f}x {sign_str} {abs(intercept):.4f}"

        return {
            "type": "linear",
            "slope": float(slope),
            "intercept": float(intercept),
            "coefficients": [float(intercept), float(slope)],
            "equation": eq_str,
            **metrics,
        }

    @staticmethod
    def polynomial_fit(x_pts: List[float], y_pts: List[float], degree: int = 2) -> Dict[str, Any]:
        n = len(x_pts)
        if degree < 1 or degree > 5:
            raise ValueError("Polynomial degree must be between 1 and 5.")
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

        coeffs_asc = [0.0] * m
        for i in range(m - 1, -1, -1):
            s = B[i] - sum(A[i][j] * coeffs_asc[j] for j in range(i + 1, m))
            coeffs_asc[i] = s / A[i][i]

        coeffs = coeffs_asc[::-1]  # descending order

        def poly_eval(x_val: float) -> float:
            res = 0.0
            for c in coeffs:
                res = res * x_val + c
            return res

        y_preds = [poly_eval(x) for x in x_pts]
        metrics = RegressionEngine._compute_metrics(x_pts, y_pts, y_preds, num_params=m)

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
            "equation": eq_str,
            "degree": degree,
            **metrics,
        }

    @staticmethod
    def exponential_fit(x_pts: List[float], y_pts: List[float]) -> Dict[str, Any]:
        if any(y <= 0 for y in y_pts):
            raise ValueError("Exponential regression y = a * e^(b*x) requires all y > 0.")
        ln_y = [math.log(y) for y in y_pts]
        lin_res = RegressionEngine.linear_fit(x_pts, ln_y)
        b = lin_res["slope"]
        a = math.exp(lin_res["intercept"])

        y_preds = [a * math.exp(b * x) for x in x_pts]
        metrics = RegressionEngine._compute_metrics(x_pts, y_pts, y_preds, num_params=2)

        return {
            "type": "exponential",
            "a": float(a),
            "b": float(b),
            "coefficients": [float(a), float(b)],
            "equation": f"y = {a:.4f} * e^({b:.4f}x)",
            **metrics,
        }

    @staticmethod
    def logarithmic_fit(x_pts: List[float], y_pts: List[float]) -> Dict[str, Any]:
        if any(x <= 0 for x in x_pts):
            raise ValueError("Logarithmic regression y = a + b * ln(x) requires all x > 0.")
        ln_x = [math.log(x) for x in x_pts]
        lin_res = RegressionEngine.linear_fit(ln_x, y_pts)
        b = lin_res["slope"]
        a = lin_res["intercept"]

        y_preds = [a + b * math.log(x) for x in x_pts]
        metrics = RegressionEngine._compute_metrics(x_pts, y_pts, y_preds, num_params=2)

        sign_str = '+' if b >= 0 else '-'
        return {
            "type": "logarithmic",
            "a": float(a),
            "b": float(b),
            "coefficients": [float(a), float(b)],
            "equation": f"y = {a:.4f} {sign_str} {abs(b):.4f} * ln(x)",
            **metrics,
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

        y_preds = [a * (x ** b) for x in x_pts]
        metrics = RegressionEngine._compute_metrics(x_pts, y_pts, y_preds, num_params=2)

        return {
            "type": "power",
            "a": float(a),
            "b": float(b),
            "coefficients": [float(a), float(b)],
            "equation": f"y = {a:.4f} * x^({b:.4f})",
            **metrics,
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
    def inverse_predict(fit_res: Dict[str, Any], y_val: float) -> List[float]:
        model_type = fit_res.get("type", "")
        if model_type == "linear":
            slope = fit_res["slope"]
            intercept = fit_res["intercept"]
            if abs(slope) < 1e-12:
                return []
            return [(y_val - intercept) / slope]
        elif model_type == "exponential":
            a = fit_res["a"]
            b = fit_res["b"]
            if a <= 0 or abs(b) < 1e-12 or (y_val / a) <= 0:
                return []
            return [math.log(y_val / a) / b]
        elif model_type == "logarithmic":
            a = fit_res["a"]
            b = fit_res["b"]
            if abs(b) < 1e-12:
                return []
            return [math.exp((y_val - a) / b)]
        elif model_type == "power":
            a = fit_res["a"]
            b = fit_res["b"]
            if a <= 0 or abs(b) < 1e-12 or (y_val / a) <= 0:
                return []
            return [(y_val / a) ** (1.0 / b)]
        elif model_type.startswith("polynomial"):
            coeffs = fit_res["coefficients"]
            deg = len(coeffs) - 1
            if deg == 1:
                a_c, b_c = coeffs[0], coeffs[1]
                if abs(a_c) < 1e-12:
                    return []
                return [(y_val - b_c) / a_c]
            elif deg == 2:
                a_c, b_c, c_c = coeffs[0], coeffs[1], coeffs[2] - y_val
                if abs(a_c) < 1e-12:
                    return [(y_val - coeffs[2]) / b_c] if abs(b_c) >= 1e-12 else []
                disc = b_c * b_c - 4 * a_c * c_c
                if disc < 0:
                    return []
                elif abs(disc) < 1e-12:
                    return [-b_c / (2 * a_c)]
                else:
                    s_disc = math.sqrt(disc)
                    return [(-b_c + s_disc) / (2 * a_c), (-b_c - s_disc) / (2 * a_c)]
            else:
                # Bisection root finding
                roots = []
                def obj(x):
                    res = 0.0
                    for c in coeffs:
                        res = res * x + c
                    return res - y_val

                grid = [i * 0.5 for i in range(-200, 201)]
                for k in range(len(grid) - 1):
                    x1, x2 = grid[k], grid[k + 1]
                    f1, f2 = obj(x1), obj(x2)
                    if f1 * f2 <= 0:
                        a_root, b_root = x1, x2
                        for _ in range(40):
                            mid = 0.5 * (a_root + b_root)
                            fmid = obj(mid)
                            if abs(fmid) < 1e-7:
                                break
                            if f1 * fmid <= 0:
                                b_root = mid
                            else:
                                a_root = mid
                                f1 = fmid
                        root = 0.5 * (a_root + b_root)
                        if not any(abs(root - r) < 1e-4 for r in roots):
                            roots.append(root)
                return roots
        return []

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


