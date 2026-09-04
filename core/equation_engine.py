"""
Equation Solver Engine for OmniCalc Pro (Python Desktop Core).
Supports Linear, Quadratic, Cubic, 2x2/3x3 Systems, Polynomial Roots,
Quadratic Inequalities, and General Nonlinear Equations.
"""

import math
from typing import Dict, List, Any, Optional, Tuple, Union
import sympy as sp
from core.safe_evaluator import SafeEvaluator, safe_eval


class ComplexNum:
    def __init__(self, re: float, im: float = 0.0):
        self.re = float(re)
        self.im = float(im)

    def to_dict(self) -> Dict[str, float]:
        return {"re": self.re, "im": self.im}

    def format(self, precision: int = 4) -> str:
        if abs(self.im) < 1e-10:
            return f"{round(self.re, precision):g}"
        if abs(self.re) < 1e-10:
            return f"{round(self.im, precision):g}i"
        sign = "+" if self.im >= 0 else "-"
        return f"{round(self.re, precision):g} {sign} {round(abs(self.im), precision):g}i"


class EquationEngine:
    """Core mathematical engine for algebraic equation and linear system solving."""

    @staticmethod
    def solve_quadratic(a: float, b: float, c: float) -> Dict[str, Any]:
        """Solves ax^2 + bx + c = 0 with complete derivation steps and discriminant analysis."""
        if abs(a) < 1e-12:
            if abs(b) < 1e-12:
                return {
                    "a": a, "b": b, "c": c,
                    "discriminant": 0.0,
                    "nature": "degenerate",
                    "roots": [],
                    "vertex": {"x": 0.0, "y": c},
                    "steps": ["Degenerate equation: 0 = 0 or c = 0 with no variable dependence."],
                }
            root = -c / b
            return {
                "a": a, "b": b, "c": c,
                "discriminant": 0.0,
                "nature": "linear",
                "roots": [ComplexNum(root, 0.0).to_dict()],
                "vertex": {"x": root, "y": 0.0},
                "steps": [
                    "Coefficient a is zero; reduces to linear equation bx + c = 0.",
                    f"x = -c / b = -({c}) / ({b}) = {root}",
                ],
            }

        d = b * b - 4 * a * c
        vx = -b / (2 * a)
        vy = c - (b * b) / (4 * a)

        if abs(d) < 1e-12:
            root = -b / (2 * a)
            return {
                "a": a, "b": b, "c": c,
                "discriminant": 0.0,
                "nature": "one-real",
                "roots": [ComplexNum(root, 0.0).to_dict()],
                "vertex": {"x": vx, "y": vy},
                "steps": [
                    f"Calculate discriminant Δ = b² - 4ac = ({b})² - 4({a})({c}) = 0",
                    "Δ = 0 indicates exactly one repeated real root.",
                    f"x = -b / (2a) = -({b}) / (2 · {a}) = {root}",
                ],
            }

        if d > 0:
            sqrt_d = math.sqrt(d)
            r1 = (-b + sqrt_d) / (2 * a)
            r2 = (-b - sqrt_d) / (2 * a)
            min_r, max_r = min(r1, r2), max(r1, r2)
            return {
                "a": a, "b": b, "c": c,
                "discriminant": d,
                "nature": "two-real",
                "roots": [ComplexNum(min_r, 0.0).to_dict(), ComplexNum(max_r, 0.0).to_dict()],
                "vertex": {"x": vx, "y": vy},
                "steps": [
                    f"Calculate discriminant Δ = b² - 4ac = ({b})² - 4({a})({c}) = {d}",
                    "Δ > 0 indicates two distinct real roots.",
                    f"√Δ = √{d} ≈ {round(sqrt_d, 6)}",
                    f"x₁ = (-b - √Δ) / 2a = ({round(min_r, 6)})",
                    f"x₂ = (-b + √Δ) / 2a = ({round(max_r, 6)})",
                ],
            }

        # Complex conjugate pair
        sqrt_abs_d = math.sqrt(-d)
        re = -b / (2 * a)
        im = sqrt_abs_d / (2 * abs(a))
        return {
            "a": a, "b": b, "c": c,
            "discriminant": d,
            "nature": "two-complex",
            "roots": [ComplexNum(re, im).to_dict(), ComplexNum(re, -im).to_dict()],
            "vertex": {"x": vx, "y": vy},
            "steps": [
                f"Calculate discriminant Δ = b² - 4ac = ({b})² - 4({a})({c}) = {d}",
                "Δ < 0 indicates a complex conjugate pair of roots.",
                f"Real part = -b / (2a) = {round(re, 6)}",
                f"Imaginary part = ±√(–Δ) / (2a) = ±{round(im, 6)}i",
                f"Roots: x = {round(re, 4)} ± {round(im, 4)}i",
            ],
        }

    @staticmethod
    def solve_cubic(a: float, b: float, c: float, d: float) -> Dict[str, Any]:
        """Solves ax^3 + bx^2 + cx + d = 0 using Cardano's formula / Vieta's trigonometric method."""
        if abs(a) < 1e-12:
            q = EquationEngine.solve_quadratic(b, c, d)
            return {
                "a": a, "b": b, "c": c, "d": d,
                "roots": q["roots"],
                "steps": ["Leading coefficient a = 0. Reduced to quadratic equation."] + q["steps"],
            }

        A = b / a
        B = c / a
        C = d / a

        p = B - (A * A) / 3.0
        q = (2.0 * A * A * A) / 27.0 - (A * B) / 3.0 + C
        delta = (q * q) / 4.0 + (p * p * p) / 27.0

        roots: List[Dict[str, float]] = []
        steps = [
            f"Depressed cubic substitution: x = t - b/(3a) with shift = -{round(A/3, 4)}",
            f"Depressed form: t³ + pt + q = 0, where p = {round(p, 5)}, q = {round(q, 5)}",
            f"Cardano discriminant Δ = (q/2)² + (p/3)³ = {round(delta, 6)}",
        ]

        if abs(delta) < 1e-10:
            if abs(q) < 1e-10:
                r = -A / 3.0
                roots = [ComplexNum(r, 0.0).to_dict()] * 3
                steps.append("Triple real root at t = 0.")
            else:
                u = math.cbrt(-q / 2.0)
                t1 = 2.0 * u
                t2 = -u
                roots = [
                    ComplexNum(t1 - A / 3.0, 0.0).to_dict(),
                    ComplexNum(t2 - A / 3.0, 0.0).to_dict(),
                    ComplexNum(t2 - A / 3.0, 0.0).to_dict(),
                ]
                steps.append("Multiple real roots.")
        elif delta > 0:
            sqrt_delta = math.sqrt(delta)
            u = math.cbrt(-q / 2.0 + sqrt_delta)
            v = math.cbrt(-q / 2.0 - sqrt_delta)
            t_real = u + v
            x_real = t_real - A / 3.0
            roots.append(ComplexNum(x_real, 0.0).to_dict())

            im_part = (math.sqrt(3) / 2.0) * (u - v)
            re_part = -(u + v) / 2.0 - A / 3.0
            roots.append(ComplexNum(re_part, abs(im_part)).to_dict())
            roots.append(ComplexNum(re_part, -abs(im_part)).to_dict())
            steps.append("One real root and two complex conjugate roots.")
        else:
            # Three distinct real roots via trigonometry
            m = 2.0 * math.sqrt(-p / 3.0)
            theta = math.acos(-q / (2.0 * math.sqrt((-p / 3.0) ** 3))) / 3.0
            t1 = m * math.cos(theta)
            t2 = m * math.cos(theta + (2.0 * math.pi) / 3.0)
            t3 = m * math.cos(theta + (4.0 * math.pi) / 3.0)

            r_list = sorted([t1 - A / 3.0, t2 - A / 3.0, t3 - A / 3.0])
            for r in r_list:
                roots.append(ComplexNum(r, 0.0).to_dict())
            steps.append("Three distinct real roots resolved via trigonometric identity.")

        return {"a": a, "b": b, "c": c, "d": d, "roots": roots, "steps": steps}

    @staticmethod
    def solve_linear_system_2x2(
        a1: float, b1: float, c1: float,
        a2: float, b2: float, c2: float
    ) -> Dict[str, Any]:
        """Solves 2x2 linear system a1*x + b1*y = c1, a2*x + b2*y = c2 via Cramer's Rule."""
        det = a1 * b2 - a2 * b1
        det_x = c1 * b2 - c2 * b1
        det_y = a1 * c2 - a2 * c1

        if abs(det) < 1e-12:
            if abs(det_x) < 1e-12 and abs(det_y) < 1e-12:
                return {
                    "det": 0.0,
                    "is_solvable": False,
                    "message": "Infinite solutions (dependent equations represent the same line).",
                    "steps": ["Determinant D = 0 and Dx = Dy = 0: Infinitely many collinear solutions."],
                }
            return {
                "det": 0.0,
                "is_solvable": False,
                "message": "No solution (parallel inconsistent lines).",
                "steps": ["Determinant D = 0 but Dx or Dy ≠ 0: Parallel lines with no intersection."],
            }

        x = det_x / det
        y = det_y / det
        return {
            "det": det,
            "is_solvable": True,
            "x": x,
            "y": y,
            "steps": [
                f"Main determinant D = ({a1})({b2}) - ({a2})({b1}) = {det}",
                f"x-determinant Dx = ({c1})({b2}) - ({c2})({b1}) = {det_x}",
                f"y-determinant Dy = ({a1})({c2}) - ({a2})({c1}) = {det_y}",
                f"x = Dx / D = {det_x} / {det} = {x}",
                f"y = Dy / D = {det_y} / {det} = {y}",
            ],
        }

    @staticmethod
    def solve_linear_system_3x3(
        a1: float, b1: float, c1: float, d1: float,
        a2: float, b2: float, c2: float, d2: float,
        a3: float, b3: float, c3: float, d3: float
    ) -> Dict[str, Any]:
        """Solves 3x3 linear system via Cramer's Rule."""
        def det3(m11, m12, m13, m21, m22, m23, m31, m32, m33):
            return (
                m11 * (m22 * m33 - m23 * m32)
                - m12 * (m21 * m33 - m23 * m31)
                + m13 * (m21 * m32 - m22 * m31)
            )

        D = det3(a1, b1, c1, a2, b2, c2, a3, b3, c3)
        Dx = det3(d1, b1, c1, d2, b2, c2, d3, b3, c3)
        Dy = det3(a1, d1, c1, a2, d2, c2, a3, d3, c3)
        Dz = det3(a1, b1, d1, a2, b2, d2, a3, b3, d3)

        if abs(D) < 1e-12:
            return {
                "det": 0.0,
                "is_solvable": False,
                "message": "Determinant is 0: system has no unique solution (either inconsistent or dependent planes).",
                "steps": ["Main determinant D = 0. No unique solution exists."],
            }

        x = Dx / D
        y = Dy / D
        z = Dz / D

        return {
            "det": D,
            "is_solvable": True,
            "x": x,
            "y": y,
            "z": z,
            "steps": [
                f"Calculated 3×3 determinant D = {round(D, 6)}",
                f"Dx = {round(Dx, 6)}, Dy = {round(Dy, 6)}, Dz = {round(Dz, 6)}",
                f"x = Dx / D = {round(x, 6)}",
                f"y = Dy / D = {round(y, 6)}",
                f"z = Dz / D = {round(z, 6)}",
            ],
        }

    @staticmethod
    def solve_general_equation(
        expression: str,
        range_min: float = -10.0,
        range_max: float = 10.0,
        samples: int = 200
    ) -> Dict[str, Any]:
        """
        Solves general nonlinear equation f(x) = 0 using SafeEvaluator and numerical Brent's method scan.
        """
        evaluator = SafeEvaluator(angle_mode="radians")
        def eval_fn(val: float) -> Optional[float]:
            try:
                res = evaluator._eval_worker_func(expression, ["x"], "radians", {"x": val})
                return res if math.isfinite(res) else None
            except Exception:
                return None

        if range_min >= range_max:
            return {"ok": False, "roots": [], "error": "Invalid range: min >= max"}

        step = (range_max - range_min) / samples
        roots: List[float] = []

        def add_root(r: float):
            rounded = round(r, 6)
            if math.isfinite(rounded) and not any(abs(rounded - existing) < 1e-5 for existing in roots):
                roots.append(rounded)

        x1 = range_min
        y1 = eval_fn(x1)
        if y1 is not None and abs(y1) < 1e-9:
            add_root(x1)

        for i in range(1, samples + 1):
            x2 = range_min + i * step
            y2 = eval_fn(x2)

            if y1 is not None and y2 is not None:
                if abs(y2) < 1e-9:
                    add_root(x2)
                elif (y1 > 0 and y2 < 0) or (y1 < 0 and y2 > 0):
                    # Brent's method / bisection on interval
                    a, b = x1, x2
                    fa, fb = y1, y2
                    for _ in range(60):
                        mid = (a + b) / 2.0
                        fmid = eval_fn(mid)
                        if fmid is None or abs(b - a) < 1e-8 or abs(fmid) < 1e-9:
                            add_root(mid)
                            break
                        if (fa > 0 and fmid < 0) or (fa < 0 and fmid > 0):
                            b, fb = mid, fmid
                        else:
                            a, fa = mid, fmid

            x1, y1 = x2, y2

        roots.sort()
        return {"ok": True, "roots": roots}

    @staticmethod
    def solve_quadratic_inequality(a: float, b: float, c: float, op: str) -> Dict[str, str]:
        """Solves ax^2 + bx + c (< | <= | > | >=) 0 analytically."""
        quad = EquationEngine.solve_quadratic(a, b, c)
        expr = f"{a}*x^2 + {b}*x + {c}"

        if quad["nature"] == "two-real":
            r1 = quad["roots"][0]["re"]
            r2 = quad["roots"][1]["re"]
            r1_str, r2_str = f"{r1:.4g}", f"{r2:.4g}"

            if a > 0:
                if op == "<":
                    return {"intervals": f"({r1_str}, {r2_str})", "graphExpression": expr}
                if op == "<=":
                    return {"intervals": f"[{r1_str}, {r2_str}]", "graphExpression": expr}
                if op == ">":
                    return {"intervals": f"(-∞, {r1_str}) ∪ ({r2_str}, ∞)", "graphExpression": expr}
                if op == ">=":
                    return {"intervals": f"(-∞, {r1_str}] ∪ [{r2_str}, ∞)", "graphExpression": expr}
            else:
                if op == "<":
                    return {"intervals": f"(-∞, {r1_str}) ∪ ({r2_str}, ∞)", "graphExpression": expr}
                if op == "<=":
                    return {"intervals": f"(-∞, {r1_str}] ∪ [{r2_str}, ∞)", "graphExpression": expr}
                if op == ">":
                    return {"intervals": f"({r1_str}, {r2_str})", "graphExpression": expr}
                if op == ">=":
                    return {"intervals": f"[{r1_str}, {r2_str}]", "graphExpression": expr}

        if quad["nature"] == "one-real":
            r = quad["roots"][0]["re"]
            r_str = f"{r:.4g}"
            if a > 0:
                if op == "<":
                    return {"intervals": "No real solutions (∅)", "graphExpression": expr}
                if op == "<=":
                    return {"intervals": f"{{{r_str}}}", "graphExpression": expr}
                if op == ">":
                    return {"intervals": f"(-∞, {r_str}) ∪ ({r_str}, ∞)", "graphExpression": expr}
                if op == ">=":
                    return {"intervals": "All real numbers (-∞, ∞)", "graphExpression": expr}

        if quad["nature"] == "two-complex":
            if a > 0:
                return {
                    "intervals": "All real numbers (-∞, ∞)" if op in (">", ">=") else "No real solutions (∅)",
                    "graphExpression": expr,
                }
            else:
                return {
                    "intervals": "All real numbers (-∞, ∞)" if op in ("<", "<=") else "No real solutions (∅)",
                    "graphExpression": expr,
                }

        return {"intervals": "Evaluated analytically", "graphExpression": expr}
