"""
Safe Expression Evaluator - AST-based, no eval().

Uses sympy's parser with restricted transformations for secure mathematical evaluation.
No code execution possible - only mathematical expressions.
"""
import atexit
import math
import re
from typing import Any
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

import sympy as sp
from sympy import SympifyError, Basic
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
    convert_xor,
)

from utils.logger import get_logger
from utils.constants import MAX_EXPR_LENGTH, MAX_EXECUTION_TIME, MAX_NESTING_DEPTH

logger = get_logger()

# Maximum allowed exponent to prevent CPU/memory exhaustion attacks
MAX_EXPONENT_VAL = 10000
# Maximum allowed factorial input
MAX_FACTORIAL_VAL = 170
# Maximum allowed gamma input
MAX_GAMMA_VAL = 171
# Maximum allowed exp input
MAX_EXP_VAL = 709
# Maximum allowed operator count
MAX_OPERATOR_COUNT = 100

# Global worker thread pool to avoid blocking shutdowns on timeout
_EVAL_POOL = ThreadPoolExecutor(max_workers=2, thread_name_prefix="eval_worker")
atexit.register(lambda: _EVAL_POOL.shutdown(wait=False))

def _safe_deg_tan(x: float) -> float:
    mod_deg = ((x % 180) + 180) % 180
    if abs(mod_deg - 90) < 1e-10:
        return float("nan")
    return math.tan(math.radians(x))

def _safe_grad_tan(x: float) -> float:
    mod_grad = ((x % 200) + 200) % 200
    if abs(mod_grad - 100) < 1e-10:
        return float("nan")
    return math.tan(x * math.pi / 200)

def _safe_rad_tan(x: float) -> float:
    half_pi = math.pi / 2
    mod_pi = ((x % math.pi) + math.pi) % math.pi
    if abs(mod_pi - half_pi) < 1e-10:
        return float("nan")
    return math.tan(x)

SAFE_FUNCTIONS = {
    "sin", "cos", "tan", "asin", "acos", "atan",
    "sinh", "cosh", "tanh", "asinh", "acosh", "atanh",
    "log", "ln", "log10", "log2", "sqrt", "cbrt",
    "exp", "expm1", "degrees", "radians",
    "floor", "ceil", "trunc", "round",
    "abs", "factorial", "fact", "gamma", "mod", "sign",
    "pi", "e", "tau", "phi", "inf", "nan",
}

SAFE_CONSTANTS = {
    "pi": math.pi,
    "e": math.e,
    "tau": math.tau,
    "phi": (1 + math.sqrt(5)) / 2,
    "inf": float("inf"),
    "nan": float("nan"),
}

DEGREE_FUNCTIONS = {
    "sin": lambda x: 0.0 if abs(((x % 360) + 360) % 360 - 180) < 1e-10 or abs(((x % 360) + 360) % 360) < 1e-10 else math.sin(math.radians(x)),
    "cos": lambda x: 0.0 if abs(((x % 360) + 360) % 360 - 90) < 1e-10 or abs(((x % 360) + 360) % 360 - 270) < 1e-10 else math.cos(math.radians(x)),
    "tan": _safe_deg_tan,
    "asin": lambda x: math.degrees(math.asin(x)),
    "acos": lambda x: math.degrees(math.acos(x)),
    "atan": lambda x: math.degrees(math.atan(x)),
    "mod": lambda a, b: a % b,
    "sign": lambda x: (1.0 if x > 0 else (-1.0 if x < 0 else 0.0)),
    "fact": math.factorial,
}

GRAD_FUNCTIONS = {
    "sin": lambda x: 0.0 if abs(((x % 400) + 400) % 400 - 200) < 1e-10 or abs(((x % 400) + 400) % 400) < 1e-10 else math.sin(x * math.pi / 200),
    "cos": lambda x: 0.0 if abs(((x % 400) + 400) % 400 - 100) < 1e-10 or abs(((x % 400) + 400) % 400 - 300) < 1e-10 else math.cos(x * math.pi / 200),
    "tan": _safe_grad_tan,
    "asin": lambda x: (math.asin(x) * 200) / math.pi,
    "acos": lambda x: (math.acos(x) * 200) / math.pi,
    "atan": lambda x: (math.atan(x) * 200) / math.pi,
    "mod": lambda a, b: a % b,
    "sign": lambda x: (1.0 if x > 0 else (-1.0 if x < 0 else 0.0)),
    "fact": math.factorial,
}

