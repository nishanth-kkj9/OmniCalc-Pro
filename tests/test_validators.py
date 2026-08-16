import unittest
from utils.validators import is_valid_number, sanitize_expression


class TestValidators(unittest.TestCase):
    def test_is_valid_number_valid(self):
        self.assertTrue(is_valid_number("123"))
        self.assertTrue(is_valid_number("-45.67"))
        self.assertTrue(is_valid_number("1e-5"))
        self.assertTrue(is_valid_number("0"))
        self.assertTrue(is_valid_number("3.14"))

    def test_is_valid_number_invalid(self):
        self.assertFalse(is_valid_number("abc"))
        self.assertFalse(is_valid_number("12a"))
        self.assertFalse(is_valid_number(""))
        self.assertFalse(is_valid_number("1+2"))

    def test_sanitize_expression_valid(self):
        self.assertTrue(sanitize_expression("1+2"))
        self.assertTrue(sanitize_expression("3.14*2"))
        self.assertTrue(sanitize_expression("(10+5)/3"))
        self.assertTrue(sanitize_expression("sin(30)"))

    def test_sanitize_expression_invalid(self):
        self.assertFalse(sanitize_expression("1+2; drop table"))
        self.assertFalse(sanitize_expression("import os"))
        self.assertFalse(sanitize_expression(""))

    def test_sanitize_expression_complex(self):
        self.assertTrue(sanitize_expression("cos(pi) + sqrt(16)"))
        self.assertTrue(sanitize_expression("ln(e) * tan(45)"))
