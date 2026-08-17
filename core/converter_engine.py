from typing import Dict, Union

Number = Union[int, float]


class ConversionError(ValueError):
    """Raised for unknown category or unit during conversion."""


class ConverterEngine:
    CATEGORIES: Dict[str, Dict[str, object]] = {
        "Length": {"m": 1, "km": 1000, "cm": 0.01, "mm": 0.001, "mi": 1609.34, "ft": 0.3048, "in": 0.0254},
        "Weight": {"kg": 1, "g": 0.001, "mg": 0.000001, "lb": 0.453592, "oz": 0.0283495},
        "Time": {"s": 1, "min": 60, "h": 3600, "d": 86400},
        "Temperature": {"C": "temp", "F": "temp", "K": "temp"},
        "Speed": {"m/s": 1, "km/h": 0.277778, "mph": 0.44704},
        "Storage": {"Byte": 1, "KB": 1024, "MB": 1024**2, "GB": 1024**3, "TB": 1024**4}
    }

    @staticmethod
    def convert(value: Number, from_unit: str, to_unit: str, category: str) -> Number:
        if category not in ConverterEngine.CATEGORIES:
            raise ConversionError(f"Unknown category: {category}")
        if category == "Temperature":
            return ConverterEngine._convert_temp(value, from_unit, to_unit)
        units = ConverterEngine.CATEGORIES[category]
        if from_unit not in units or to_unit not in units:
            raise ConversionError(f"Unknown unit(s): {from_unit!r} -> {to_unit!r} in {category}")
        base = value * units[from_unit]  # type: ignore
        return base / units[to_unit]  # type: ignore

    @staticmethod
    def _convert_temp(val: Number, src: str, dst: str) -> Number:
        temp_units = {"C", "F", "K"}
        if src not in temp_units or dst not in temp_units:
            raise ConversionError(f"Unknown temperature unit(s): {src!r} -> {dst!r}")
        if src == "F":
            c: Number = (val - 32) * 5 / 9
        elif src == "K":
            c = val - 273.15
        else:
            c = val

        if dst == "C":
            return c
        if dst == "F":
            return c * 9 / 5 + 32
        if dst == "K":
            return c + 273.15
        return c
