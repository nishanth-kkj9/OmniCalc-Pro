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
