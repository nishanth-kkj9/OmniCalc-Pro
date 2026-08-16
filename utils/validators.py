import re


def is_valid_number(val: str) -> bool:
    try:
        float(val)
        return True
    except ValueError:
        return False


def sanitize_expression(expr: str) -> bool:
    pattern = r'^[0-9+\-*/().%\s^eE]+$'
    cleaned = expr.replace('sin', '').replace('cos', '').replace('tan', '').replace('pi', '').replace('log', '').replace('ln', '').replace('sqrt', '')
    return bool(re.match(pattern, cleaned))
