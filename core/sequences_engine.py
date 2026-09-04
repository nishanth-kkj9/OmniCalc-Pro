"""
OmniCalc Pro Sequences Engine (Python Desktop Parity)
"""

from typing import List, Dict, Any


class SequencesEngine:
    @staticmethod
    def arithmetic(a1: float, d: float, n_terms: int) -> List[Dict[str, float]]:
        terms = []
        running_sum = 0.0
        for n in range(1, n_terms + 1):
            an = a1 + (n - 1) * d
            running_sum += an
            terms.append({"n": n, "an": an, "Sn": running_sum})
        return terms

    @staticmethod
    def geometric(a1: float, r: float, n_terms: int) -> List[Dict[str, float]]:
        terms = []
        running_sum = 0.0
        for n in range(1, n_terms + 1):
            an = a1 * (r ** (n - 1))
            running_sum += an
            terms.append({"n": n, "an": an, "Sn": running_sum})
        return terms

    @staticmethod
    def fibonacci(n_terms: int) -> List[Dict[str, float]]:
        if n_terms <= 0:
            return []
        terms = []
        a, b = 1.0, 1.0
        running_sum = 0.0
        for n in range(1, n_terms + 1):
            an = a if n == 1 else b if n == 2 else 0.0
            if n > 2:
                an = terms[-1]["an"] + terms[-2]["an"]
            running_sum += an
            terms.append({"n": n, "an": an, "Sn": running_sum})
        return terms
