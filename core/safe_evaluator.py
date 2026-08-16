"""
Safe Expression Evaluator - AST-based, no eval().

Uses sympy's parser with restricted transformations for secure mathematical evaluation.
No code execution possible - only mathematical expressions.
"""
import math
import re
import signal
import threading
from typing import Any

import sympy as sp
from sympy import SympifyError, Basic
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
    convert_xor,
)

from utils.logger import get_logger
from utils.constants import MAX_EXPR_LENGTH, MAX_RESULT_DIGITS, MAX_EXECUTION_TIME, MAX_NESTING_DEPTH

logger = get_logger()

SAFE_FUNCTIONS = {
    "sin", "cos", "tan", "asin", "acos", "atan",
    "sinh", "cosh", "tanh", "asinh", "acosh", "atanh",
    "log", "ln", "log10", "log2", "sqrt", "cbrt",
    "exp", "expm1", "degrees", "radians",
    "floor", "ceil", "trunc", "round",
    "abs", "factorial", "gamma",
    "pi", "e", "tau", "inf", "nan",
}

SAFE_CONSTANTS = {
    "pi": math.pi,
    "e": math.e,
    "tau": math.tau,
    "inf": float("inf"),
    "nan": float("nan"),
}

DEGREE_FUNCTIONS = {
    "sin": lambda x: math.sin(math.radians(x)),
    "cos": lambda x: math.cos(math.radians(x)),
    "tan": lambda x: math.tan(math.radians(x)),
    "asin": lambda x: math.degrees(math.asin(x)),
    "acos": lambda x: math.degrees(math.acos(x)),
    "atan": lambda x: math.degrees(math.atan(x)),
}

RADIAN_FUNCTIONS = {
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "asin": math.asin,
    "acos": math.acos,
    "atan": math.atan,
    "sinh": math.sinh,
    "cosh": math.cosh,
    "tanh": math.tanh,
    "asinh": math.asinh,
    "acosh": math.acosh,
    "atanh": math.atanh,
    "log": math.log10,
    "ln": math.log,
    "log10": math.log10,
    "log2": math.log2,
    "sqrt": math.sqrt,
    "cbrt": lambda x: x ** (1/3),
    "exp": math.exp,
    "expm1": math.expm1,
    "degrees": math.degrees,
    "radians": math.radians,
    "floor": math.floor,
    "ceil": math.ceil,
    "trunc": math.trunc,
    "round": round,
    "abs": abs,
    "factorial": math.factorial,
    "gamma": math.gamma,
}

# Remove function_exponentiation as it splits function names incorrectly
TRANSFORMATIONS = (
    standard_transformations
    + (implicit_multiplication_application,)
    + (convert_xor,)
)

_UNICODE_MAP = {
    "×": "*", "÷": "/", "−": "-", "–": "-",
    "·": "*", "·": "*", "√": "sqrt(",
    "π": "pi", "τ": "tau", "∞": "inf",
    "²": "**2", "³": "**3", "ⁿ": "**",
    "±": "+-", "∓": "-+",
    "≤": "<=", "≥": ">=", "≠": "!=",
    "≈": "~", "≡": "==",
}

_NUMBER_RE = re.compile(r"\b(\d+)(\.\d*)?\b")

# Known function names to protect from implicit multiplication splitting
_PROTECTED_FUNCTIONS = set(SAFE_FUNCTIONS) | {"factorial"}


