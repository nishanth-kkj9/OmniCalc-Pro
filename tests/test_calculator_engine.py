import unittest
from core.calculator_engine import BasicEngine


class TestBasicEngine(unittest.TestCase):
    def setUp(self):
        self.engine = BasicEngine()

    def test_calculate_addition(self):
        result = self.engine.calculate("2 + 3")
        self.assertEqual(result, 5.0)

    def test_calculate_subtraction(self):
        result = self.engine.calculate("10 - 4")
        self.assertEqual(result, 6.0)

    def test_calculate_multiplication(self):
        result = self.engine.calculate("6 * 7")
        self.assertEqual(result, 42.0)

    def test_calculate_division(self):
        result = self.engine.calculate("20 / 4")
        self.assertEqual(result, 5.0)

    def test_calculate_order_of_ops(self):
        result = self.engine.calculate("2 + 3 * 4")
        self.assertEqual(result, 14.0)

    def test_calculate_invalid(self):
        result = self.engine.calculate("invalid")
        self.assertIsInstance(result, str)
        self.assertTrue(result.startswith("Error:"))

    def test_calculate_division_by_zero(self):
        result = self.engine.calculate("10 / 0")
        self.assertIsInstance(result, str)
        self.assertTrue(result.startswith("Error:"))

    def test_calculate_percentage(self):
        result = self.engine.calculate("50%")
        self.assertEqual(result, 0.5)
        result2 = self.engine.calculate("200 * 15%")
        self.assertEqual(result2, 30.0)
        result3 = self.engine.calculate("(20 + 30)%")
        self.assertEqual(result3, 0.5)

    def test_calculate_parentheses(self):
        result = self.engine.calculate("(2 + 3) * 4")
        self.assertEqual(result, 20.0)

    def test_calculate_square_root(self):
        result = self.engine.calculate("√(16)")
        self.assertEqual(result, 4.0)
        result2 = self.engine.calculate("sqrt(25)")
        self.assertEqual(result2, 5.0)

    def test_calculate_exponent_behavior(self):
        result = self.engine.calculate("2 ^ 3")
        self.assertEqual(result, 8.0)
        result2 = self.engine.calculate("5 ^ 2")
        self.assertEqual(result2, 25.0)

    def test_calculate_sign_behavior(self):
        result = self.engine.calculate("-5 + 12")
        self.assertEqual(result, 7.0)
        result2 = self.engine.calculate("12 + (-5)")
        self.assertEqual(result2, 7.0)
        result3 = self.engine.calculate("-(-5)")
        self.assertEqual(result3, 5.0)

    def test_calculate_decimal_behavior(self):
        result = self.engine.calculate("0.1 + 0.2")
        self.assertAlmostEqual(result, 0.3, places=7)
        result2 = self.engine.calculate("1.5 * 2.4")
        self.assertAlmostEqual(result2, 3.6, places=7)

    def test_calculate_empty_and_whitespace(self):
        self.assertEqual(self.engine.calculate(""), 0.0)
        self.assertEqual(self.engine.calculate("   "), 0.0)
