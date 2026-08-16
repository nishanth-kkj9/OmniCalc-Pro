import unittest
import math
from core.statistics_engine import StatisticsEngine


class TestStatisticsEngine(unittest.TestCase):
    def setUp(self):
        self.engine = StatisticsEngine()

    def test_analyze_basic(self):
        data = [1, 2, 3, 4, 5]
        result = self.engine.analyze(data)
        self.assertEqual(result["Count"], 5)
        self.assertEqual(result["Sum"], 15)
        self.assertEqual(result["Mean"], 3.0)
        self.assertEqual(result["Median"], 3.0)
        self.assertEqual(result["Min"], 1.0)
        self.assertEqual(result["Max"], 5.0)

    def test_analyze_single_value(self):
        data = [7]
        result = self.engine.analyze(data)
        self.assertEqual(result["Count"], 1)
        self.assertEqual(result["Mean"], 7.0)
        self.assertEqual(result["Median"], 7.0)
        self.assertEqual(result["Min"], 7.0)
        self.assertEqual(result["Max"], 7.0)

    def test_analyze_negative_values(self):
        data = [-5, -3, -1, 0, 2, 4]
        result = self.engine.analyze(data)
        self.assertEqual(result["Count"], 6)
        self.assertAlmostEqual(result["Mean"], -0.5)
        self.assertEqual(result["Max"], 4.0)
        self.assertEqual(result["Min"], -5.0)

    def test_analyze_even_count_median(self):
        data = [1, 2, 3, 4]
        result = self.engine.analyze(data)
        self.assertAlmostEqual(result["Median"], 2.5)

    def test_analyze_variance_and_std(self):
        data = [1, 1, 1, 1]
        result = self.engine.analyze(data)
        self.assertEqual(result["Variance"], 0.0)
        self.assertEqual(result["Std Dev"], 0.0)

    def test_analyze_mode(self):
        data = [1, 2, 2, 3, 3, 3, 4]
        result = self.engine.analyze(data)
        self.assertEqual(result["Mode"], 3.0)
