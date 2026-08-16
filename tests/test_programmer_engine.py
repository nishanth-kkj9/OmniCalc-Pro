import unittest
from core.programmer_engine import ProgrammerEngine


class TestProgrammerEngine(unittest.TestCase):
    def setUp(self):
        self.engine = ProgrammerEngine()

    def test_to_bin(self):
        result = self.engine.to_base(10, "BIN")
        self.assertEqual(result, "0b1010")

    def test_to_hex(self):
        result = self.engine.to_base(255, "HEX")
        self.assertEqual(result, "0xff")

    def test_to_oct(self):
        result = self.engine.to_base(8, "OCT")
        self.assertEqual(result, "0o10")

    def test_to_dec(self):
        result = self.engine.to_base(42, "DEC")
        self.assertEqual(result, "42")

    def test_to_base_invalid(self):
        result = self.engine.to_base("abc", "BIN")
        self.assertEqual(result, "Invalid")

    def test_bitwise_and(self):
        result = self.engine.bitwise(5, 3, "AND")
        self.assertEqual(result, 1)

    def test_bitwise_or(self):
        result = self.engine.bitwise(5, 3, "OR")
        self.assertEqual(result, 7)

    def test_bitwise_xor(self):
        result = self.engine.bitwise(5, 3, "XOR")
        self.assertEqual(result, 6)

    def test_bitwise_not(self):
        result = self.engine.bitwise(5, 0, "NOT")
        self.assertEqual(result, -6)

    def test_bitwise_unknown_op(self):
        result = self.engine.bitwise(5, 3, "NAND")
        self.assertEqual(result, 0)

    def test_shift_left(self):
        result = self.engine.shift(4, 2, "L")
        self.assertEqual(result, 16)

    def test_shift_right(self):
        result = self.engine.shift(16, 2, "R")
        self.assertEqual(result, 4)

    def test_shift_invalid(self):
        result = self.engine.shift("abc", 2, "L")
        self.assertEqual(result, "Error")

    def test_bitwise_invalid(self):
        result = self.engine.bitwise("abc", 3, "AND")
        self.assertEqual(result, "Error")
