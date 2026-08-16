import unittest
from core.safe_evaluator import SafeEvaluator


class TestSafeEvaluatorTimeoutDepth(unittest.TestCase):
    def test_nesting_depth_limit(self):
        ev = SafeEvaluator(max_length=10000)
        ev.max_nesting = 3
        deep = "((((1+2))))"
        result = ev.evaluate_safe(deep)
        self.assertIsInstance(result, str)
        self.assertIn("nesting", result)

    def test_nesting_within_limit(self):
        ev = SafeEvaluator()
        ev.max_nesting = 10
        result = ev.evaluate("(1+(2+3))")
        self.assertEqual(result, 6.0)

    def test_timeout_does_not_block(self):
        ev = SafeEvaluator()
        ev.max_time = 30
        result = ev.evaluate("2+2")
        self.assertEqual(result, 4.0)

    def test_parse_expression(self):
        ev = SafeEvaluator()
        result = ev.parse_expression("x**2 + 1")
        from sympy import Basic
        self.assertIsInstance(result, Basic)

    def test_to_latex(self):
        ev = SafeEvaluator()
        expr = ev.parse_expression("x**2")
        latex = ev.to_latex(expr)
        self.assertIn("x", latex)

    def test_solve(self):
        ev = SafeEvaluator()
        solutions = ev.solve("x**2 - 4", "x")
        self.assertEqual(len(solutions), 2)
        self.assertIn(-2, solutions)
        self.assertIn(2, solutions)


class TestParserBackwardCompat(unittest.TestCase):
    def test_math_parser_static(self):
        from core.parser import MathParser
        result = MathParser.parse_expression("2+2")
        from sympy import Basic
        self.assertIsInstance(result, Basic)

    def test_math_parser_to_latex(self):
        from core.parser import MathParser
        expr = MathParser.parse_expression("x**2")
        latex = MathParser.to_latex(expr)
        self.assertIn("x", latex)

    def test_math_parser_solve(self):
        from core.parser import MathParser
        solutions = MathParser.solve_for_variable("x**2 - 4", "x")
        self.assertIn(2, solutions)
        self.assertIn(-2, solutions)
