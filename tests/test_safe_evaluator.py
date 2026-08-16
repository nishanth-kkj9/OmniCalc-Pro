import unittest
import math
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.safe_evaluator import SafeEvaluator, safe_eval


class TestSafeEvaluator(unittest.TestCase):
    """Test cases for the SafeEvaluator class."""

    def setUp(self):
        self.evaluator = SafeEvaluator(angle_mode="degrees")

    def test_basic_arithmetic(self):
        """Test basic arithmetic operations."""
        self.assertEqual(self.evaluator.evaluate("2 + 3"), 5.0)
        self.assertEqual(self.evaluator.evaluate("10 - 4"), 6.0)
        self.assertEqual(self.evaluator.evaluate("6 * 7"), 42.0)
        self.assertEqual(self.evaluator.evaluate("20 / 4"), 5.0)

    def test_order_of_operations(self):
        """Test operator precedence."""
        self.assertEqual(self.evaluator.evaluate("2 + 3 * 4"), 14.0)
        self.assertEqual(self.evaluator.evaluate("(2 + 3) * 4"), 20.0)
        self.assertEqual(self.evaluator.evaluate("10 / 2 + 3"), 8.0)

    def test_exponents(self):
        """Test exponentiation."""
        self.assertEqual(self.evaluator.evaluate("2 ^ 3"), 8.0)
        self.assertEqual(self.evaluator.evaluate("5 ^ 2"), 25.0)
        self.assertEqual(self.evaluator.evaluate("2 ** 3"), 8.0)

    def test_scientific_functions_degrees(self):
        """Test trigonometric functions in degree mode."""
        # sin(30°) = 0.5
        self.assertAlmostEqual(self.evaluator.evaluate("sin(30)"), 0.5, places=10)
        # cos(60°) = 0.5
        self.assertAlmostEqual(self.evaluator.evaluate("cos(60)"), 0.5, places=10)
        # tan(45°) = 1
        self.assertAlmostEqual(self.evaluator.evaluate("tan(45)"), 1.0, places=10)

        # Inverse functions
        self.assertAlmostEqual(self.evaluator.evaluate("asin(0.5)"), 30.0, places=10)
        self.assertAlmostEqual(self.evaluator.evaluate("acos(0.5)"), 60.0, places=10)
        self.assertAlmostEqual(self.evaluator.evaluate("atan(1)"), 45.0, places=10)

    def test_scientific_functions_radians(self):
        """Test trigonometric functions in radian mode."""
        rad_evaluator = SafeEvaluator(angle_mode="radians")
        # sin(pi/6) = 0.5
        self.assertAlmostEqual(rad_evaluator.evaluate("sin(pi/6)"), 0.5, places=10)
        # cos(pi/3) = 0.5
        self.assertAlmostEqual(rad_evaluator.evaluate("cos(pi/3)"), 0.5, places=10)

    def test_hyperbolic_functions(self):
        """Test hyperbolic functions."""
        self.assertAlmostEqual(self.evaluator.evaluate("sinh(0)"), 0.0, places=10)
        self.assertAlmostEqual(self.evaluator.evaluate("cosh(0)"), 1.0, places=10)
        self.assertAlmostEqual(self.evaluator.evaluate("tanh(0)"), 0.0, places=10)

    def test_logarithmic_functions(self):
        """Test logarithmic functions."""
        self.assertAlmostEqual(self.evaluator.evaluate("log(100)"), 2.0, places=10)
        self.assertAlmostEqual(self.evaluator.evaluate("ln(e)"), 1.0, places=10)
        self.assertAlmostEqual(self.evaluator.evaluate("log10(1000)"), 3.0, places=10)
        self.assertAlmostEqual(self.evaluator.evaluate("log2(8)"), 3.0, places=10)

    def test_sqrt_and_roots(self):
        """Test square root and other roots."""
        self.assertEqual(self.evaluator.evaluate("sqrt(16)"), 4.0)
        self.assertEqual(self.evaluator.evaluate("cbrt(27)"), 3.0)

    def test_factorial(self):
        """Test factorial function."""
        self.assertEqual(self.evaluator.evaluate("factorial(5)"), 120.0)
        self.assertEqual(self.evaluator.evaluate("factorial(0)"), 1.0)

    def test_constants(self):
        """Test mathematical constants."""
        self.assertAlmostEqual(self.evaluator.evaluate("pi"), math.pi, places=10)
        self.assertAlmostEqual(self.evaluator.evaluate("e"), math.e, places=10)
        self.assertAlmostEqual(self.evaluator.evaluate("tau"), math.tau, places=10)

    def test_rounding_functions(self):
        """Test rounding functions."""
        self.assertEqual(self.evaluator.evaluate("floor(3.7)"), 3.0)
        self.assertEqual(self.evaluator.evaluate("ceil(3.2)"), 4.0)
        self.assertEqual(self.evaluator.evaluate("round(3.5)"), 4.0)
        self.assertEqual(self.evaluator.evaluate("trunc(3.9)"), 3.0)

    def test_abs_and_exp(self):
        """Test absolute value and exponential."""
        self.assertEqual(self.evaluator.evaluate("abs(-5)"), 5.0)
        self.assertAlmostEqual(self.evaluator.evaluate("exp(1)"), math.e, places=10)
        self.assertAlmostEqual(self.evaluator.evaluate("expm1(1)"), math.e - 1, places=10)

    def test_degrees_radians_conversion(self):
        """Test degree/radian conversion functions."""
        self.assertAlmostEqual(self.evaluator.evaluate("radians(180)"), math.pi, places=10)
        self.assertAlmostEqual(self.evaluator.evaluate("degrees(pi)"), 180.0, places=10)

    def test_unicode_normalization(self):
        """Test Unicode math symbol normalization."""
        self.assertEqual(self.evaluator.evaluate("2 × 3"), 6.0)
        self.assertEqual(self.evaluator.evaluate("10 ÷ 2"), 5.0)
        self.assertEqual(self.evaluator.evaluate("5 − 3"), 2.0)
        self.assertEqual(self.evaluator.evaluate("π"), math.pi)
        self.assertEqual(self.evaluator.evaluate("2²"), 4.0)
        self.assertEqual(self.evaluator.evaluate("√16"), 4.0)

    def test_implicit_multiplication(self):
        """Test implicit multiplication."""
        self.assertEqual(self.evaluator.evaluate("2pi"), 2 * math.pi)
        self.assertEqual(self.evaluator.evaluate("3(4+5)"), 27.0)
        self.assertEqual(self.evaluator.evaluate("(2)(3)"), 6.0)

    def test_error_handling(self):
        """Test error handling for invalid expressions."""
        with self.assertRaises(ValueError):
            self.evaluator.evaluate("2 $ 3")

        with self.assertRaises(ValueError):
            self.evaluator.evaluate("1 / 0")

        with self.assertRaises(ValueError):
            self.evaluator.evaluate("unknown_func(5)")

        with self.assertRaises(ValueError):
            self.evaluator.evaluate("")

    def test_max_length(self):
        """Test expression length limit."""
        long_expr = "1 + " * 200  # > 500 chars
        with self.assertRaises(ValueError):
            self.evaluator.evaluate(long_expr)

    def test_safe_eval_wrapper(self):
        """Test the safe_eval convenience function."""
        result = safe_eval("2 + 3 * 4")
        self.assertEqual(result, 14.0)

        result = safe_eval("invalid")
        self.assertTrue(isinstance(result, str) and result.startswith("Error:"))


