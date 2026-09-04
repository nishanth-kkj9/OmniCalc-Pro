import unittest
from core.units_engine import UnitsEngine


class TestUnitsEngine(unittest.TestCase):
    def test_unit_conversion(self):
        res = UnitsEngine.convert_unit(100.0, "km", "mi")
        self.assertAlmostEqual(res["value"], 62.137119, places=3)
        self.assertEqual(res["dimension_name"], "Length / Distance")

    def test_temperature_conversion(self):
        res = UnitsEngine.convert_unit(100.0, "degC", "degF")
        self.assertAlmostEqual(res["value"], 212.0, places=3)

    def test_dimensional_mismatch(self):
        with self.assertRaises(ValueError):
            UnitsEngine.convert_unit(10.0, "km", "kg")

    def test_compound_units(self):
        # 50 N * 10 m -> 500 Joules (Energy)
        res = UnitsEngine.evaluate_compound_unit(50.0, "N", "*", 10.0, "m")
        self.assertIn("Energy", res["dimension_name"])
        self.assertEqual(res["result_base_val"], 500.0)

    def test_physics_formula(self):
        res = UnitsEngine.solve_physics_formula("newton_f_ma", {"m": 10.0, "a": 9.80665})
        self.assertAlmostEqual(res["result_value"], 98.0665, places=4)


if __name__ == "__main__":
    unittest.main()