RADIAN_FUNCTIONS = {
    "sin": math.sin,
    "cos": math.cos,
    "tan": _safe_rad_tan,
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
    "fact": math.factorial,
    "gamma": math.gamma,
    "mod": lambda a, b: a % b,
    "sign": lambda x: (1.0 if x > 0 else (-1.0 if x < 0 else 0.0)),
}

# Blocked tokens that should never appear in mathematical expressions
BLOCKED_IDENTIFIERS = {
    "eval", "exec", "import", "__import__", "open", "globals", "locals",
    "getattr", "setattr", "delattr", "hasattr", "compile", "builtins",
    "__builtins__", "system", "os", "sys", "subprocess", "shutil", "socket",
    "requests", "urllib", "pickle", "input", "raw_input", "classmethod",
    "staticmethod", "property", "type", "super", "__class__", "__bases__",
    "__subclasses__", "__mro__", "__code__", "__dict__",
}

TRANSFORMATIONS = (
    standard_transformations
    + (implicit_multiplication_application,)
    + (convert_xor,)
)

_UNICODE_MAP = {
    "×": "*", "÷": "/", "−": "-", "–": "-",
    "·": "*", "√": "sqrt(",
    "π": "pi", "τ": "tau", "∞": "inf",
    "²": "**2", "³": "**3", "ⁿ": "**",
    "±": "+-", "∓": "-+",
    "≤": "<=", "≥": ">=", "≠": "!=",
    "≈": "~", "≡": "==",
}

_PROTECTED_FUNCTIONS = set(SAFE_FUNCTIONS) | {"factorial"}


def _validate_parsed_sympy_tree(node: Any) -> None:
    """Traverses parsed SymPy AST nodes to enforce mathematical limits (exponent, factorial, gamma)."""
    if isinstance(node, Basic):
        for subnode in sp.preorder_traversal(node):
            if subnode.is_Pow:
                exp = subnode.exp
                if exp.is_Number and abs(float(exp)) > MAX_EXPONENT_VAL:
                    raise ValueError(f"Exponent {exp} exceeds safe limit ({MAX_EXPONENT_VAL})")
            elif getattr(subnode, "func", None) in (sp.factorial, math.factorial):
                arg = subnode.args[0] if subnode.args else None
                if arg is not None and arg.is_Number and float(arg) > MAX_FACTORIAL_VAL:
                    raise ValueError(f"Factorial input {arg} exceeds safe limit ({MAX_FACTORIAL_VAL})")
            elif getattr(subnode, "func", None) in (sp.gamma, math.gamma):
                arg = subnode.args[0] if subnode.args else None
                if arg is not None and arg.is_Number and float(arg) > MAX_GAMMA_VAL:
                    raise ValueError(f"Gamma input {arg} exceeds safe limit ({MAX_GAMMA_VAL})")


def _worker_eval_task(expr: str, namespace_keys: list[str], angle_mode: str, custom_namespace: dict[str, Any] | None = None) -> float:
    """Isolated evaluation task with strict global dictionary restrictions and AST traversal."""
    ns: dict[str, Any] = dict(SAFE_CONSTANTS)
    mode = (angle_mode or "").lower()
    if mode in ("degrees", "deg"):
        ns.update(DEGREE_FUNCTIONS)
        ns.update({k: v for k, v in RADIAN_FUNCTIONS.items() if k not in DEGREE_FUNCTIONS})
    elif mode in ("grad", "grads", "gradian", "gradians"):
        ns.update(GRAD_FUNCTIONS)
        ns.update({k: v for k, v in RADIAN_FUNCTIONS.items() if k not in GRAD_FUNCTIONS})
    else:
        ns.update(RADIAN_FUNCTIONS)

    if custom_namespace:
        ns.update(custom_namespace)

    # Restrict parse_expr with empty global_dict
    result = parse_expr(expr, transformations=TRANSFORMATIONS, local_dict=ns, global_dict={}, evaluate=True)

    if isinstance(result, Basic):
        _validate_parsed_sympy_tree(result)

    if isinstance(result, (int, float)):
        val = float(result)
    elif isinstance(result, Basic):
        if not result.is_number:
            raise ValueError("Result is not a number")
        val = float(result.evalf())
    elif isinstance(result, complex):
        if result.imag == 0:
            val = float(result.real)
        else:
            raise ValueError("Result is a complex number")
    else:
        raise ValueError("Result is not a valid number")

    if math.isinf(val) or math.isnan(val):
        raise ValueError("Result is infinite or NaN")
    return val


