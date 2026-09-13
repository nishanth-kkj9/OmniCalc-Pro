"""Graphing calculator core engine with GraphModel, GraphSampler, GraphAnalysis, and Renderer."""
from dataclasses import dataclass
import os
from typing import Callable, List, Optional, Tuple, Union
import numpy as np
import sympy as sp

try:
    import matplotlib
    if os.environ.get("MPLBACKEND") not in ("Agg", "agg", "SVG", "svg", "PDF", "pdf"):
        try:
            matplotlib.use("QtAgg")
        except Exception:
            pass
    from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg
    from matplotlib.figure import Figure
    MATPLOTLIB_AVAILABLE = True
except Exception:
    matplotlib = None
    MATPLOTLIB_AVAILABLE = False
    class FigureCanvasQTAgg:  # type: ignore[no-redef]
        def __init__(self, figure=None, parent=None):
            self.figure = figure
            self.parent = parent

        def get_width_height(self):
            return (800, 600)

    class Figure:  # type: ignore[no-redef]
        def __init__(self, figsize=(10, 6), dpi=100):
            self.figsize = figsize
            self.dpi = dpi
        def clear(self):
            pass
        def add_subplot(self, *args, **kwargs):
            return None
        def savefig(self, *args, **kwargs):
            pass

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
            with np.errstate(divide='ignore', invalid='ignore'):
                y_vals = func(x_vals)
        except Exception:
            y_vals = np.array([func(xi) if np.isfinite(xi) else np.nan for xi in x_vals])

        y_vals = np.where(np.isfinite(y_vals), y_vals, np.nan)
        segments: List[Tuple[np.ndarray, np.ndarray]] = []
        cur_x: List[float] = []
        cur_y: List[float] = []

        for i in range(len(x_vals)):
            xi = float(x_vals[i])
            yi = float(y_vals[i])
            if np.isnan(yi):
                if cur_x:
                    segments.append((np.array(cur_x), np.array(cur_y)))
                    cur_x, cur_y = [], []
                continue

            if cur_y:
                last_y = cur_y[-1]
                # Split if:
                # 1. Opposite-sign steep jump (odd pole: 1/x, tan(x))
                # 2. Same-sign steep jump with high divergence (even pole: 1/x^2)
                # 3. Extreme jump exceeding threshold
                is_odd_pole = abs(yi - last_y) > jump_threshold and (yi * last_y < 0)
                is_even_pole = abs(yi - last_y) > jump_threshold and (abs(yi) > jump_threshold * 0.5 or abs(last_y) > jump_threshold * 0.5)
                is_extreme = abs(yi - last_y) > jump_threshold * 2

                if is_odd_pole or is_even_pole or is_extreme:
                    segments.append((np.array(cur_x), np.array(cur_y)))
                    cur_x, cur_y = [], []

            cur_x.append(xi)
            cur_y.append(yi)

        if cur_x:
            segments.append((np.array(cur_x), np.array(cur_y)))

        return segments

    @staticmethod
    def sample_parametric(
        x_func: Callable[[np.ndarray], np.ndarray],
        y_func: Callable[[np.ndarray], np.ndarray],
        t_min: float,
        t_max: float,
        points: int = 1000,
        jump_threshold: float = 100.0,
    ) -> List[Tuple[np.ndarray, np.ndarray]]:
        """Samples parametric curve x(t), y(t) with discontinuity isolation."""
        t_vals = np.linspace(t_min, t_max, points)
        try:
            with np.errstate(divide='ignore', invalid='ignore'):
                xs = x_func(t_vals)
        except Exception:
            xs = np.array([x_func(ti) if np.isfinite(ti) else np.nan for ti in t_vals])
        try:
            with np.errstate(divide='ignore', invalid='ignore'):
                ys = y_func(t_vals)
        except Exception:
            ys = np.array([y_func(ti) if np.isfinite(ti) else np.nan for ti in t_vals])

        xs = np.where(np.isfinite(xs), xs, np.nan)
        ys = np.where(np.isfinite(ys), ys, np.nan)
        segments: List[Tuple[np.ndarray, np.ndarray]] = []
        cur_x: List[float] = []
        cur_y: List[float] = []

        for i in range(len(t_vals)):
            xi = float(xs[i])
            yi = float(ys[i])
            if np.isnan(xi) or np.isnan(yi):
                if cur_x:
                    segments.append((np.array(cur_x), np.array(cur_y)))
                    cur_x, cur_y = [], []
                continue

            if cur_x and cur_y:
                dx = abs(xi - cur_x[-1])
                dy = abs(yi - cur_y[-1])
                if dx > jump_threshold or dy > jump_threshold:
                    segments.append((np.array(cur_x), np.array(cur_y)))
                    cur_x, cur_y = [], []

            cur_x.append(xi)
            cur_y.append(yi)

        if cur_x:
            segments.append((np.array(cur_x), np.array(cur_y)))

        return segments

    @staticmethod
    def sample_polar(
        r_func: Callable[[np.ndarray], np.ndarray],
        theta_min: float,
        theta_max: float,
        points: int = 1000,
        jump_threshold: float = 100.0,
    ) -> List[Tuple[np.ndarray, np.ndarray]]:
        """Samples polar curve r(theta) into Cartesian segments."""
        theta_vals = np.linspace(theta_min, theta_max, points)
        try:
            with np.errstate(divide='ignore', invalid='ignore'):
                r_vals = r_func(theta_vals)
        except Exception:
            r_vals = np.array([r_func(ti) if np.isfinite(ti) else np.nan for ti in theta_vals])

        r_vals = np.where(np.isfinite(r_vals), r_vals, np.nan)
        xs = r_vals * np.cos(theta_vals)
        ys = r_vals * np.sin(theta_vals)

        segments: List[Tuple[np.ndarray, np.ndarray]] = []
        cur_x: List[float] = []
        cur_y: List[float] = []

        for i in range(len(theta_vals)):
            xi = float(xs[i])
            yi = float(ys[i])
            if np.isnan(xi) or np.isnan(yi):
                if cur_x:
                    segments.append((np.array(cur_x), np.array(cur_y)))
                    cur_x, cur_y = [], []
                continue

            if cur_x and cur_y:
                dx = abs(xi - cur_x[-1])
                dy = abs(yi - cur_y[-1])
                if dx > jump_threshold or dy > jump_threshold:
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
        """Finds roots of f(x) = 0 using bisection on sampled sign changes."""
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
                        if not np.isfinite(ymid):
                            break
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

    @staticmethod
    def find_extrema(
        func: Callable[[float], float],
        x_min: float,
        x_max: float,
        samples: int = 400,
    ) -> List[Tuple[float, float, str]]:
        """Finds local minima and maxima by monitoring derivative sign changes."""
        xs = np.linspace(x_min, x_max, samples)
        extrema: List[Tuple[float, float, str]] = []
        dx = (x_max - x_min) / samples

        def deriv(x: float) -> float:
            h = 1e-5
            return (func(x + h) - func(x - h)) / (2 * h)

        for i in range(1, len(xs) - 1):
            x = xs[i]
            try:
                d0 = deriv(x - dx / 2)
                d1 = deriv(x + dx / 2)
                if np.isfinite(d0) and np.isfinite(d1):
                    if d0 > 0 and d1 < 0:
                        y = func(x)
                        if np.isfinite(y):
                            extrema.append((float(x), float(y), "max"))
                    elif d0 < 0 and d1 > 0:
                        y = func(x)
                        if np.isfinite(y):
                            extrema.append((float(x), float(y), "min"))
            except Exception:
                continue
        return extrema

    @staticmethod
    def find_intersections(
        func1: Callable[[float], float],
        func2: Callable[[float], float],
        x_min: float,
        x_max: float,
        samples: int = 400,
    ) -> List[Tuple[float, float]]:
        """Finds intersection points between two functions."""
        diff_func = lambda x: func1(x) - func2(x)
        roots = GraphAnalysis.find_roots(diff_func, x_min, x_max, samples=samples)
        intersections = []
        for r in roots:
            try:
                y = func1(r)
                if np.isfinite(y):
                    intersections.append((r, float(y)))
            except Exception:
                pass
        return intersections


