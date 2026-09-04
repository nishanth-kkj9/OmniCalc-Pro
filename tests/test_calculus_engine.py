import unittest
import math
from core.calculus_engine import CalculusEngine


class TestCalculusEngine(unittest.TestCase):
    def setUp(self):
        self.engine = CalculusEngine(angle_mode="radians")

    def test_calculate_derivative(self):
        # f(x) = x^3 - 3x + 2 at x = 2 -> f'(2) = 3(4) - 3 = 9
        d = self.engine.calculate_derivative("x**3 - 3*x + 2", 2.0)
        self.assertIsNotNone(d)
        self.assertAlmostEqual(d, 9.0, places=4)

    def test_calculate_second_derivative(self):
        # f(x) = x^4 at x = 3 -> f''(x) = 12x^2 -> f''(3) = 108
        d2 = self.engine.calculate_second_derivative("x**4", 3.0)
        self.assertIsNotNone(d2)
        self.assertAlmostEqual(d2, 108.0, places=3)

    def test_integrate_definite_simpson(self):
        # ∫[0, π] sin(x) dx = 2.0
        res = self.engine.integrate_definite("sin(x)", 0.0, math.pi, subdivisions=100, method="simpson")
        self.assertIsNotNone(res)
        self.assertAlmostEqual(res["value"], 2.0, places=6)

    def test_integrate_definite_adaptive(self):
        # ∫[0, 1] x^2 dx = 1/3 ≈ 0.33333333
        res = self.engine.integrate_definite("x**2", 0.0, 1.0, method="adaptive")
        self.assertIsNotNone(res)
        self.assertAlmostEqual(res["value"], 1/3, places=6)

    def test_tangent_line(self):
        # f(x) = x^2 at x = 2 -> y0 = 4, m = 4, y = 4x - 4
        res = self.engine.calculate_tangent_line("x**2", 2.0)
        self.assertIsNotNone(res)
        self.assertAlmostEqual(res["y0"], 4.0, places=4)
        self.assertAlmostEqual(res["slope"], 4.0, places=4)
        self.assertAlmostEqual(res["intercept"], -4.0, places=4)

    def test_normal_line(self):
        # f(x) = x^2 at x = 2 -> slope = -1/4 = -0.25, intercept = 4 - (-0.25)*2 = 4.5
        res = self.engine.calculate_normal_line("x**2", 2.0)
        self.assertIsNotNone(res)
        self.assertAlmostEqual(res["slope"], -0.25, places=4)
        self.assertAlmostEqual(res["intercept"], 4.5, places=4)

    def test_solve_newton_raphson(self):
        # f(x) = x^2 - 2 = 0 starting at x0 = 1.0 -> root = √2 ≈ 1.41421356
        res = self.engine.solve_newton_raphson("x**2 - 2", 1.0)
        self.assertTrue(res["converged"])
        self.assertAlmostEqual(res["root"], math.sqrt(2), places=5)

    def test_area_between_curves(self):
        # f1(x) = x, f2(x) = x^2 on [0, 1] -> ∫[0,1] (x - x^2) dx = [x^2/2 - x^3/3] = 1/6 ≈ 0.16666667
        res = self.engine.area_between_curves("x", "x**2", 0.0, 1.0)
        self.assertIsNotNone(res)
        self.assertAlmostEqual(res["value"], 1/6, places=5)


if __name__ == "__main__":
    unittest.main()
