from typing import Union
from utils.helpers import safe_eval


class BasicEngine:
    @staticmethod
    def calculate(expr: str, angle_mode: str = "degrees") -> Union[float, str]:
        if not expr or not expr.strip():
            return 0.0
        return safe_eval(expr, angle_mode)
