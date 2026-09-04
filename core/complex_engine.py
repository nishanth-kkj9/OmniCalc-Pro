"""
OmniCalc Pro Complex Engine (Python Desktop Parity)
Provides parsing, representations (Rectangular, Polar, Euler),
arithmetic, transcendental functions, n-th complex roots, De Moivre's theorem,
and AC electrical circuit (RLC / Phasor) calculations.
"""

import cmath
import math
import re
from typing import List, Dict, Any, Tuple, Optional


class ComplexEngine:
    @staticmethod
    def parse_complex(s: str) -> Optional[complex]:
        """
        Parses a user string into a complex number.
        Supports: "3+4i", "3 - 4j", "5<45", "5<45deg", "5<0.785rad", "5∠45", "-2i", "7".
        """
        if not s or not isinstance(s, str):
            return None
        clean = s.strip().replace(" ", "")
        if not clean:
            return None

        # Polar angle form: "r<theta" or "r∠theta"
        polar_match = re.match(r"^([+-]?[0-9.]+)(?:<|∠)([+-]?[0-9.]+)(deg|rad)?$", clean, re.IGNORECASE)
        if polar_match:
            r = float(polar_match.group(1))
            theta = float(polar_match.group(2))
            unit = (polar_match.group(3) or "deg").lower()
            if unit == "deg":
                theta_rad = math.radians(theta)
            else:
                theta_rad = theta
            return cmath.rect(r, theta_rad)

        # Pure imaginary: "5i", "-i", "+2j"
        pure_im_match = re.match(r"^([+-]?[0-9.]*)?[ij]$", clean, re.IGNORECASE)
        if pure_im_match:
            coeff = pure_im_match.group(1)
            if not coeff or coeff == "+":
                return complex(0, 1)
            if coeff == "-":
                return complex(0, -1)
            return complex(0, float(coeff))

        # Real + Imaginary: "a+bi" or "a-bi" or "a+b*i"
        rect_match = re.match(r"^([+-]?[0-9.]+)([+-][0-9.]*)?[ij]$", clean, re.IGNORECASE)
        if rect_match:
            re_val = float(rect_match.group(1))
            im_part = rect_match.group(2)
            if im_part == "+" or im_part is None:
                im_val = 1.0
            elif im_part == "-":
                im_val = -1.0
            else:
                im_val = float(im_part)
            return complex(re_val, im_val)

        # Pure real
        try:
            val = float(clean)
            return complex(val, 0)
        except ValueError:
            return None

    @staticmethod
    def format_rectangular(z: complex, precision: int = 4) -> str:
        re_val = round(z.real, precision)
        im_val = round(z.imag, precision)

        if abs(im_val) < 1e-12:
            return f"{re_val:g}"
        if abs(re_val) < 1e-12:
            if im_val == 1:
                return "i"
            if im_val == -1:
                return "-i"
            return f"{im_val:g}i"

        sign = "+" if im_val >= 0 else "-"
        abs_im = abs(im_val)
        im_str = "i" if abs_im == 1 else f"{abs_im:g}i"
        return f"{re_val:g} {sign} {im_str}"

    @staticmethod
    def format_polar(z: complex, deg: bool = True, precision: int = 4) -> str:
        r, phi = cmath.polar(z)
        r_str = f"{round(r, precision):g}"
        if deg:
            angle_str = f"{round(math.degrees(phi), precision):g}°"
        else:
            angle_str = f"{round(phi, precision):g} rad"
        return f"{r_str} ∠ {angle_str}"

    @staticmethod
    def format_euler(z: complex, precision: int = 4) -> str:
        r, phi = cmath.polar(z)
        r_str = f"{round(r, precision):g}"
        phi_str = f"{round(phi, precision):g}"
        return f"{r_str} · e^({phi_str}i)"

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
    def calculate_all_representations(z: complex, precision: int = 4) -> Dict[str, Any]:
        r, phi_rad = cmath.polar(z)
        phi_deg = math.degrees(phi_rad)
        return {
            "rectangular": ComplexEngine.format_rectangular(z, precision),
            "polar_deg": ComplexEngine.format_polar(z, deg=True, precision=precision),
            "polar_rad": ComplexEngine.format_polar(z, deg=False, precision=precision),
            "euler": ComplexEngine.format_euler(z, precision),
            "re": z.real,
            "im": z.imag,
            "modulus": r,
            "argument_rad": phi_rad,
            "argument_deg": phi_deg,
            "conjugate": complex(z.real, -z.imag)
        }

    @staticmethod
    def evaluate_binary_op(z1: complex, z2: complex, op: str) -> Dict[str, Any]:
        if op == "+":
            res = z1 + z2
        elif op == "-":
            res = z1 - z2
        elif op == "*":
            res = z1 * z2
        elif op == "/":
            if z2 == 0:
                raise ZeroDivisionError("Complex division by zero.")
            res = z1 / z2
        elif op == "^" or op == "**":
            res = z1 ** z2
        elif op == "parallel":
            # Z1 || Z2 = (Z1 * Z2) / (Z1 + Z2)
            denom = z1 + z2
            if denom == 0:
                raise ZeroDivisionError("Parallel impedance denominator is zero.")
            res = (z1 * z2) / denom
        else:
            raise ValueError(f"Unsupported complex operator: {op}")

        return {
            "result_complex": res,
            "representations": ComplexEngine.calculate_all_representations(res)
        }

    @staticmethod
    def rlc_impedance(r: float, l: float, c: float, freq: float) -> Dict[str, Any]:
        omega = 2.0 * math.pi * freq
        x_l = omega * l
        x_c = 1.0 / (omega * c) if (c > 0 and omega > 0) else 0.0
        z = complex(r, x_l - x_c)
        f0 = 1.0 / (2.0 * math.pi * math.sqrt(l * c)) if (l > 0 and c > 0) else 0.0

        return {
            "impedance": z,
            "omega": omega,
            "X_L": x_l,
            "X_C": x_c,
            "net_reactance": x_l - x_c,
            "modulus_Z": abs(z),
            "phase_deg": math.degrees(cmath.phase(z)),
            "resonance_freq_Hz": f0,
            "representations": ComplexEngine.calculate_all_representations(z)
        }
