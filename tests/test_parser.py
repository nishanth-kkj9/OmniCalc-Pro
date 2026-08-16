import unittest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.parser import MathParser
import sympy as sp

class TestMathParser(unittest.TestCase):

    def test_parse_valid_expression(self):
        # Test a simple valid expression
        expr_str = "2 + 3 * x"
        parsed_expr = MathParser.parse_expression(expr_str)
        self.assertEqual(str(parsed_expr), "3*x + 2")

        # Test an expression with exponentiation
        expr_str = "x^2 + 1"
        parsed_expr = MathParser.parse_expression(expr_str)
        self.assertEqual(str(parsed_expr), "x**2 + 1")

        # Test a more complex expression
        expr_str = "sin(x) + cos(y)"
        parsed_expr = MathParser.parse_expression(expr_str)
        self.assertEqual(str(parsed_expr), "sin(x) + cos(y)")

    def test_parse_invalid_expression(self):
        # Test an expression with a syntax error
        expr_str = "2 + +"
        with self.assertRaises(ValueError) as cm:
            MathParser.parse_expression(expr_str)
        self.assertIn("Error parsing expression", str(cm.exception))

        # Test an expression with invalid syntax
        expr_str = "2 + * 3"
        with self.assertRaises(ValueError) as cm:
            MathParser.parse_expression(expr_str)
        self.assertIn("Error parsing expression", str(cm.exception))

    def test_to_latex(self):
        expr_str = "x^2 + 2*x + 1"
        parsed_expr = MathParser.parse_expression(expr_str)
        latex_str = MathParser.to_latex(parsed_expr)
        self.assertEqual(latex_str, 'x^{2} + 2 x + 1')

    def test_solve_for_variable(self):
        # Test solving a simple equation
        expr_str = "x + 5"
        solution = MathParser.solve_for_variable(expr_str, 'x')
        self.assertEqual(str(solution), "[-5]")

        # Test solving a quadratic equation
        expr_str = "x^2 - 4"
        solution = MathParser.solve_for_variable(expr_str, 'x')
        # Sympy can return solutions in different orders, so check for presence of both
        self.assertIn(sp.Integer(-2), solution)
        self.assertIn(sp.Integer(2), solution)
        self.assertEqual(len(solution), 2)

if __name__ == '__main__':
    unittest.main()
