import re
import warnings


def is_valid_number(val: str) -> bool:
    """Check if a string represents a valid floating point number."""
    try:
        float(val)
        return True
    except ValueError:
        return False


def sanitize_expression(expr: str) -> bool:
    """
    [DEPRECATED] Quick character-level pattern check for simple math strings.

    Note:
        Do not use as a security boundary. For secure evaluation and AST-level
        validation, use `core.safe_evaluator.SafeEvaluator`.
    """
    warnings.warn(
        "sanitize_expression is deprecated; use core.safe_evaluator.SafeEvaluator for expression validation.",
        DeprecationWarning,
        stacklevel=2,
    )
    if not expr:
        return False
    pattern = r'^[0-9+\-*/().%\s^eE]+$'
    cleaned = expr.replace('sin', '').replace('cos', '').replace('tan', '').replace('pi', '').replace('log', '').replace('ln', '').replace('sqrt', '')
    return bool(re.match(pattern, cleaned))
