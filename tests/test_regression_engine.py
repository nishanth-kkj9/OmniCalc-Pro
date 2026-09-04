import unittest
import math
from core.regression_engine import RegressionEngine


class TestRegressionEngine(unittest.TestCase):
    def test_linear_fit(self):
        x = [1.0, 2.0, 3.0, 4.0, 5.0]
        y = [2.0, 4.0, 6.0, 8.0, 10.0]
        result = RegressionEngine.linear_fit(x, y)
        self.assertAlmostEqual(result["slope"], 2.0, places=4)
        self.assertAlmostEqual(result["intercept"], 0.0, places=4)
        self.assertAlmostEqual(result["r2"], 1.0, places=4)

        pred = RegressionEngine.predict(result, 6.0)
        self.assertAlmostEqual(pred, 12.0, places=4)

        inv_pred = RegressionEngine.inverse_predict(result, 12.0)
        self.assertEqual(len(inv_pred), 1)
        self.assertAlmostEqual(inv_pred[0], 6.0, places=4)

    def test_polynomial_fit(self):
        x = [-2.0, -1.0, 0.0, 1.0, 2.0]
        y = [4.0, 1.0, 0.0, 1.0, 4.0]
        result = RegressionEngine.polynomial_fit(x, y, degree=2)
        self.assertAlmostEqual(result["r2"], 1.0, places=4)
        self.assertEqual(len(result["coefficients"]), 3)

        inv_roots = RegressionEngine.inverse_predict(result, 4.0)
        self.assertEqual(len(inv_roots), 2)
        self.assertAlmostEqual(min(inv_roots), -2.0, places=3)
        self.assertAlmostEqual(max(inv_roots), 2.0, places=3)

    def test_exponential_fit(self):
        x = [0.0, 1.0, 2.0, 3.0]
        a_true, b_true = 2.0, 0.5
        y = [a_true * math.exp(b_true * xi) for xi in x]
        res = RegressionEngine.exponential_fit(x, y)
        self.assertAlmostEqual(res["a"], 2.0, places=3)
        self.assertAlmostEqual(res["b"], 0.5, places=3)
        self.assertAlmostEqual(res["r2"], 1.0, places=3)

        inv_pred = RegressionEngine.inverse_predict(res, res["a"] * math.exp(0.5 * 2.5))
        self.assertEqual(len(inv_pred), 1)
        self.assertAlmostEqual(inv_pred[0], 2.5, places=3)

    def test_logarithmic_fit(self):
        x = [1.0, 2.0, 4.0, 8.0]
        a_true, b_true = 1.0, 3.0
        y = [a_true + b_true * math.log(xi) for xi in x]
        res = RegressionEngine.logarithmic_fit(x, y)
        self.assertAlmostEqual(res["a"], 1.0, places=3)
        self.assertAlmostEqual(res["b"], 3.0, places=3)
        self.assertAlmostEqual(res["r2"], 1.0, places=3)

    def test_power_fit(self):
        x = [1.0, 2.0, 3.0, 4.0]
        a_true, b_true = 3.0, 2.0
        y = [a_true * (xi ** b_true) for xi in x]
        res = RegressionEngine.power_fit(x, y)
        self.assertAlmostEqual(res["a"], 3.0, places=3)
        self.assertAlmostEqual(res["b"], 2.0, places=3)
        self.assertAlmostEqual(res["r2"], 1.0, places=3)

    def test_insufficient_points(self):
        with self.assertRaises(ValueError):
            RegressionEngine.linear_fit([1.0], [2.0])


if __name__ == "__main__":
    unittest.main()

