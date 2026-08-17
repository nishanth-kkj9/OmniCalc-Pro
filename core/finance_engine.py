from typing import Tuple, Union

Number = Union[int, float]


class FinanceEngine:
    @staticmethod
    def emi(principal: Number, annual_rate: Number, months: int) -> Tuple[float, float, float]:
        if principal < 0 or months <= 0:
            raise ValueError("principal must be >= 0 and months must be > 0")
        if annual_rate == 0:
            emi_val = principal / months
            return round(emi_val, 2), round(principal, 2), 0.0
        r = annual_rate / 12 / 100
        factor = (1 + r) ** months
        emi_val = principal * r * factor / (factor - 1)
        total_pay = emi_val * months
        interest = total_pay - principal
        return round(emi_val, 2), round(total_pay, 2), round(interest, 2)

    @staticmethod
    def compound_interest(p: Number, r: Number, n: int, t: int) -> Tuple[float, float]:
        if p < 0 or r < 0 or n <= 0 or t < 0:
            raise ValueError("Invalid parameters for compound interest calculation")
        amount = p * (1 + (r / 100) / n) ** (n * t)
        return round(amount, 2), round(amount - p, 2)

    @staticmethod
    def gst(amount: Number, rate: Number, inclusive: bool = True) -> Tuple[float, float, float]:
        """Returns (base_amount, tax, total) consistently regardless of `inclusive`."""
        if rate < 0:
            raise ValueError("rate must be non-negative")
        if inclusive:
            base = amount / (1 + rate / 100)
            tax = amount - base
            total = float(amount)
        else:
            base = float(amount)
            tax = amount * (rate / 100)
            total = base + tax
        return round(base, 2), round(tax, 2), round(total, 2)

    @staticmethod
    def discount(price: Number, pct: Number) -> Tuple[float, float]:
        saved = price * (pct / 100)
        final = price - saved
        return round(saved, 2), round(final, 2)
