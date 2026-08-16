"""Graphing calculator logic."""
import numpy as np
import sympy as sp
import matplotlib
matplotlib.use("QtAgg")
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg
from matplotlib.figure import Figure

from core.safe_evaluator import validate_expression
from utils.logger import get_logger

logger = get_logger()


class GraphEngine(FigureCanvasQTAgg):
    def __init__(self, parent=None):
        self.figure = Figure(figsize=(10, 6), dpi=100)
        super().__init__(self.figure)
        self.axes = self.figure.add_subplot(111)
        self.axes.grid(True, alpha=0.3)

    def plot_equations(self, equations, x_range=(-10, 10), points=1000):
        self.figure.clear()
        self.axes = self.figure.add_subplot(111)
        self.axes.set_xlabel("x")
        self.axes.set_ylabel("y")
        self.axes.grid(True, linestyle="--", alpha=0.5)

        x_vals = np.linspace(x_range[0], x_range[1], points)

        for eq in equations:
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