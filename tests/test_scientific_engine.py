import unittest
from core.scientific_engine import ScientificEngine


class TestScientificEngine(unittest.TestCase):
    def setUp(self):
        self.engine = ScientificEngine()

    def test_calculate_basic(self):
        result = self.engine.calculate("2 + 3")
        self.assertEqual(result, 5.0)

    def test_calculate_trig_degrees(self):
        result = self.engine.calculate("sin(30)")
        self.assertAlmostEqual(result, 0.5, places=5)

    def test_calculate_trig_radians(self):
        result = self.engine.calculate("sin(pi/6)", angle_mode="radians")
        self.assertAlmostEqual(result, 0.5, places=5)

    def test_calculate_log(self):
        result = self.engine.calculate("log(100)")
        self.assertAlmostEqual(result, 2.0, places=5)

    def test_calculate_ln(self):
        result = self.engine.calculate("ln(e)")
        self.assertAlmostEqual(result, 1.0, places=5)

    def test_calculate_sqrt(self):
        result = self.engine.calculate("sqrt(16)")
        self.assertEqual(result, 4.0)

    def test_calculate_invalid(self):
        result = self.engine.calculate("invalid")
        self.assertIsInstance(result, str)
        self.assertTrue(result.startswith("Error:"))

    def test_get_function_list(self):
        funcs = self.engine.get_function_list()
        self.assertIn("sin", funcs)
        self.assertIn("cos", funcs)
        self.assertIn("tan", funcs)
        self.assertIn("log", funcs)
        self.assertIn("sqrt", funcs)
        self.assertIn("pi", funcs)
        self.assertIn("e", funcs)
        self.assertIn("factorial", funcs)