class SafeEvaluator:
    """Thread-safe mathematical expression evaluator."""

    def __init__(self, angle_mode: str = "degrees", max_length: int = MAX_EXPR_LENGTH):
        self.angle_mode = angle_mode
        self.max_length = max_length
        self.max_time = MAX_EXECUTION_TIME
        self.max_nesting = MAX_NESTING_DEPTH
        self._namespace = self._build_namespace()
        self._timeout_thread = None
        self._timed_out = False

    def _build_namespace(self) -> dict:
        ns = dict(SAFE_CONSTANTS)
        if self.angle_mode == "degrees":
            ns.update(DEGREE_FUNCTIONS)
            ns.update({k: v for k, v in RADIAN_FUNCTIONS.items() if k not in DEGREE_FUNCTIONS})
        else:
            ns.update(RADIAN_FUNCTIONS)
        return ns

    def set_angle_mode(self, mode: str) -> None:
        if mode in ("degrees", "radians"):
            self.angle_mode = mode
            self._namespace = self._build_namespace()

    def _check_nesting_depth(self, expr: str) -> None:
        depth = 0
        max_d = 0
        for ch in expr:
            if ch == "(":
                depth += 1
                max_d = max(max_d, depth)
                if max_d > self.max_nesting:
                    raise ValueError(f"Expression nesting exceeds limit ({self.max_nesting})")
            elif ch == ")":
                depth -= 1

    def _normalize(self, expr: str) -> str:
        if len(expr) > self.max_length:
            raise ValueError(f"Expression too long (max {self.max_length} chars)")

        expr = expr.strip()
        if not expr:
            raise ValueError("Empty expression")

        # Handle √ before unicode replacement (needs closing paren)
        expr = re.sub(r"√\(([^()]*(?:\([^()]*\)[^()]*)*)\)", r"sqrt(\1)", expr)
        expr = re.sub(r"√(\d+\.?\d*)", r"sqrt(\1)", expr)
        expr = re.sub(r"√([a-zA-Zα-ωπτ]+)", r"sqrt(\1)", expr)

        for k, v in _UNICODE_MAP.items():
            if k == "√":
                continue
            expr = expr.replace(k, v)

        # 1. Protect scientific notation (e.g. 1e3) from implicit multiplication
        sci_placeholders = {}
        def _protect_sci(m):
            orig = m.group(0)
            key = f"__SCI_{len(sci_placeholders)}__"
            sci_placeholders[key] = orig
            return key
        expr = re.sub(r"\b(\d+(?:\.\d+)?)[eE]([+-]?\d+)\b", _protect_sci, expr)

        # 2. Protect function names from implicit multiplication splitting
        func_placeholders = {}
        for func in sorted(_PROTECTED_FUNCTIONS, key=len, reverse=True):
            placeholder = f"__FUNC_{func}__"
            func_placeholders[placeholder] = func
            pattern = re.compile(rf"\b{re.escape(func)}(?=[\(a-zA-Z0-9])")
            expr = pattern.sub(placeholder, expr)

        # 3. Apply implicit multiplication
        expr = re.sub(r"(\d)([a-zA-Z\(])", r"\1*\2", expr)
        expr = re.sub(r"(\))(?=[\d\(a-zA-Z])", r"\1*", expr)

        # 4. Restore function names
        for placeholder, func in func_placeholders.items():
            expr = expr.replace(placeholder, func)

        # 5. Restore scientific notation
        for key, orig in sci_placeholders.items():
            expr = expr.replace(key, orig)

        # 6. Cleanup: only collapse 3+ repeats (preserve **, ++, --, //)
        expr = re.sub(r"([+\-*/])\1\1+", r"\1\1", expr)
        expr = re.sub(r"\*\*+", "**", expr)

        return expr

    def _validate_ast(self, expr: str, allow_vars: bool = False) -> None:
        for token in re.findall(r'\b[a-zA-Z_]\w*\b', expr):
            if token in self._namespace:
                continue
            if token in SAFE_CONSTANTS:
                continue
            if allow_vars and len(token) == 1 and token.isalpha():
                continue
            raise ValueError(f"Unknown identifier: {token}")

    def _is_number_result(self, result: Any) -> bool:
        """Check if result is a number (sympy Number or Python numeric type)."""
        if isinstance(result, (int, float, complex)):
            return True
        if isinstance(result, Basic):
            return result.is_number
        return False

    def _convert_to_float(self, result: Any) -> float:
        """Convert result to float, handling both sympy and Python types."""
        if isinstance(result, (int, float)):
            return float(result)
        if isinstance(result, Basic):
            return float(result.evalf())
        if isinstance(result, complex):
            if result.imag == 0:
                return float(result.real)
        raise ValueError("Result is not a real number")

    def _prevalidate(self, expr: str, allow_vars: bool = False) -> str:
        """Run common pre-validation (length, nesting, identifiers). Returns normalized expression."""
        expr = self._normalize(expr)
        self._check_nesting_depth(expr)
        self._validate_ast(expr, allow_vars=allow_vars)
        return expr

    def evaluate(self, expr: str) -> float:
        _timer = None
        try:
            expr = self._prevalidate(expr)

            self._timed_out = False

            def _start_timer():
                t = threading.Timer(self.max_time, self._set_timeout)
                t.daemon = True
                t.start()
                return t

            if self.max_time > 0:
                _timer = _start_timer()

            result = parse_expr(expr, transformations=TRANSFORMATIONS, local_dict=self._namespace, evaluate=True)

            if self._timed_out:
                raise TimeoutError(f"Evaluation exceeded {self.max_time}s limit")

            if not self._is_number_result(result):
                raise ValueError("Result is not a number")

            val = self._convert_to_float(result)
            if math.isinf(val) or math.isnan(val):
                raise ValueError("Result is infinite or NaN")
            return val

        except SympifyError as e:
            logger.warning(f"Parse error: {expr} -> {e}")
            raise ValueError(f"Invalid expression: {e}")
        except TimeoutError as e:
            logger.warning(f"Timeout: {expr} -> {e}")
            raise ValueError(str(e))
        except (ZeroDivisionError, OverflowError) as e:
            logger.warning(f"Math error: {expr} -> {e}")
            raise ValueError("Math error: division by zero or overflow")
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Evaluation error: {expr} -> {e}")
            raise ValueError(f"Evaluation failed: {e}")
        finally:
            if _timer is not None:
                _timer.cancel()

    def evaluate_safe(self, expr: str) -> float | str:
        try:
            return self.evaluate(expr)
        except ValueError as e:
            return f"Error: {e}"

    # --- Consolidation from parser.py ---

    def parse_expression(self, expr: str):
        try:
            expr = self._prevalidate(expr.replace('^', '**'), allow_vars=True)
            return sp.sympify(expr, evaluate=False)
        except SympifyError as e:
            raise ValueError(f"Error parsing expression: {e}") from e
        except ValueError:
            raise
        except Exception as e:
            raise ValueError(f"Error parsing expression: {e}") from e

    def to_latex(self, expr) -> str:
        return sp.latex(expr)

    def solve(self, expr, variable: str = 'x'):
        try:
            expr = self._prevalidate(expr, allow_vars=True)
            x = sp.Symbol(variable)
            eq = sp.sympify(expr)
            return sp.solve(eq, x)
        except SympifyError as e:
            raise ValueError(f"Error solving expression: {e}") from e
        except ValueError:
            raise
        except Exception as e:
            raise ValueError(f"Error solving expression: {e}") from e

    def _set_timeout(self):
        self._timed_out = True


_default_evaluator = SafeEvaluator()


def validate_expression(expr: str, allow_vars: bool = False) -> str:
    """Validate an expression against the SAFE_FUNCTIONS/SAFE_CONSTANTS allowlist.

    Args:
        expr: The expression string to validate.
        allow_vars: If True, allow identifiers like 'x' (for graphing).

    Returns:
        The normalized expression string.

    Raises:
        ValueError: If the expression contains unknown or disallowed identifiers.
    """
    expr = _default_evaluator._normalize(expr)
    _default_evaluator._check_nesting_depth(expr)

    for token in re.findall(r'\b[a-zA-Z_]\w*\b', expr):
        if token in _default_evaluator._namespace:
            continue
        if token in SAFE_CONSTANTS:
            continue
        if allow_vars and len(token) == 1 and token.isalpha():
            continue
        raise ValueError(f"Unknown identifier: {token}")

    return expr


def safe_eval(expression: str, angle_mode: str = "degrees") -> float | str:
    """Convenience function for backward compatibility."""
    global _default_evaluator
    if _default_evaluator.angle_mode != angle_mode:
        _default_evaluator.set_angle_mode(angle_mode)
    return _default_evaluator.evaluate_safe(expression)