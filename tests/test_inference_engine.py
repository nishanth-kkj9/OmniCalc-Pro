"""
Tests for Statistical Inference Engine in Python Desktop Suite (Standard unittest).
"""

import unittest
import math
from core.inference_engine import (
    one_sample_z_test,
    one_sample_t_test,
    two_sample_t_test,
    one_way_anova,
    f_distribution_p_value,
)


class TestInferenceEngine(unittest.TestCase):
    def test_one_sample_z_test(self):
        res = one_sample_z_test(
            sample_mean=105.0,
            sample_size=36,
            pop_std_dev=15.0,
            hypothesized_mean=100.0,
            alpha=0.05,
            alternative="two-sided",
        )
        self.assertAlmostEqual(res["statistic"], 2.0, places=3)
        self.assertAlmostEqual(res["p_value"], 0.0455, places=2)
        self.assertTrue(res["reject_null"])

    def test_one_sample_t_test(self):
        res = one_sample_t_test(
            sample_mean=15.2,
            sample_std_dev=2.1,
            sample_size=16,
            hypothesized_mean=14.0,
            alpha=0.05,
        )
        self.assertEqual(res["df"], 15)
        self.assertLess(res["p_value"], 0.05)
        self.assertTrue(res["reject_null"])

    def test_two_sample_t_test(self):
        res = two_sample_t_test(
            mean1=25.4,
            std_dev1=3.2,
            n1=20,
            mean2=22.1,
            std_dev2=4.5,
            n2=22,
            equal_variances=False,
        )
        self.assertGreater(res["statistic"], 0)
        self.assertLess(res["p_value"], 0.05)
        self.assertTrue(res["reject_null"])

    def test_one_way_anova(self):
        groups = [
            [82.0, 85.0, 87.0, 86.0, 88.0],
            [75.0, 78.0, 77.0, 80.0, 79.0],
            [91.0, 93.0, 90.0, 92.0, 94.0],
        ]
        res = one_way_anova(groups, alpha=0.05)
        self.assertGreater(res["statistic"], 10.0)
        self.assertLess(res["p_value"], 0.001)
        self.assertTrue(res["reject_null"])
        self.assertGreater(res["eta_squared"], 0.5)


if __name__ == "__main__":
    unittest.main()
