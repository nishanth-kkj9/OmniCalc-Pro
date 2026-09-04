import unittest
from core.fractions_engine import FractionsEngine


class TestFractionsEngine(unittest.TestCase):
    def test_simplify(self):
        res = FractionsEngine.simplify_fraction(12, 16)
        self.assertEqual(res["simplified_str"], "3 / 4")
        self.assertEqual(res["gcd"], 4)

    def test_arithmetic(self):
        res = FractionsEngine.evaluate_binary_op(3, 4, "+", 2, 5)
        self.assertEqual(res["simplified_str"], "23 / 20")
        self.assertEqual(res["mixed_str"], "1 3/20")

    def test_gcd_lcm(self):
        res = FractionsEngine.gcd_lcm_list([48, 180, 24])
        self.assertEqual(res["gcd"], 12)
        self.assertEqual(res["lcm"], 720)

    def test_prime_factorization(self):
        res = FractionsEngine.prime_factorization(360)
        self.assertFalse(res["is_prime"])
        self.assertEqual(res["latex_str"], "2^3 · 3^2 · 5")
        self.assertEqual(res["divisor_count"], 24)


if __name__ == "__main__":
    unittest.main()
