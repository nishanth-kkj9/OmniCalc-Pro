import unittest
from core.converter_engine import ConverterEngine


class TestConverterEngine(unittest.TestCase):
    def setUp(self):
        self.engine = ConverterEngine()

    def test_length_conversion(self):
        result = self.engine.convert(1, "m", "km", "Length")
        self.assertAlmostEqual(result, 0.001)

    def test_length_conversion_inverse(self):
        result = self.engine.convert(1, "km", "m", "Length")
        self.assertAlmostEqual(result, 1000.0)

    def test_weight_conversion(self):
        result = self.engine.convert(1, "kg", "g", "Weight")
        self.assertAlmostEqual(result, 1000.0)

    def test_time_conversion(self):
        result = self.engine.convert(1, "h", "min", "Time")
        self.assertAlmostEqual(result, 60.0)

    def test_temperature_c_to_f(self):
        result = self.engine.convert(0, "C", "F", "Temperature")
        self.assertAlmostEqual(result, 32.0)

    def test_temperature_f_to_c(self):
        result = self.engine.convert(32, "F", "C", "Temperature")
        self.assertAlmostEqual(result, 0.0)

    def test_temperature_k_to_c(self):
        result = self.engine.convert(273.15, "K", "C", "Temperature")
        self.assertAlmostEqual(result, 0.0)

    def test_temperature_c_to_k(self):
        result = self.engine.convert(0, "C", "K", "Temperature")
        self.assertAlmostEqual(result, 273.15)

    def test_speed_conversion(self):
        result = self.engine.convert(1, "m/s", "km/h", "Speed")
        self.assertAlmostEqual(result, 3.6, places=4)

    def test_storage_conversion(self):
        result = self.engine.convert(1, "GB", "MB", "Storage")
        self.assertAlmostEqual(result, 1024.0)

    def test_invalid_category(self):
        result = self.engine.convert(1, "m", "km", "Invalid")
        self.assertEqual(result, 0)

    def test_categories_list(self):
        cats = self.engine.CATEGORIES
        self.assertIn("Length", cats)
        self.assertIn("Weight", cats)
        self.assertIn("Time", cats)
        self.assertIn("Temperature", cats)
        self.assertIn("Speed", cats)
        self.assertIn("Storage", cats)
