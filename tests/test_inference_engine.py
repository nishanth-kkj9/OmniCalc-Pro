"""
Tests for Statistical Inference Engine in Python Desktop Suite (Standard unittest).
"""

import unittest
import math
from core.inference_engine import (
    one_sample_z_test,
    one_sample_t_test,
    two_sample_t_test,
    paired_t_test,
    one_sample_proportion_test,
    two_sample_proportions_test,
    chi_square_gof_test,
    chi_square_independence_test,
    one_way_anova,
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

    def test_paired_t_test(self):
        res = paired_t_test(
            mean_diff=2.5,
            std_diff=1.2,
            sample_size=15,
            hypothesized_diff=0.0,
            alpha=0.05,
        )
        self.assertEqual(res["test_name"], "Paired Samples t-Test")
        self.assertLess(res["p_value"], 0.001)
        self.assertTrue(res["reject_null"])

    def test_one_sample_proportion_test(self):
        res = one_sample_proportion_test(
            successes=60,
            trials=100,
            hypothesized_p=0.5,
            alpha=0.05,
        )
        self.assertAlmostEqual(res["sample_p"], 0.6, places=4)
        self.assertAlmostEqual(res["statistic"], 2.0, places=3)  # z = (0.6 - 0.5) / 0.05 = 2.0
        self.assertAlmostEqual(res["p_value"], 0.0455, places=2)
        self.assertTrue(res["reject_null"])

    def test_two_sample_proportions_test(self):
        res = two_sample_proportions_test(
            x1=60, n1=100,
            x2=40, n2=100,
            alpha=0.05,
        )
        self.assertAlmostEqual(res["p1"], 0.6, places=4)
        self.assertAlmostEqual(res["p2"], 0.4, places=4)
        self.assertLess(res["p_value"], 0.01)
        self.assertTrue(res["reject_null"])

    def test_chi_square_gof_test(self):
        observed = [25, 30, 20, 25]
        expected = [25, 25, 25, 25]
        res = chi_square_gof_test(observed, expected)
        self.assertEqual(res["df"], 3)
        self.assertAlmostEqual(res["statistic"], 2.0, places=3)
        self.assertFalse(res["reject_null"])

    def test_chi_square_independence_test(self):
        table = [
            [20, 30],
            [30, 10],
        ]
        res = chi_square_independence_test(table)
        self.assertEqual(res["df"], 1)
        self.assertGreater(res["statistic"], 5.0)
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

