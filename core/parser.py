"""Expression parser - re-exports from SafeEvaluator for backward compatibility."""
from core.safe_evaluator import _default_evaluator as _evaluator


class MathParser:
    @staticmethod
    def parse_expression(expr):
        return _evaluator.parse_expression(expr)

    @staticmethod
    def to_latex(expr):
        return _evaluator.to_latex(expr)

    @staticmethod
    def solve_for_variable(expr, variable='x'):
        return _evaluator.solve(expr, variable)
