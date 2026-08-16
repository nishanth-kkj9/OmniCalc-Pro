from typing import Tuple, Union

Number = Union[int, float]


class FinanceEngine:
    @staticmethod
    def emi(principal: Number, annual_rate: Number, months: int) -> Tuple[float, float, float]:
        if annual_rate == 0:
            emi = principal / months
            return round(emi, 2), round(principal, 2), 0.0
        r = annual_rate / 12 / 100
        emi = principal * r * (1 + r)**months / ((1 + r)**months - 1)
        total_pay = emi * months
        interest = total_pay - principal
        return round(emi, 2), round(total_pay, 2), round(interest, 2)

    @staticmethod
    def compound_interest(p: Number, r: Number, n: int, t: int) -> Tuple[float, float]:
        amount = p * (1 + (r/100)/n)**(n*t)
        return round(amount, 2), round(amount - p, 2)

    @staticmethod
    def gst(amount: Number, rate: Number, inclusive: bool = True) -> Tuple[Union[Number, float], ...]:
        if inclusive:
            original = amount / (1 + rate/100)
            tax = amount - original
            return round(original, 2), round(tax, 2)
        else:
            tax = amount * (rate/100)
            return amount, round(tax, 2), round(amount + tax, 2)

    @staticmethod
    def discount(price: Number, pct: Number) -> Tuple[float, float]:
        saved = price * (pct/100)
        final = price - saved
        return round(saved, 2), round(final, 2)