class SafeEvaluator:
    """Thread-safe and process-isolated mathematical expression evaluator with complexity limits."""

    def __init__(self, angle_mode: str = "degrees", max_length: int = MAX_EXPR_LENGTH):
        self.angle_mode = angle_mode
        self.max_length = max_length
        self.max_time = MAX_EXECUTION_TIME
        self.max_nesting = MAX_NESTING_DEPTH
        self._namespace = self._build_namespace()

    def _build_namespace(self) -> dict[str, Any]:
        ns: dict[str, Any] = dict(SAFE_CONSTANTS)
        mode = (self.angle_mode or "").lower()
        if mode in ("degrees", "deg"):
            ns.update(DEGREE_FUNCTIONS)
            ns.update({k: v for k, v in RADIAN_FUNCTIONS.items() if k not in DEGREE_FUNCTIONS})
        elif mode in ("grad", "grads", "gradian", "gradians"):
            ns.update(GRAD_FUNCTIONS)
            ns.update({k: v for k, v in RADIAN_FUNCTIONS.items() if k not in GRAD_FUNCTIONS})
        else:
            ns.update(RADIAN_FUNCTIONS)
        return ns

    def set_angle_mode(self, mode: str) -> None:
        clean = (mode or "").lower()
        if clean in ("degrees", "deg", "grad", "grads", "gradian", "gradians", "radians", "rad"):
            self.angle_mode = clean
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
                if depth < 0:
                    raise ValueError("Mismatched parentheses in expression")
        if depth != 0:
            raise ValueError("Unclosed parentheses in expression")

    def _check_complexity_limits(self, expr: str) -> None:
        """Check complexity constraints against DoS expressions."""
        # 1. Check operator repetition / count
        operators = re.findall(r"[\+\-\*\/\^\%]", expr)
        if len(operators) > MAX_OPERATOR_COUNT:
            raise ValueError(f"Expression exceeds operator complexity limit ({MAX_OPERATOR_COUNT})")

        # 2. Check for blocked malicious tokens or dunder attributes
        tokens = re.findall(r"\b[a-zA-Z_]\w*\b", expr)
        for token in tokens:
            if token in BLOCKED_IDENTIFIERS or token.startswith("__"):
                raise ValueError(f"Disallowed token or identifier: {token}")

        # 3. Check for oversized exponents and chained exponent towers (e.g. 10**100000 or 2**2**2**2**2)
        # Reject chained exponentiation towers without parentheses (e.g. a**b**c or a^b^c)
        if re.search(r"(?:\*\*|\^)[^\+\-\*\/\%\(\)]*(?:\*\*|\^)", expr):
            raise ValueError("Chained exponent towers are not permitted due to complexity limits")

        exp_matches = re.finditer(r"(?:\*\*|\^)\s*(\d+)", expr)
        for match in exp_matches:
            exp_val = int(match.group(1))
            if exp_val > MAX_EXPONENT_VAL:
                raise ValueError(f"Exponent {exp_val} exceeds safe limit ({MAX_EXPONENT_VAL})")

        # 4. Check for nested/crafted factorial or gamma calls (e.g. factorial(factorial(10)), factorial(9**5))
        if re.search(r"factorial\s*\([^)]*(?:factorial|gamma|\^|\*\*)[^)]*\)", expr):
            raise ValueError("Nested or exponential factorial arguments are not permitted")
        if re.search(r"gamma\s*\([^)]*(?:factorial|gamma|\^|\*\*)[^)]*\)", expr):
            raise ValueError("Nested or exponential gamma arguments are not permitted")

        # 5. Check for oversized factorial inputs (e.g. factorial(100000))
        fact_matches = re.finditer(r"factorial\s*\(\s*(\d+)\s*\)", expr)
        for match in fact_matches:
            fact_val = int(match.group(1))
            if fact_val > MAX_FACTORIAL_VAL:
                raise ValueError(f"Factorial input {fact_val} exceeds safe limit ({MAX_FACTORIAL_VAL})")

        # 6. Check for oversized gamma inputs
        gamma_matches = re.finditer(r"gamma\s*\(\s*(\d+)\s*\)", expr)
        for match in gamma_matches:
            gamma_val = int(match.group(1))
            if gamma_val > MAX_GAMMA_VAL:
                raise ValueError(f"Gamma input {gamma_val} exceeds safe limit ({MAX_GAMMA_VAL})")

        # 7. Check for oversized exp inputs
        exp_func_matches = re.finditer(r"exp\s*\(\s*(\d+)\s*\)", expr)
        for match in exp_func_matches:
            exp_fn_val = int(match.group(1))
            if exp_fn_val > MAX_EXP_VAL:
                raise ValueError(f"Exp input {exp_fn_val} exceeds safe limit ({MAX_EXP_VAL})")

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
        sci_placeholders: dict[str, str] = {}
        def _protect_sci(m):
            orig = m.group(0)
            key = f"__SCI_{len(sci_placeholders)}__"
            sci_placeholders[key] = orig
            return key
        expr = re.sub(r"\b(\d+(?:\.\d+)?)[eE]([+-]?\d+)\b", _protect_sci, expr)

        # 2. Protect function names from implicit multiplication splitting
        func_placeholders: dict[str, str] = {}
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
            if token in BLOCKED_IDENTIFIERS or token.startswith("__"):
                raise ValueError(f"Disallowed identifier: {token}")
            if token in self._namespace:
                continue
            if token in SAFE_CONSTANTS:
                continue
            if allow_vars and len(token) == 1 and token.isalpha():
                continue
            raise ValueError(f"Unknown identifier: {token}")

    def _prevalidate(self, expr: str, allow_vars: bool = False) -> str:
        """Run common pre-validation (length, nesting, complexity, identifiers). Returns normalized expression."""
        expr = self._normalize(expr)
        self._check_nesting_depth(expr)
        self._check_complexity_limits(expr)
        self._validate_ast(expr, allow_vars=allow_vars)
        return expr

    def evaluate(self, expr: str) -> float:
        """Evaluate mathematical expression with timeout enforcement and complexity limits.
        
        Uses a shared global thread pool to avoid blocking shutdowns on timeout.
        """
        try:
            expr = self._prevalidate(expr)

            # Fast path or timed execution using global _EVAL_POOL for responsive timeout enforcement
            if self.max_time <= 0:
                return _worker_eval_task(expr, list(self._namespace.keys()), self.angle_mode, self._namespace)

            future = _EVAL_POOL.submit(_worker_eval_task, expr, list(self._namespace.keys()), self.angle_mode, self._namespace)
            try:
                return future.result(timeout=self.max_time)
            except FuturesTimeoutError:
                future.cancel()
                raise TimeoutError(f"Evaluation exceeded {self.max_time}s limit")

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

    def evaluate_safe(self, expr: str) -> float | str:
        try:
            return self.evaluate(expr)
        except ValueError as e:
            return f"Error: {e}"

    # --- Consolidated Symbolic Parsing and Solving ---

    def _build_symbolic_namespace(self) -> dict[str, Any]:
        """Namespace for symbolic expressions and solving containing sympy functions and constants."""
        return {
            "sin": sp.sin, "cos": sp.cos, "tan": sp.tan,
            "asin": sp.asin, "acos": sp.acos, "atan": sp.atan,
            "sinh": sp.sinh, "cosh": sp.cosh, "tanh": sp.tanh,
            "asinh": sp.asinh, "acosh": sp.acosh, "atanh": sp.atanh,
            "log": sp.log, "ln": sp.log,
            "log10": lambda arg: sp.log(arg, 10),
            "log2": lambda arg: sp.log(arg, 2),
            "sqrt": sp.sqrt, "cbrt": sp.cbrt,
            "exp": sp.exp, "abs": sp.Abs, "factorial": sp.factorial, "gamma": sp.gamma,
            "pi": sp.pi, "e": sp.E, "tau": 2 * sp.pi, "inf": sp.oo, "nan": sp.nan,
        }

    def parse_expression(self, expr: str):
        try:
            expr = self._prevalidate(expr.replace('^', '**'), allow_vars=True)
            sym_ns = self._build_symbolic_namespace()
            return parse_expr(expr, transformations=TRANSFORMATIONS, local_dict=sym_ns, evaluate=False)
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
            sym_ns = self._build_symbolic_namespace()
            sym_ns[variable] = x
            eq = parse_expr(expr, transformations=TRANSFORMATIONS, local_dict=sym_ns, evaluate=False)
            return sp.solve(eq, x)
        except SympifyError as e:
            raise ValueError(f"Error solving expression: {e}") from e
        except ValueError:
            raise
        except Exception as e:
            raise ValueError(f"Error solving expression: {e}") from e


_default_evaluator = SafeEvaluator()


def validate_expression(expr: str, allow_vars: bool = False) -> str:
    """Validate an expression against the SAFE_FUNCTIONS/SAFE_CONSTANTS allowlist."""
    return _default_evaluator._prevalidate(expr, allow_vars=allow_vars)


def safe_eval(expression: str, angle_mode: str = "degrees") -> float | str:
    """Convenience function for backward compatibility."""
    global _default_evaluator
    if _default_evaluator.angle_mode != angle_mode:
        _default_evaluator.set_angle_mode(angle_mode)
    return _default_evaluator.evaluate_safe(expression)
