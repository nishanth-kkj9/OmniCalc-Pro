import unittest
import json
import os
import math
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.safe_evaluator import SafeEvaluator


class TestMathSpecificationVectors(unittest.TestCase):
    """Verifies that mathematical expressions match cross-platform specification test vectors."""

    def setUp(self):
        self.evaluator = SafeEvaluator()
        self.spec_dir = os.path.join(os.path.dirname(__file__), "math-spec")

    def _run_spec_file(self, filename: str):
        filepath = os.path.join(self.spec_dir, filename)
        if not os.path.exists(filepath):
            self.skipTest(f"Spec file {filename} not found")
        with open(filepath, "r", encoding="utf-8") as f:
            cases = json.load(f)

        for case in cases:
            with self.subTest(case=case["name"], expr=case["expr"]):
                mode = case.get("angle_mode", "degrees")
                self.evaluator.set_angle_mode(mode)
                result = self.evaluator.evaluate(case["expr"])
                expected = case["expected"]
                self.assertAlmostEqual(result, expected, places=4)

    def test_arithmetic_spec(self):
        self._run_spec_file("arithmetic.json")

    def test_trigonometry_spec(self):
        self._run_spec_file("trigonometry.json")


if __name__ == "__main__":
    unittest.main()
