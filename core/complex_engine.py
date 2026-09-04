"""
OmniCalc Pro Complex Engine (Python Desktop Parity)
"""

import cmath
import math
from typing import List, Dict, Any, Tuple


class ComplexEngine:
    @staticmethod
    def to_polar(z: complex, deg: bool = True) -> Tuple[float, float]:
        r, phi = cmath.polar(z)
        if deg:
            phi = math.degrees(phi)
        return r, phi

    @staticmethod
    def roots(z: complex, n: int) -> List[complex]:
        if n <= 0:
            raise ValueError("Root order n must be >= 1.")
        r, phi = cmath.polar(z)
        root_r = r ** (1.0 / n)
        return [
            cmath.rect(root_r, (phi + 2.0 * math.pi * k) / n)
            for k in range(n)
        ]

    @staticmethod
    def rlc_impedance(r: float, l: float, c: float, freq: float) -> complex:
        omega = 2.0 * math.pi * freq
        x_l = omega * l
        x_c = 1.0 / (omega * c) if (c > 0 and omega > 0) else 0.0
        return complex(r, x_l - x_c)
