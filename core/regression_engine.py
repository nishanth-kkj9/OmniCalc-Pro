"""
OmniCalc Pro Regression & Curve Fitting Engine (Python Desktop Parity)
"""

from typing import List, Dict, Any, Tuple
import numpy as np


class RegressionEngine:
    @staticmethod
    def linear_fit(x_pts: List[float], y_pts: List[float]) -> Dict[str, Any]:
        x = np.array(x_pts, dtype=float)
        y = np.array(y_pts, dtype=float)
        n = len(x)
        if n < 2:
            raise ValueError("Linear regression requires at least 2 points.")

        p, residuals, rank, singular_values, rcond = np.polyfit(x, y, 1, full=True)
        slope, intercept = p[0], p[1]

        y_pred = slope * x + intercept
        ss_res = np.sum((y - y_pred) ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 1.0

        return {
            "type": "linear",
            "slope": float(slope),
            "intercept": float(intercept),
            "r2": float(r2),
            "equation": f"y = {slope:.4f}x {'+' if intercept >= 0 else '-'} {abs(intercept):.4f}",
            "ss_res": float(ss_res),
            "ss_tot": float(ss_tot),
        }

    @staticmethod
    def polynomial_fit(x_pts: List[float], y_pts: List[float], degree: int = 2) -> Dict[str, Any]:
        x = np.array(x_pts, dtype=float)
        y = np.array(y_pts, dtype=float)
        n = len(x)
        if n <= degree:
            raise ValueError(f"Polynomial regression of degree {degree} requires at least {degree + 1} points.")

        coeffs = np.polyfit(x, y, degree)
        y_pred = np.polyval(coeffs, x)
        ss_res = np.sum((y - y_pred) ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 1.0

        return {
            "type": f"polynomial_deg_{degree}",
            "coefficients": [float(c) for c in coeffs],
            "r2": float(r2),
            "ss_res": float(ss_res),
            "ss_tot": float(ss_tot),
        }
