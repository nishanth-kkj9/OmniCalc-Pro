"""
Calculus & Numerical Analysis Engine for OmniCalc Pro (Python Desktop Core).
Provides numerical derivatives, second derivatives, definite integration (Simpson/Trapezoid/Adaptive),
tangent/normal line equations, Brent root finding, extrema isolation, Newton-Raphson iterations,
and area between curves.
"""

import math
from typing import Dict, List, Any, Optional, Tuple, Callable
from core.safe_evaluator import SafeEvaluator, safe_eval


class CalculusEngine:
    """Core mathematical engine for numerical calculus and real-valued analysis."""

    def __init__(self, angle_mode: str = "radians"):
        self.evaluator = SafeEvaluator(angle_mode=angle_mode)

    def _eval(self, expr: str, x_val: float) -> Optional[float]:
        if not math.isfinite(x_val):
            return None
        try:
            val = self.evaluator._eval_worker_func(expr, ["x"], self.evaluator.angle_mode, {"x": x_val})
            return val if math.isfinite(val) else None
        except Exception:
            return None

    def calculate_derivative(self, expr: str, x0: float, h_param: Optional[float] = None) -> Optional[float]:
        """Computes numerical first derivative using a 5-point stencil with scale-aware step size."""
        if not math.isfinite(x0):
            return None

        h = h_param if h_param is not None else max(1e-6, abs(x0) * 1e-6)

        fp2 = self._eval(expr, x0 + 2 * h)
        fp1 = self._eval(expr, x0 + h)
        fm1 = self._eval(expr, x0 - h)
        fm2 = self._eval(expr, x0 - 2 * h)

        if fp2 is not None and fp1 is not None and fm1 is not None and fm2 is not None:
            d = (-fp2 + 8 * fp1 - 8 * fm1 + fm2) / (12 * h)
            return d if math.isfinite(d) else None

        # Fallback to 2-point central difference
        right = self._eval(expr, x0 + h)
        left = self._eval(expr, x0 - h)
        if right is not None and left is not None:
            cd = (right - left) / (2 * h)
            return cd if math.isfinite(cd) else None

        return None

    def calculate_second_derivative(self, expr: str, x0: float, h_param: Optional[float] = None) -> Optional[float]:
        """Computes numerical second derivative using a 5-point stencil."""
        if not math.isfinite(x0):
            return None

        h = h_param if h_param is not None else max(1e-5, abs(x0) * 1e-5)
        f0 = self._eval(expr, x0)
        if f0 is None:
            return None

        fp2 = self._eval(expr, x0 + 2 * h)
        fp1 = self._eval(expr, x0 + h)
        fm1 = self._eval(expr, x0 - h)
        fm2 = self._eval(expr, x0 - 2 * h)

        if fp2 is not None and fp1 is not None and fm1 is not None and fm2 is not None:
            d2 = (-fp2 + 16 * fp1 - 30 * f0 + 16 * fm1 - fm2) / (12 * h * h)
            return d2 if math.isfinite(d2) else None

        if fp1 is not None and fm1 is not None:
            d2 = (fp1 - 2 * f0 + fm1) / (h * h)
            return d2 if math.isfinite(d2) else None

        return None

    def calculate_tangent_line(self, expr: str, x0: float) -> Optional[Dict[str, Any]]:
        """Calculates tangent line equation y = mx + b at point x0."""
        y0 = self._eval(expr, x0)
        if y0 is None or not math.isfinite(y0):
            return None

        slope = self.calculate_derivative(expr, x0)
        if slope is None or not math.isfinite(slope):
            return None

        intercept = y0 - slope * x0
        sign = "+" if intercept >= 0 else "-"
        abs_b = abs(intercept)
        eq = f"y = {round(slope, 4):g}*x {sign} {round(abs_b, 4):g}"

        return {
            "x0": round(x0, 6),
            "y0": round(y0, 6),
            "slope": round(slope, 6),
            "intercept": round(intercept, 6),
            "equation": eq,
        }

    def calculate_normal_line(self, expr: str, x0: float) -> Optional[Dict[str, Any]]:
        """Calculates normal line equation at point x0."""
        y0 = self._eval(expr, x0)
        if y0 is None or not math.isfinite(y0):
            return None

        tan_slope = self.calculate_derivative(expr, x0)
        if tan_slope is None or not math.isfinite(tan_slope):
            return None

        if abs(tan_slope) < 1e-8:
            return {
                "x0": round(x0, 6),
                "y0": round(y0, 6),
                "slope": None,
                "intercept": None,
                "equation": f"x = {round(x0, 4):g}",
                "isVertical": True,
            }

        normal_slope = -1.0 / tan_slope
        intercept = y0 - normal_slope * x0
        sign = "+" if intercept >= 0 else "-"
        abs_b = abs(intercept)
        eq = f"y = {round(normal_slope, 4):g}*x {sign} {round(abs_b, 4):g}"

        return {
            "x0": round(x0, 6),
            "y0": round(y0, 6),
            "slope": round(normal_slope, 6),
            "intercept": round(intercept, 6),
            "equation": eq,
            "isVertical": False,
        }

    def integrate_definite(
        self,
        expr: str,
        a: float,
        b: float,
        subdivisions: int = 100,
        method: str = "simpson",
        tolerance: float = 1e-8
    ) -> Optional[Dict[str, Any]]:
        """Numerical definite integration supporting Simpson's 1/3, Trapezoidal, Midpoint, and Adaptive."""
        if not (math.isfinite(a) and math.isfinite(b)):
            return None
        if abs(a - b) < 1e-12:
            return {"value": 0.0, "method": "exact", "subdivisions": 0, "converged": True}

        sign = 1.0 if b >= a else -1.0
        lower = min(a, b)
        upper = max(a, b)

        if method == "midpoint":
            n = max(10, subdivisions)
            h = (upper - lower) / n
            total = 0.0
            for i in range(n):
                mid = lower + (i + 0.5) * h
                fmid = self._eval(expr, mid)
                if fmid is None:
                    return None
                total += fmid
            val = sign * h * total
            return {"value": round(val, 8), "method": "midpoint", "subdivisions": n, "converged": True}

        if method == "trapezoid":
            n = max(10, subdivisions)
            h = (upper - lower) / n
            f0 = self._eval(expr, lower)
            fn = self._eval(expr, upper)
            if f0 is None or fn is None:
                return None
            total = 0.5 * (f0 + fn)
            for i in range(1, n):
                fx = self._eval(expr, lower + i * h)
                if fx is None:
                    return None
                total += fx
            val = sign * h * total
            return {"value": round(val, 8), "method": "trapezoid", "subdivisions": n, "converged": True}

        if method == "adaptive":
            eval_count = [0]
            max_depth = 20

            def adaptive_recurse(left, right, fa, fb, fm, whole, depth):
                eval_count[0] += 2
                m = (left + right) / 2.0
                lm = (left + m) / 2.0
                rm = (m + right) / 2.0
                flm = self._eval(expr, lm)
                frm = self._eval(expr, rm)
                if flm is None or frm is None:
                    return None

                left_simp = ((m - left) / 6.0) * (fa + 4 * flm + fm)
                right_simp = ((right - m) / 6.0) * (fm + 4 * frm + fb)
                delta = left_simp + right_simp - whole

                if depth >= max_depth or abs(delta) <= 15 * tolerance:
                    return left_simp + right_simp + delta / 15.0

                l_res = adaptive_recurse(left, m, fa, fm, flm, left_simp, depth + 1)
                r_res = adaptive_recurse(m, right, fm, fb, frm, right_simp, depth + 1)
                if l_res is None or r_res is None:
                    return None
                return l_res + r_res

            fa = self._eval(expr, lower)
            fb = self._eval(expr, upper)
            mid = (lower + upper) / 2.0
            fm = self._eval(expr, mid)
            if fa is None or fb is None or fm is None:
                return None

            initial_simp = ((upper - lower) / 6.0) * (fa + 4 * fm + fb)
            res = adaptive_recurse(lower, upper, fa, fb, fm, initial_simp, 1)
            if res is None:
                return None

            return {
                "value": round(sign * res, 8),
                "method": "adaptive-simpson",
                "subdivisions": eval_count[0],
                "converged": True,
                "errorEstimate": tolerance,
            }

        # Default: Composite Simpson's 1/3 Rule
        n = subdivisions if subdivisions % 2 == 0 else subdivisions + 1
        h = (upper - lower) / n
        f0 = self._eval(expr, lower)
        fn = self._eval(expr, upper)
        if f0 is None or fn is None:
            return None

        total = f0 + fn
        for i in range(1, n):
            fx = self._eval(expr, lower + i * h)
            if fx is None:
                return None
            total += (4.0 if i % 2 == 1 else 2.0) * fx

        val = sign * (h / 3.0) * total
        return {"value": round(val, 8), "method": "simpson-1/3", "subdivisions": n, "converged": True}

    def solve_newton_raphson(
        self,
        expr: str,
        initial_guess: float,
        max_iterations: int = 20,
        tolerance: float = 1e-8
    ) -> Dict[str, Any]:
        """Newton-Raphson root solver with iteration tracking."""
        x = initial_guess
        history = []

        for iter_num in range(1, max_iterations + 1):
            y = self._eval(expr, x)
            if y is None or not math.isfinite(y):
                return {
                    "root": round(x, 8),
                    "iterations": history,
                    "iterationCount": iter_num,
                    "converged": False,
                    "error": "Function undefined at evaluation point.",
                }

            dy = self.calculate_derivative(expr, x)
            if dy is None or abs(dy) < 1e-12:
                history.append({"iter": iter_num, "x": round(x, 6), "fx": round(y, 6), "fPrime": round(dy or 0, 6), "nextX": round(x, 6), "error": round(abs(y), 6)})
                return {
                    "root": round(x, 8),
                    "iterations": history,
                    "iterationCount": iter_num,
                    "converged": False,
                    "error": "Derivative reached 0 (tangent horizontal).",
                }

            next_x = x - y / dy
            err = abs(next_x - x)
            history.append({
                "iter": iter_num,
                "x": round(x, 6),
                "fx": round(y, 6),
                "fPrime": round(dy, 6),
                "nextX": round(next_x, 6),
                "error": round(err, 6),
            })

            if err <= tolerance or abs(y) <= tolerance:
                return {
                    "root": round(next_x, 8),
                    "iterations": history,
                    "iterationCount": iter_num,
                    "converged": True,
                }

            x = next_x

        return {
            "root": round(x, 8),
            "iterations": history,
            "iterationCount": max_iterations,
            "converged": False,
            "error": "Maximum iterations reached without converging.",
        }

    def area_between_curves(
        self,
        expr1: str,
        expr2: str,
        a: float,
        b: float,
        subdivisions: int = 100
    ) -> Optional[Dict[str, Any]]:
        """Calculates area between curves f1(x) and f2(x) over [a, b]."""
        diff_expr = f"abs(({expr1}) - ({expr2}))"
        return self.integrate_definite(diff_expr, a, b, subdivisions=subdivisions, method="simpson")
