import unittest
from core.sequences_engine import SequencesEngine


class TestSequencesEngine(unittest.TestCase):
    def test_arithmetic(self):
        # a1=2, d=3, 4 terms: 2, 5, 8, 11 -> sum = 26
        terms = SequencesEngine.arithmetic(2.0, 3.0, 4)
        self.assertEqual(len(terms), 4)
        self.assertEqual(terms[-1]["an"], 11.0)
        self.assertEqual(terms[-1]["Sn"], 26.0)

    def test_geometric(self):
        # a1=3, r=2, 3 terms: 3, 6, 12 -> sum = 21
        terms = SequencesEngine.geometric(3.0, 2.0, 3)
        self.assertEqual(len(terms), 3)
        self.assertEqual(terms[-1]["an"], 12.0)
        self.assertEqual(terms[-1]["Sn"], 21.0)

    def test_fibonacci(self):
        terms = SequencesEngine.fibonacci(7)
        self.assertEqual(len(terms), 7)
        self.assertEqual(terms[-1]["an"], 13.0)  # 1, 1, 2, 3, 5, 8, 13


if __name__ == "__main__":
    unittest.main()
