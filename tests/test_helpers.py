import unittest
import json
import os
import tempfile
from unittest.mock import patch
from utils.helpers import load_config, save_config, safe_eval


class TestHelpers(unittest.TestCase):
    def setUp(self):
        self.config_dir = tempfile.mkdtemp()

    def test_safe_eval_basic(self):
        result = safe_eval("2 + 3")
        self.assertEqual(result, 5.0)

    def test_safe_eval_complex(self):
        result = safe_eval("sin(30)")
        self.assertAlmostEqual(result, 0.5, places=5)

    def test_safe_eval_invalid(self):
        result = safe_eval("invalid")
        self.assertIsInstance(result, str)
        self.assertTrue(result.startswith("Error:"))

    def test_safe_eval_radian_mode(self):
        result = safe_eval("sin(pi/6)", mode="radians")
        self.assertAlmostEqual(result, 0.5, places=5)

    def test_load_config_not_found(self):
        with patch('utils.helpers.CONFIG_PATH', os.path.join(self.config_dir, 'nonexistent.json')):
            result = load_config()
            self.assertEqual(result["theme"], "dark")
            self.assertEqual(result["font_size"], 14)
            self.assertEqual(result["angle_mode"], "degrees")

    def test_save_and_load_config(self):
        config_path = os.path.join(self.config_dir, 'config.json')
        test_cfg = {"theme": "light", "font_size": 16, "angle_mode": "radians"}
        with patch('utils.helpers.CONFIG_PATH', config_path):
            save_config(test_cfg)
            self.assertTrue(os.path.exists(config_path))
            loaded = load_config()
            self.assertEqual(loaded, test_cfg)
