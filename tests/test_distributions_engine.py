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
        val_high = DistributionsEngine.normal_cdf(1.95996, 0.0, 1.0)
        self.assertAlmostEqual(val_high, 0.975, places=3)

    def test_normal_moments(self):
        m = DistributionsEngine.get_moments("normal", {"mean": 10.0, "std": 2.0})
        self.assertEqual(m["mean"], 10.0)
        self.assertEqual(m["variance"], 4.0)
        self.assertEqual(m["std_dev"], 2.0)
        self.assertEqual(m["skewness"], 0.0)
        self.assertEqual(m["kurtosis"], 0.0)  # Excess kurtosis

    def test_student_t_distribution(self):
        m = DistributionsEngine.get_moments("student_t", {"df": 10.0})
        self.assertEqual(m["mean"], 0.0)
        self.assertEqual(m["variance"], 1.25)
        self.assertAlmostEqual(m["std_dev"], math.sqrt(1.25), places=5)
        self.assertEqual(m["skewness"], 0.0)
        self.assertEqual(m["kurtosis"], 1.0)  # 6 / (10 - 4) = 1.0

    def test_chi_square_distribution(self):
        m = DistributionsEngine.get_moments("chi_square", {"df": 5.0})
        self.assertEqual(m["mean"], 5.0)
        self.assertEqual(m["variance"], 10.0)
        self.assertAlmostEqual(m["skewness"], math.sqrt(8.0 / 5.0), places=5)
        self.assertEqual(m["kurtosis"], 2.4)  # 12 / 5 = 2.4

    def test_binomial_distribution(self):
        val = DistributionsEngine.binomial_pmf(3, 5, 0.5)
        self.assertAlmostEqual(val, 0.3125, places=4)

        m = DistributionsEngine.get_moments("binomial", {"n": 10, "p": 0.5})
        self.assertEqual(m["mean"], 5.0)
        self.assertEqual(m["variance"], 2.5)
        self.assertEqual(m["skewness"], 0.0)
        self.assertAlmostEqual(m["kurtosis"], -0.2, places=5)  # (1 - 6*0.25)/2.5 = -0.2

    def test_poisson_distribution(self):
        val = DistributionsEngine.poisson_pmf(2, 2.0)
        expected = 2.0 * math.exp(-2.0)
        self.assertAlmostEqual(val, expected, places=4)

        m = DistributionsEngine.get_moments("poisson", {"lambda": 4.0})
        self.assertEqual(m["mean"], 4.0)
        self.assertEqual(m["variance"], 4.0)
        self.assertEqual(m["skewness"], 0.5)
        self.assertEqual(m["kurtosis"], 0.25)

    def test_exponential_distribution(self):
        pdf_val = DistributionsEngine.exponential_pdf(1.0, rate=2.0)
        self.assertAlmostEqual(pdf_val, 2.0 * math.exp(-2.0), places=5)

        cdf_val = DistributionsEngine.exponential_cdf(1.0, rate=2.0)
        self.assertAlmostEqual(cdf_val, 1.0 - math.exp(-2.0), places=5)

        m = DistributionsEngine.get_moments("exponential", {"rate": 2.0})
        self.assertEqual(m["mean"], 0.5)
        self.assertEqual(m["variance"], 0.25)
        self.assertEqual(m["skewness"], 2.0)
        self.assertEqual(m["kurtosis"], 6.0)

    def test_bernoulli_distribution(self):
        self.assertEqual(DistributionsEngine.bernoulli_pmf(1, 0.3), 0.3)
        self.assertEqual(DistributionsEngine.bernoulli_pmf(0, 0.3), 0.7)

        m = DistributionsEngine.get_moments("bernoulli", {"p": 0.3})
        self.assertAlmostEqual(m["mean"], 0.3, places=5)
        self.assertAlmostEqual(m["variance"], 0.21, places=5)
        self.assertAlmostEqual(m["skewness"], 0.4 / math.sqrt(0.21), places=5)
        self.assertAlmostEqual(m["kurtosis"], (1.0 - 6.0 * 0.21) / 0.21, places=5)

    def test_geometric_distribution(self):
        self.assertEqual(DistributionsEngine.geometric_pmf(1, 0.5), 0.5)
        self.assertEqual(DistributionsEngine.geometric_pmf(2, 0.5), 0.25)

        m = DistributionsEngine.get_moments("geometric", {"p": 0.5})
        self.assertEqual(m["mean"], 2.0)
        self.assertEqual(m["variance"], 2.0)
        self.assertAlmostEqual(m["skewness"], 1.5 / math.sqrt(0.5), places=5)
        self.assertEqual(m["kurtosis"], 6.5)  # 6 + 0.25 / 0.5 = 6.5

    def test_uniform_distribution(self):
        self.assertEqual(DistributionsEngine.uniform_pdf(5.0, 0.0, 10.0), 0.1)
        self.assertEqual(DistributionsEngine.uniform_cdf(5.0, 0.0, 10.0), 0.5)

        m = DistributionsEngine.get_moments("uniform", {"a": 0.0, "b": 10.0})
        self.assertEqual(m["mean"], 5.0)
        self.assertAlmostEqual(m["variance"], 100.0 / 12.0, places=5)
        self.assertEqual(m["skewness"], 0.0)
        self.assertEqual(m["kurtosis"], -1.2)

    def test_invalid_std(self):
        with self.assertRaises(ValueError):
            DistributionsEngine.normal_pdf(0.0, 0.0, -1.0)


if __name__ == "__main__":
    unittest.main()

