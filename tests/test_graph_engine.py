import unittest
import sys
from unittest.mock import patch, MagicMock, PropertyMock
try:
    from PySide6.QtWidgets import QApplication
    HAS_PYSIDE6 = True
except ImportError:
    QApplication = None
    HAS_PYSIDE6 = False


# Mock the entire backend_qt to prevent FigureCanvasQTAgg init issues
@unittest.skipUnless(HAS_PYSIDE6, "PySide6 not installed")
@patch("core.graph_engine.matplotlib.use")
@patch("core.graph_engine.Figure")
@patch("core.graph_engine.np")
class TestGraphEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if QApplication.instance() is None:
            cls.app = QApplication([sys.argv[0] if sys.argv else "pytest", "-platform", "offscreen"])

    def setUp(self):
        self.get_width_height_patch = patch(
            "core.graph_engine.FigureCanvasQTAgg.get_width_height",
            return_value=(800, 600)
        )
        self.get_width_height_patch.start()

    def tearDown(self):
        self.get_width_height_patch.stop()

    def _make_engine(self, mock_np, MockFigure, mock_mpl_use):
        from core.graph_engine import GraphEngine
        engine = GraphEngine.__new__(GraphEngine)
        engine.figure = MockFigure()
        from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg
        FigureCanvasQTAgg.__init__(engine, figure=engine.figure)
        engine.axes = engine.figure.add_subplot.return_value
        engine.draw = MagicMock()
        return engine

    def test_initialization(self, mock_np, MockFigure, mock_mpl_use):
        from core.graph_engine import GraphEngine
        GraphEngine()
        MockFigure.assert_called_once_with(figsize=(10, 6), dpi=100)

    def test_plot_single_equation(self, mock_np, MockFigure, mock_mpl_use):
        from core.graph_engine import GraphEngine
        engine = GraphEngine()
        engine.axes = MagicMock()
        engine.draw = MagicMock()
        engine.plot_equations(["x**2"])
        mock_np.linspace.assert_called_once()
        engine.axes.plot.assert_called_once()
        engine.axes.legend.assert_called_once()
        engine.draw.assert_called_once()

    def test_plot_multiple_equations(self, mock_np, MockFigure, mock_mpl_use):
        from core.graph_engine import GraphEngine
        engine = GraphEngine()
        engine.axes = MagicMock()
        engine.draw = MagicMock()
        engine.plot_equations(["x**2", "x+1"])
        self.assertEqual(engine.axes.plot.call_count, 2)

    def test_plot_skips_empty(self, mock_np, MockFigure, mock_mpl_use):
        from core.graph_engine import GraphEngine
        engine = GraphEngine()
        engine.axes = MagicMock()
        engine.draw = MagicMock()
        engine.plot_equations(["", "x+1"])
        self.assertEqual(engine.axes.plot.call_count, 1)

    def test_clear(self, mock_np, MockFigure, mock_mpl_use):
        from core.graph_engine import GraphEngine
        engine = GraphEngine()
        engine.axes = MagicMock()
        engine.draw = MagicMock()
        engine.clear()
        engine.figure.clear.assert_called_once()
        engine.draw.assert_called_once()

    def test_export_png(self, mock_np, MockFigure, mock_mpl_use):
        from core.graph_engine import GraphEngine
        engine = GraphEngine()
        engine.export_png("test.png")
        engine.figure.savefig.assert_called_once_with("test.png", dpi=150)


class TestGraphSamplerAndAnalysis(unittest.TestCase):
    def test_graph_model(self):
        from core.graph_engine import GraphModel
        model = GraphModel(expression="x**2 - 4", curve_type="function")
        self.assertEqual(model.expression, "x**2 - 4")
        self.assertEqual(model.curve_type, "function")
        self.assertTrue(model.visible)

    def test_sampler_continuous_function(self):
        from core.graph_engine import GraphSampler
        # Test f(x) = x^2 on [-2, 2]
        segs = GraphSampler.sample_function(lambda x: x ** 2, -2.0, 2.0, points=50)
        self.assertEqual(len(segs), 1)
        xs, ys = segs[0]
        self.assertEqual(len(xs), 50)
        self.assertAlmostEqual(float(ys[0]), 4.0, places=5)
        self.assertAlmostEqual(float(ys[len(ys) // 2]), 0.0, places=1)

    def test_sampler_discontinuity_and_asymptote(self):
        from core.graph_engine import GraphSampler
        # Test f(x) = 1/x on [-2, 2] with jump across vertical asymptote at x=0
        def inv_f(x):
            import numpy as np
            return np.where(np.abs(x) < 1e-6, np.nan, 1.0 / x)

        segs = GraphSampler.sample_function(inv_f, -2.0, 2.0, points=101, jump_threshold=10.0)
        # Should be split into at least 2 segments around the asymptote
        self.assertGreaterEqual(len(segs), 2)

    def test_analysis_find_roots(self):
        from core.graph_engine import GraphAnalysis
        roots = GraphAnalysis.find_roots(lambda x: x ** 2 - 4, -3.0, 3.0, samples=100)
        self.assertEqual(len(roots), 2)
        sorted_roots = sorted(roots)
        self.assertAlmostEqual(sorted_roots[0], -2.0, places=2)
        self.assertAlmostEqual(sorted_roots[1], 2.0, places=2)

