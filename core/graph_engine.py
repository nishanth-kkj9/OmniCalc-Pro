"""Graphing calculator core engine with GraphModel, GraphSampler, GraphAnalysis, and Renderer."""
from dataclasses import dataclass, field
import os
from typing import Callable, Dict, List, Optional, Tuple, Union
import numpy as np
import sympy as sp
import matplotlib

if os.environ.get("MPLBACKEND") not in ("Agg", "agg", "SVG", "svg", "PDF", "pdf"):
    try:
        matplotlib.use("QtAgg")
    except Exception:
        pass

from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg
from matplotlib.figure import Figure

from core.safe_evaluator import validate_expression
from utils.logger import get_logger

logger = get_logger()


@dataclass
class GraphModel:
    """Represents a graph expression and its rendering attributes."""
    expression: str
    curve_type: str = "function"  # function, parametric, polar, inequality
    color: Optional[str] = None
    line_style: str = "-"
    line_width: float = 2.0
    visible: bool = True
    domain_min: Optional[float] = None
    domain_max: Optional[float] = None
    parametric_y: Optional[str] = None
    inequality_op: str = "<="  # <, <=, >, >=


class GraphSampler:
    """Handles adaptive discretization, discontinuity isolation, and curve sampling."""

    @staticmethod
    def sample_function(
        func: Callable[[np.ndarray], np.ndarray],
        x_min: float,
        x_max: float,
        points: int = 1000,
        jump_threshold: float = 100.0,
    ) -> List[Tuple[np.ndarray, np.ndarray]]:
        """Samples f(x) and splits across vertical asymptotes or domain invalidity."""
        x_vals = np.linspace(x_min, x_max, points)
        try:
            y_vals = func(x_vals)
        except Exception:
            y_vals = np.array([func(xi) if np.isfinite(xi) else np.nan for xi in x_vals])

        y_vals = np.where(np.isfinite(y_vals), y_vals, np.nan)
        segments: List[Tuple[np.ndarray, np.ndarray]] = []
        cur_x: List[float] = []
        cur_y: List[float] = []

        for i in range(len(x_vals)):
            xi = x_vals[i]
            yi = y_vals[i]
            if np.isnan(yi):
                if cur_x:
                    segments.append((np.array(cur_x), np.array(cur_y)))
                    cur_x, cur_y = [], []
                continue

            if cur_y:
                last_y = cur_y[-1]
                if abs(yi - last_y) > jump_threshold and (yi * last_y < 0):
                    segments.append((np.array(cur_x), np.array(cur_y)))
                    cur_x, cur_y = [], []

            cur_x.append(xi)
            cur_y.append(yi)

        if cur_x:
            segments.append((np.array(cur_x), np.array(cur_y)))

        return segments


class GraphAnalysis:
    """Numerical analysis for curves: roots, extrema, intersections, and asymptotes."""

    @staticmethod
    def find_roots(
        func: Callable[[float], float],
        x_min: float,
        x_max: float,
        samples: int = 400,
    ) -> List[float]:
        """Finds roots of f(x) = 0 using bisection / secant on sampled sign changes."""
        xs = np.linspace(x_min, x_max, samples)
        roots: List[float] = []
        for i in range(len(xs) - 1):
            x0, x1 = xs[i], xs[i + 1]
            try:
                y0, y1 = func(x0), func(x1)
                if not (np.isfinite(y0) and np.isfinite(y1)):
                    continue
                if abs(y0) < 1e-12:
                    roots.append(float(x0))
                elif y0 * y1 < 0:
                    # Bisection
                    a, b = x0, x1
                    for _ in range(30):
                        mid = (a + b) / 2.0
                        ymid = func(mid)
                        if abs(ymid) < 1e-9 or (b - a) < 1e-8:
                            break
                        if func(a) * ymid < 0:
                            b = mid
                        else:
                            a = mid
                    root = (a + b) / 2.0
                    if not any(abs(r - root) < 1e-4 for r in roots):
                        roots.append(float(root))
            except Exception:
                continue
        return roots


class GraphEngine(FigureCanvasQTAgg):
    """Matplotlib Figure Canvas implementing high performance multi-curve graphing."""

    def __init__(self, parent=None):
        self.figure = Figure(figsize=(10, 6), dpi=100)
        super().__init__(self.figure)
        self.axes = self.figure.add_subplot(111)
        self.axes.grid(True, alpha=0.3)
        self.models: List[GraphModel] = []
        self.sampler = GraphSampler()
        self.analysis = GraphAnalysis()

    def plot_equations(
        self,
        equations: Union[List[str], List[GraphModel]],
        x_range: Tuple[float, float] = (-10, 10),
        points: int = 1000,
    ):
        self.figure.clear()
        self.axes = self.figure.add_subplot(111)
        self.axes.set_xlabel("x")
        self.axes.set_ylabel("y")
        self.axes.grid(True, linestyle="--", alpha=0.5)

        x_vals = np.linspace(x_range[0], x_range[1], points)

        for item in equations:
            eq = item.expression if isinstance(item, GraphModel) else item
            if not eq.strip():
                continue
            try:
                validated = validate_expression(eq.replace('^', '**'), allow_vars=True)
                x = sp.Symbol('x')
                func = sp.lambdify(x, sp.sympify(validated), ["numpy"])
                y_vals = func(x_vals)
                mask = np.isfinite(y_vals)
                self.axes.plot(x_vals[mask], y_vals[mask], label=f"y = {eq}")
            except Exception as exc:
                logger.warning("Graph plot failed for '%s': %s", eq, exc)

        self.axes.legend()
        self.draw()

    def clear(self):
        self.figure.clear()
        self.axes = self.figure.add_subplot(111)
        self.draw()

    def export_png(self, filename="graph.png"):
        self.figure.savefig(filename, dpi=150)