class GraphEngine(FigureCanvasQTAgg):
    """Matplotlib Figure Canvas implementing high performance multi-curve graphing."""

    def __init__(self, parent=None):
        self.figure = Figure(figsize=(10, 6), dpi=100)
        super().__init__(self.figure)
        self.axes = self.figure.add_subplot(111) if hasattr(self.figure, "add_subplot") else None
        if self.axes is not None and hasattr(self.axes, "grid"):
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
        if self.figure is None or not hasattr(self.figure, "clear"):
            return
        self.figure.clear()
        self.axes = self.figure.add_subplot(111)
        if self.axes is None:
            return
        self.axes.set_xlabel("x")
        self.axes.set_ylabel("y")
        self.axes.grid(True, linestyle="--", alpha=0.5)

        has_any_plots = False

        for item in equations:
            if isinstance(item, GraphModel):
                if not item.visible:
                    continue
                eq = item.expression
                curve_type = item.curve_type
                color = item.color
                line_style = item.line_style
                line_width = item.line_width
                domain_min = item.domain_min if item.domain_min is not None else x_range[0]
                domain_max = item.domain_max if item.domain_max is not None else x_range[1]
                parametric_y = item.parametric_y
                inequality_op = item.inequality_op
            else:
                eq = item
                curve_type = "function"
                color = None
                line_style = "-"
                line_width = 2.0
                domain_min = x_range[0]
                domain_max = x_range[1]
                parametric_y = None
                inequality_op = "<="

            if not eq or not str(eq).strip():
                continue

            clean_eq = str(eq).strip().replace("^", "**")

            try:
                if curve_type == "parametric" and parametric_y:
                    t = sp.Symbol('t')
                    val_x = validate_expression(clean_eq, allow_vars=True)
                    val_y = validate_expression(str(parametric_y).strip().replace("^", "**"), allow_vars=True)
                    fx = sp.lambdify(t, sp.sympify(val_x), ["numpy"])
                    fy = sp.lambdify(t, sp.sympify(val_y), ["numpy"])
                    segments = self.sampler.sample_parametric(fx, fy, domain_min, domain_max, points=points)
                    label = f"({eq}, {parametric_y})"
                elif curve_type == "polar":
                    theta = sp.Symbol('theta')
                    val_r = validate_expression(clean_eq, allow_vars=True)
                    fr = sp.lambdify(theta, sp.sympify(val_r), ["numpy"])
                    segments = self.sampler.sample_polar(fr, domain_min, domain_max, points=points)
                    label = f"r = {eq}"
                else:
                    x = sp.Symbol('x')
                    validated = validate_expression(clean_eq, allow_vars=True)
                    func = sp.lambdify(x, sp.sympify(validated), ["numpy"])
                    segments = self.sampler.sample_function(
                        func,
                        domain_min,
                        domain_max,
                        points=points,
                        jump_threshold=max(10.0, abs(x_range[1] - x_range[0]) * 5),
                    )
                    label = f"y {inequality_op} {eq}" if curve_type == "inequality" else f"y = {eq}"

                is_first_seg = True
                for seg_x, seg_y in segments:
                    if len(seg_x) < 2:
                        continue
                    lbl = label if is_first_seg else None
                    plot_kwargs = {
                        "linestyle": line_style,
                        "linewidth": line_width,
                    }
                    if color:
                        plot_kwargs["color"] = color
                    if lbl:
                        plot_kwargs["label"] = lbl

                    lines = self.axes.plot(seg_x, seg_y, **plot_kwargs)
                    has_any_plots = True
                    if is_first_seg and not color and lines:
                        color = lines[0].get_color()
                    is_first_seg = False

                    if curve_type == "inequality" and hasattr(self.axes, "fill_between"):
                        if inequality_op in ("<", "<="):
                            self.axes.fill_between(seg_x, seg_y, -1000, alpha=0.2, color=color)
                        else:
                            self.axes.fill_between(seg_x, seg_y, 1000, alpha=0.2, color=color)

            except Exception as exc:
                logger.warning("Graph plot failed for '%s': %s", eq, exc)

        if hasattr(self.axes, "set_xlim"):
            self.axes.set_xlim(x_range[0], x_range[1])
        if has_any_plots and hasattr(self.axes, "legend"):
            handles, labels = self.axes.get_legend_handles_labels()
            if handles:
                self.axes.legend()
        if hasattr(self, "draw"):
            self.draw()

    def clear(self):
        if self.figure is not None and hasattr(self.figure, "clear"):
            self.figure.clear()
            self.axes = self.figure.add_subplot(111) if hasattr(self.figure, "add_subplot") else None
        if hasattr(self, "draw"):
            self.draw()

    def export_png(self, filename="graph.png"):
        if self.figure is not None and hasattr(self.figure, "savefig"):
            self.figure.savefig(filename, dpi=150)

