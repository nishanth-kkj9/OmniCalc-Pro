from typing import Union

WORD_MASKS = {8: 0xFF, 16: 0xFFFF, 32: 0xFFFFFFFF, 64: 0xFFFFFFFFFFFFFFFF}


class ProgrammerEngine:
    @staticmethod
    def _to_int(value: Union[int, str], from_base: str = "DEC") -> int:
        if isinstance(value, int):
            return value
        v = str(value).strip()
        try:
            if from_base == "HEX" or v.lower().startswith("0x"):
                return int(v, 16)
            if from_base == "OCT" or v.lower().startswith("0o"):
                return int(v, 8)
            if from_base == "BIN" or v.lower().startswith("0b"):
                return int(v, 2)
            return int(v, 10)
        except ValueError as e:
            raise ValueError(f"Invalid {from_base} integer: {value!r}") from e

    @staticmethod
    def to_base(
        value: Union[int, str],
        base: str = "BIN",
        from_base: str = "DEC",
        word_size: int = 64
    ) -> str:
        try:
            val = ProgrammerEngine._to_int(value, from_base)
            mask = WORD_MASKS.get(word_size, WORD_MASKS[64])
            val = val & mask
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
    def bitwise(
        a: Union[int, str],
        b: Union[int, str] = 0,
        op: str = "AND",
        word_size: int = 64,
        a_base: str = "DEC",
        b_base: str = "DEC"
    ) -> Union[int, str]:
        try:
            a_int = ProgrammerEngine._to_int(a, a_base)
            b_int = ProgrammerEngine._to_int(b, b_base) if op != "NOT" else 0

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
    def shift(
        a: Union[int, str],
        n: int,
        direction: str = "L",
        word_size: int = 64,
        a_base: str = "DEC"
    ) -> Union[int, str]:
        try:
            if n < 0:
                return "Error"
            mask = WORD_MASKS.get(word_size, WORD_MASKS[64])
            val = ProgrammerEngine._to_int(a, a_base)
            if direction == "L":
                return (val << n) & mask
            return (val & mask) >> n
        except Exception:
            return "Error"