class TestSafeEvaluatorEdgeCases(unittest.TestCase):
    """Test edge cases for the safe evaluator."""

    def setUp(self):
        self.evaluator = SafeEvaluator(angle_mode="degrees")

    def test_nested_functions(self):
        """Test nested function calls."""
        result = self.evaluator.evaluate("sqrt(factorial(4))")
        self.assertAlmostEqual(result, math.sqrt(24), places=10)

    def test_complex_expression(self):
        """Test a complex mathematical expression."""
        # (sin(30) + cos(60))^2 + sqrt(16)
        result = self.evaluator.evaluate("(sin(30) + cos(60))^2 + sqrt(16)")
        expected = (0.5 + 0.5)**2 + 4
        self.assertAlmostEqual(result, expected, places=10)

    def test_negative_numbers(self):
        """Test negative number handling."""
        self.assertEqual(self.evaluator.evaluate("-5 + 3"), -2.0)
        self.assertEqual(self.evaluator.evaluate("5 * -2"), -10.0)
        self.assertEqual(self.evaluator.evaluate("-3^2"), -9.0)  # -9 not 9

    def test_scientific_notation(self):
        """Test scientific notation."""
        self.assertEqual(self.evaluator.evaluate("1e3"), 1000.0)
        self.assertEqual(self.evaluator.evaluate("2.5e-2"), 0.025)


if __name__ == '__main__':
    unittest.main()