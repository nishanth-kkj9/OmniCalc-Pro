from typing import List, Union
from utils.helpers import safe_eval


class ScientificEngine:
    @staticmethod
    def calculate(expr: str, angle_mode: str = "degrees") -> Union[float, str]:
        return safe_eval(expr, angle_mode)

    @staticmethod
    def get_function_list() -> List[str]:
        return ["sin", "cos", "tan", "asin", "acos", "atan",
                "log", "ln", "sqrt", "pi", "e", "factorial"]
