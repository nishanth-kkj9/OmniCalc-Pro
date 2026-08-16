import unittest
from unittest.mock import patch, MagicMock, PropertyMock


# Mock the entire backend_qt to prevent FigureCanvasQTAgg init issues
@patch("core.graph_engine.matplotlib.use")
@patch("core.graph_engine.Figure")
@patch("core.graph_engine.np")
class TestGraphEngine(unittest.TestCase):
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
        engine = GraphEngine()
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
