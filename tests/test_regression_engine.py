import unittest
from core.regression_engine import RegressionEngine


class TestRegressionEngine(unittest.TestCase):
    def test_linear_fit(self):
        x = [1.0, 2.0, 3.0, 4.0, 5.0]
        y = [2.0, 4.0, 6.0, 8.0, 10.0]
        result = RegressionEngine.linear_fit(x, y)
        self.assertAlmostEqual(result["slope"], 2.0, places=4)
        self.assertAlmostEqual(result["intercept"], 0.0, places=4)
        self.assertAlmostEqual(result["r2"], 1.0, places=4)

    def test_polynomial_fit(self):
        x = [-2.0, -1.0, 0.0, 1.0, 2.0]
        y = [4.0, 1.0, 0.0, 1.0, 4.0]
        result = RegressionEngine.polynomial_fit(x, y, degree=2)
        self.assertAlmostEqual(result["r2"], 1.0, places=4)
        self.assertEqual(len(result["coefficients"]), 3)

    def test_insufficient_points(self):
        with self.assertRaises(ValueError):
            RegressionEngine.linear_fit([1.0], [2.0])


if __name__ == "__main__":
    unittest.main()
