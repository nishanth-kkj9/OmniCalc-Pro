from typing import Union


class ProgrammerEngine:
    @staticmethod
    def to_base(value: Union[int, str], base: str = "BIN") -> str:
        try:
            val = int(value)
            if base == "BIN":
                return bin(val)
            elif base == "HEX":
                return hex(val)
            elif base == "OCT":
                return oct(val)
            else:
                return str(val)
        except Exception:
            return "Invalid"

    @staticmethod
    def bitwise(a: Union[int, str], b: Union[int, str], op: str) -> Union[int, str]:
        try:
            a_int, b_int = int(a), int(b)
            if op == "AND":
                return a_int & b_int
            elif op == "OR":
                return a_int | b_int
            elif op == "XOR":
                return a_int ^ b_int
            elif op == "NOT":
                return ~a_int
            else:
                return 0
        except Exception:
            return "Error"

    @staticmethod
    def shift(a: Union[int, str], n: int, direction: str = "L") -> Union[int, str]:
        try:
            val = int(a)
            return val << n if direction == "L" else val >> n
        except Exception:
            return "Error"
