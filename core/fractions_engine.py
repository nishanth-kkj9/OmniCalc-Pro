"""
OmniCalc Pro Fractions & Number Theory Engine (Python Desktop Parity)
Provides exact rational arithmetic using Python's fractions.Fraction,
fraction simplification, mixed number formatting, GCD/LCM calculations,
and Prime Factorization / Number Theory analysis.
"""

from fractions import Fraction
import math
from typing import List, Dict, Any, Tuple, Optional


class FractionsEngine:
    @staticmethod
    def simplify_fraction(num: int, den: int) -> Dict[str, Any]:
        if den == 0:
            raise ZeroDivisionError("Denominator cannot be zero.")
        f = Fraction(num, den)
        simp_num = f.numerator
        simp_den = f.denominator

        whole = math.trunc(simp_num / simp_den)
        rem = abs(simp_num) % simp_den
        mixed_str = None
        if whole != 0 and rem != 0:
            mixed_str = f"{whole} {rem}/{simp_den}"

        g = math.gcd(abs(num), abs(den))
        decimal_val = float(f)

        return {
            "numerator": simp_num,
            "denominator": simp_den,
            "simplified_str": f"{simp_num} / {simp_den}",
            "mixed_str": mixed_str,
            "decimal_val": decimal_val,
            "gcd": g,
            "steps": [
                f"Original: {num} / {den}",
                f"GCD({abs(num)}, {abs(den)}) = {g}",
                f"Divide top and bottom by {g} → {simp_num} / {simp_den}"
            ]
        }

    @staticmethod
    def evaluate_binary_op(n1: int, d1: int, op: str, n2: int, d2: int) -> Dict[str, Any]:
        if d1 == 0 or d2 == 0:
            raise ZeroDivisionError("Denominator cannot be zero.")

        f1 = Fraction(n1, d1)
        f2 = Fraction(n2, d2)

        if op == "+" or op == "add":
            res = f1 + f2
            step = f"({n1}×{d2} + {n2}×{d1}) / ({d1}×{d2}) = {n1 * d2 + n2 * d1} / {d1 * d2}"
        elif op == "-" or op == "subtract" or op == "−":
            res = f1 - f2
            step = f"({n1}×{d2} - {n2}×{d1}) / ({d1}×{d2}) = {n1 * d2 - n2 * d1} / {d1 * d2}"
        elif op == "*" or op == "multiply" or op == "×":
            res = f1 * f2
            step = f"({n1}×{n2}) / ({d1}×{d2}) = {n1 * n2} / {d1 * d2}"
        elif op == "/" or op == "divide" or op == "÷":
            if f2 == 0:
                raise ZeroDivisionError("Cannot divide by zero fraction.")
            res = f1 / f2
            step = f"({n1}×{d2}) / ({d1}×{n2}) = {n1 * d2} / {d1 * n2}"
        else:
            raise ValueError(f"Unsupported fraction operation: {op}")

        simp_num = res.numerator
        simp_den = res.denominator

        whole = math.trunc(simp_num / simp_den)
        rem = abs(simp_num) % simp_den
        mixed_str = f"{whole} {rem}/{simp_den}" if (whole != 0 and rem != 0) else None

        return {
            "result_fraction": res,
            "simplified_str": f"{simp_num} / {simp_den}",
            "mixed_str": mixed_str,
            "decimal_val": float(res),
            "step_calculation": step
        }

    @staticmethod
    def gcd_lcm_list(numbers: List[int]) -> Dict[str, Any]:
        valid_nums = [abs(n) for n in numbers if n != 0]
        if len(valid_nums) < 2:
            raise ValueError("Please provide at least two non-zero integers.")

        cur_gcd = valid_nums[0]
        cur_lcm = valid_nums[0]

        for num in valid_nums[1:]:
            cur_gcd = math.gcd(cur_gcd, num)
            cur_lcm = (cur_lcm * num) // math.gcd(cur_lcm, num)

        return {
            "numbers": valid_nums,
            "gcd": cur_gcd,
            "lcm": cur_lcm,
            "steps": [
                f"Numbers evaluated: {valid_nums}",
                f"Greatest Common Divisor (GCD) = {cur_gcd}",
                f"Least Common Multiple (LCM) = {cur_lcm}"
            ]
        }

    @staticmethod
    def prime_factorization(n: int) -> Dict[str, Any]:
        n_orig = abs(n)
        if n_orig <= 1:
            return {
                "n": n_orig,
                "is_prime": False,
                "factors": [],
                "latex": str(n_orig),
                "divisor_count": 1 if n_orig == 1 else 0,
                "divisor_sum": 1 if n_orig == 1 else 0
            }

        temp = n_orig
        factors = []
        d = 2
        while d * d <= temp:
            if temp % d == 0:
                count = 0
                while temp % d == 0:
                    count += 1
                    temp //= d
                factors.append({"prime": d, "exponent": count})
            d = 3 if d == 2 else d + 2

        if temp > 1:
            factors.append({"prime": temp, "exponent": 1})

        is_prime = len(factors) == 1 and factors[0]["exponent"] == 1

        latex_parts = [f"{f['prime']}^{f['exponent']}" if f['exponent'] > 1 else f"{f['prime']}" for f in factors]
        latex_str = " · ".join(latex_parts)

        # Divisor count: ∏(e_i + 1), Divisor sum: ∏((p_i^(e_i+1) - 1)/(p_i - 1))
        div_count = 1
        div_sum = 1
        for f in factors:
            p = f["prime"]
            e = f["exponent"]
            div_count *= (e + 1)
            div_sum *= (p ** (e + 1) - 1) // (p - 1)

        return {
            "n": n_orig,
            "is_prime": is_prime,
            "factors": factors,
            "latex_str": latex_str,
            "divisor_count": div_count,
            "divisor_sum": div_sum
        }
