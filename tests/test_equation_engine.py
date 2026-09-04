import unittest
import math
from core.equation_engine import EquationEngine


class TestEquationEngine(unittest.TestCase):
    def test_solve_quadratic_two_real_roots(self):
        # x^2 - 5x + 6 = 0 -> roots 2 and 3
        res = EquationEngine.solve_quadratic(1.0, -5.0, 6.0)
        self.assertEqual(res["nature"], "two-real")
        self.assertEqual(res["discriminant"], 1.0)
        roots = [r["re"] for r in res["roots"]]
        self.assertAlmostEqual(roots[0], 2.0, places=5)
        self.assertAlmostEqual(roots[1], 3.0, places=5)
        self.assertAlmostEqual(res["vertex"]["x"], 2.5, places=5)
        self.assertAlmostEqual(res["vertex"]["y"], -0.25, places=5)

    def test_solve_quadratic_one_real_root(self):
        # x^2 - 4x + 4 = 0 -> root 2
        res = EquationEngine.solve_quadratic(1.0, -4.0, 4.0)
        self.assertEqual(res["nature"], "one-real")
        self.assertEqual(res["discriminant"], 0.0)
        self.assertAlmostEqual(res["roots"][0]["re"], 2.0, places=5)

    def test_solve_quadratic_complex_roots(self):
        # x^2 + 2x + 5 = 0 -> roots -1 +/- 2i
        res = EquationEngine.solve_quadratic(1.0, 2.0, 5.0)
        self.assertEqual(res["nature"], "two-complex")
        self.assertEqual(res["discriminant"], -16.0)
        self.assertAlmostEqual(res["roots"][0]["re"], -1.0, places=5)
        self.assertAlmostEqual(res["roots"][0]["im"], 2.0, places=5)
        self.assertAlmostEqual(res["roots"][1]["re"], -1.0, places=5)
        self.assertAlmostEqual(res["roots"][1]["im"], -2.0, places=5)

    def test_solve_cubic_three_real_roots(self):
        # (x - 1)(x - 2)(x - 3) = x^3 - 6x^2 + 11x - 6 = 0
        res = EquationEngine.solve_cubic(1.0, -6.0, 11.0, -6.0)
        roots = sorted([r["re"] for r in res["roots"]])
        self.assertEqual(len(roots), 3)
        self.assertAlmostEqual(roots[0], 1.0, places=4)
        self.assertAlmostEqual(roots[1], 2.0, places=4)
        self.assertAlmostEqual(roots[2], 3.0, places=4)

    def test_solve_linear_system_2x2(self):
        # 2x + 3y = 8
        # x - y = 1
        # Det = -5, x = 11/5 = 2.2, y = 6/5 = 1.2
        res = EquationEngine.solve_linear_system_2x2(2.0, 3.0, 8.0, 1.0, -1.0, 1.0)
        self.assertTrue(res["is_solvable"])
        self.assertAlmostEqual(res["x"], 2.2, places=5)
        self.assertAlmostEqual(res["y"], 1.2, places=5)

    def test_solve_linear_system_2x2_parallel(self):
        # 2x + 3y = 8
        # 2x + 3y = 10 (parallel)
        res = EquationEngine.solve_linear_system_2x2(2.0, 3.0, 8.0, 2.0, 3.0, 10.0)
        self.assertFalse(res["is_solvable"])

    def test_solve_linear_system_3x3(self):
        # x + y + z = 6
        # 0x + 2y + 5z = -4
        # 2x + 5y - z = 27
        # Solution: x = 7, y = 3, z = -4
        res = EquationEngine.solve_linear_system_3x3(
            1.0, 1.0, 1.0, 6.0,
            0.0, 2.0, 5.0, -4.0,
            2.0, 5.0, -1.0, 27.0
        )
        self.assertTrue(res["is_solvable"])
        self.assertAlmostEqual(res["x"], 7.0, places=4)
        self.assertAlmostEqual(res["y"], 3.0, places=4)
        self.assertAlmostEqual(res["z"], -4.0, places=4)

    def test_solve_general_equation(self):
        # x^3 - 2x - 5 = 0 -> root approx 2.09455148
        res = EquationEngine.solve_general_equation("x**3 - 2*x - 5", range_min=-5.0, range_max=5.0)
        self.assertTrue(res["ok"])
        self.assertEqual(len(res["roots"]), 1)
        self.assertAlmostEqual(res["roots"][0], 2.094551, places=4)

    def test_solve_quadratic_inequality(self):
        # x^2 - 3x + 2 < 0 -> (1, 2)
        res = EquationEngine.solve_quadratic_inequality(1.0, -3.0, 2.0, "<")
        self.assertEqual(res["intervals"], "(1, 2)")


if __name__ == "__main__":
    unittest.main()
