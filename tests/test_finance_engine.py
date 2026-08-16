import unittest
from core.finance_engine import FinanceEngine


class TestFinanceEngine(unittest.TestCase):
    def setUp(self):
        self.engine = FinanceEngine()

    def test_emi(self):
        emi, total, interest = self.engine.emi(100000, 12, 12)
        self.assertAlmostEqual(emi, 8884.88, places=2)
        self.assertAlmostEqual(total, 106618.56, places=1)
        self.assertAlmostEqual(interest, 6618.56, places=1)

    def test_emi_zero_rate(self):
        emi, total, interest = self.engine.emi(10000, 0, 12)
        self.assertAlmostEqual(emi, 833.33, places=2)
        self.assertAlmostEqual(total, 10000.0, places=2)
        self.assertAlmostEqual(interest, 0.0, places=2)

    def test_compound_interest(self):
        amount, interest = self.engine.compound_interest(1000, 10, 1, 3)
        self.assertAlmostEqual(amount, 1331.0, places=2)
        self.assertAlmostEqual(interest, 331.0, places=2)

    def test_compound_interest_monthly(self):
        amount, interest = self.engine.compound_interest(1000, 12, 12, 1)
        self.assertAlmostEqual(amount, 1126.83, places=2)
        self.assertAlmostEqual(interest, 126.83, places=2)

    def test_gst_inclusive(self):
        original, tax = self.engine.gst(118, 18, inclusive=True)
        self.assertAlmostEqual(original, 100.0, places=2)
        self.assertAlmostEqual(tax, 18.0, places=2)

    def test_gst_exclusive(self):
        base, tax, total = self.engine.gst(100, 18, inclusive=False)
        self.assertEqual(base, 100)
        self.assertAlmostEqual(tax, 18.0, places=2)
        self.assertAlmostEqual(total, 118.0, places=2)

    def test_discount(self):
        saved, final = self.engine.discount(200, 25)
        self.assertAlmostEqual(saved, 50.0, places=2)
        self.assertAlmostEqual(final, 150.0, places=2)

    def test_discount_zero_percent(self):
        saved, final = self.engine.discount(100, 0)
        self.assertAlmostEqual(saved, 0.0, places=2)
        self.assertAlmostEqual(final, 100.0, places=2)
