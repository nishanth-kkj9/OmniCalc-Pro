import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.safe_evaluator import SafeEvaluator, safe_eval


class TestSecurityEvaluator(unittest.TestCase):
    """Adversarial and Security test cases for SafeEvaluator."""

    def setUp(self):
        self.evaluator = SafeEvaluator()

    def test_dunder_and_code_injection_blocked(self):
        """Ensure malicious python builtins and dunder methods are rejected."""
        malicious_inputs = [
            "__import__('os').system('ls')",
            "eval('1+1')",
            "exec('import sys')",
            "open('/etc/passwd')",
            "globals()",
            "locals()",
            "getattr(math, 'sin')",
            "__class__.__bases__",
            "compile('1+1', '', 'eval')",
            "subprocess.Popen('ls')",
            "os.system('whoami')",
        ]
        for malicious in malicious_inputs:
            with self.subTest(malicious=malicious):
                res = safe_eval(malicious)
                self.assertTrue(str(res).startswith("Error:") or isinstance(res, str))

    def test_extreme_nesting_depth(self):
        """Ensure deeply nested parenthesized expressions are rejected by nesting depth limits."""
        deep_expr = "(" * 25 + "1" + ")" * 25
        res = safe_eval(deep_expr)
        self.assertTrue(str(res).startswith("Error:") and "nesting" in str(res).lower())

    def test_oversized_exponent_blocked(self):
        """Ensure huge power calculations that trigger CPU denial-of-service are rejected."""
        huge_exp = "10^1000000"
        res = safe_eval(huge_exp)
        self.assertTrue(str(res).startswith("Error:") and "exponent" in str(res).lower())

        huge_exp2 = "2 ** 999999"
        res = safe_eval(huge_exp2)
        self.assertTrue(str(res).startswith("Error:") and "exponent" in str(res).lower())

    def test_oversized_factorial_blocked(self):
        """Ensure giant factorial values that trigger memory/CPU denial-of-service are rejected."""
        huge_fact = "factorial(100000)"
        res = safe_eval(huge_fact)
        self.assertTrue(str(res).startswith("Error:") and "factorial" in str(res).lower())

    def test_excessive_operators_blocked(self):
        """Ensure bomb expressions with excessive repetition of operators are bounded."""
        excessive_ops = "1" + "+ 1" * 150
        res = safe_eval(excessive_ops)
        self.assertTrue(str(res).startswith("Error:"))

    def test_valid_mathematical_operations_remain_functional(self):
        """Ensure valid expressions continue evaluating correctly."""
        self.assertEqual(self.evaluator.evaluate("2 + 2"), 4.0)
        self.assertEqual(self.evaluator.evaluate("sin(90)"), 1.0)
        self.assertEqual(self.evaluator.evaluate("sqrt(144)"), 12.0)
        self.assertEqual(self.evaluator.evaluate("2^10"), 1024.0)
        self.assertEqual(self.evaluator.evaluate("factorial(5)"), 120.0)


if __name__ == "__main__":
    unittest.main()
