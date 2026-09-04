import unittest
import math
from core.distributions_engine import DistributionsEngine


class TestDistributionsEngine(unittest.TestCase):
    def test_normal_pdf_peak(self):
        val = DistributionsEngine.normal_pdf(0.0, 0.0, 1.0)
        expected = 1.0 / math.sqrt(2 * math.pi)
        self.assertAlmostEqual(val, expected, places=5)

    def test_normal_cdf_bounds(self):
        val_0 = DistributionsEngine.normal_cdf(0.0, 0.0, 1.0)
        self.assertAlmostEqual(val_0, 0.5, places=5)
        val_high = DistributionsEngine.normal_cdf(3.0, 0.0, 1.0)
        self.assertAlmostEqual(val_high, 0.99865, places=4)

    def test_binomial_pmf(self):
        # 3 heads in 5 fair coin flips: C(5,3)*(0.5)^5 = 10 / 32 = 0.3125
        val = DistributionsEngine.binomial_pmf(3, 5, 0.5)
        self.assertAlmostEqual(val, 0.3125, places=4)

    def test_poisson_pmf(self):
        # P(X=2) for lambda=2: (e^-2 * 2^2)/2 = 2 * e^-2 ~ 0.27067
        val = DistributionsEngine.poisson_pmf(2, 2.0)
        expected = 2.0 * math.exp(-2.0)
        self.assertAlmostEqual(val, expected, places=4)

    def test_invalid_std(self):
        with self.assertRaises(ValueError):
            DistributionsEngine.normal_pdf(0.0, 0.0, -1.0)


if __name__ == "__main__":
    unittest.main()
